import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.organization import Organization
from ..models.user import User
import json
from typing import List, Optional
from ..schemas.auth import LoginRequest, TokenResponse, UserResponse, CreateUserRequest
from ..dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Predefined 5 Organizations
PRESET_ORGS = [
    {"id": "id001", "name": "Oil India Limited – Operational Safety Unit"},
    {"id": "id002", "name": "Offshore Rig Operations & Drilling Division"},
    {"id": "id003", "name": "Refinery & Petrochemical Processing Center"},
    {"id": "id004", "name": "Exploration & Production Field Command"},
    {"id": "id005", "name": "Cross-Country Gas Transmission & Integrity"},
]

# Predefined 4 Admins and their 10 Allocated Workers each (40 workers total)
PRESET_ADMINS = [
    {
        "org_id": "id001",
        "email": "admin1@gmail.com",
        "pass": "Admin1@123",
        "officer": "Rajesh Kumar (Rig Ops Lead)",
        "role": "ADMINISTRATOR",
        "zone": "Rig Operations"
    },
    {
        "org_id": "id002",
        "email": "admin2@gmail.com",
        "pass": "Admin2@123",
        "officer": "Priya Sharma (Refinery Plant Lead)",
        "role": "ADMINISTRATOR",
        "zone": "Refinery Processing"
    },
    {
        "org_id": "id003",
        "email": "admin3@gmail.com",
        "pass": "Admin3@123",
        "officer": "Vikram Malhotra (Pipeline Network Lead)",
        "role": "ADMINISTRATOR",
        "zone": "Pipeline Transmission"
    },
    {
        "org_id": "id004",
        "email": "admin4@gmail.com",
        "pass": "Admin4@123",
        "officer": "Sunita Rao (Hazmat Storage Lead)",
        "role": "ADMINISTRATOR",
        "zone": "Hazmat Storage"
    },
]

# Generate 10 workers for each of the 4 admins (40 workers total)
PRESET_WORKERS = []

# Admin 1 Team: Workers 1..10 (Rig Operations)
for i in range(1, 11):
    PRESET_WORKERS.append({
        "org_id": "id001",
        "email": f"worker{i}@gmail.com",
        "pass": "Worker@123",
        "officer": f"Field Tech {i:02d} (Rig Ops)",
        "role": "NORMAL_USER",
        "zone": "Rig Operations",
        "assigned_admin_email": "admin1@gmail.com"
    })

# Admin 2 Team: Workers 11..20 (Refinery Processing)
for i in range(11, 21):
    PRESET_WORKERS.append({
        "org_id": "id002",
        "email": f"worker{i}@gmail.com",
        "pass": "Worker@123",
        "officer": f"Refinery Operator {i:02d}",
        "role": "NORMAL_USER",
        "zone": "Refinery Processing",
        "assigned_admin_email": "admin2@gmail.com"
    })

# Admin 3 Team: Workers 21..30 (Pipeline Transmission)
for i in range(21, 31):
    PRESET_WORKERS.append({
        "org_id": "id003",
        "email": f"worker{i}@gmail.com",
        "pass": "Worker@123",
        "officer": f"Pipeline Specialist {i:02d}",
        "role": "NORMAL_USER",
        "zone": "Pipeline Transmission",
        "assigned_admin_email": "admin3@gmail.com"
    })

# Admin 4 Team: Workers 31..40 (Hazmat Storage)
for i in range(31, 41):
    PRESET_WORKERS.append({
        "org_id": "id004",
        "email": f"worker{i}@gmail.com",
        "pass": "Worker@123",
        "officer": f"Terminal Safety Tech {i:02d}",
        "role": "NORMAL_USER",
        "zone": "Hazmat Storage",
        "assigned_admin_email": "admin4@gmail.com"
    })

# Backward compatibility alias: user1@gmail.com -> points to worker1
LEGACY_ALIASES = [
    {"org_id": "id001", "email": "user1@gmail.com", "pass": "User1@123", "officer": "Field Tech 01 (Rig Ops)", "role": "NORMAL_USER", "zone": "Rig Operations", "assigned_admin_email": "admin1@gmail.com"}
]

def ensure_initial_seed(db: Session):
    """Ensures authorized organizations, 4 admins, and 40 allocated workers (10 per admin) exist in the DB."""
    for org_info in PRESET_ORGS:
        org = db.query(Organization).filter(Organization.id == org_info["id"]).first()
        if not org:
            org = Organization(id=org_info["id"], name=org_info["name"])
            db.add(org)
            db.commit()
            db.refresh(org)
        elif org.name != org_info["name"]:
            org.name = org_info["name"]
            db.commit()
    
    # 1. Seed or update 4 Admins
    admin_id_map = {}
    for a_info in PRESET_ADMINS:
        admin_user = db.query(User).filter(User.email == a_info["email"]).first()
        if not admin_user:
            admin_user = User(
                organization_id=a_info["org_id"],
                email=a_info["email"],
                password=a_info["pass"],
                full_name=a_info["officer"],
                role=a_info["role"],
                zone=a_info["zone"]
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            admin_user.password = a_info["pass"]
            admin_user.role = a_info["role"]
            admin_user.full_name = a_info["officer"]
            admin_user.organization_id = a_info["org_id"]
            admin_user.zone = a_info["zone"]
            db.commit()
            db.refresh(admin_user)
        admin_id_map[a_info["email"]] = admin_user.id

    # 2. Seed or update 40 Workers allocated to respective Admins
    all_workers = PRESET_WORKERS + LEGACY_ALIASES
    for w_info in all_workers:
        assigned_admin_id = admin_id_map.get(w_info.get("assigned_admin_email"))
        worker_user = db.query(User).filter(User.email == w_info["email"]).first()
        if not worker_user:
            worker_user = User(
                organization_id=w_info["org_id"],
                email=w_info["email"],
                password=w_info["pass"],
                full_name=w_info["officer"],
                role=w_info["role"],
                zone=w_info["zone"],
                assigned_admin_id=assigned_admin_id
            )
            db.add(worker_user)
            db.commit()
        else:
            worker_user.password = w_info["pass"]
            worker_user.role = w_info["role"]
            worker_user.full_name = w_info["officer"]
            worker_user.organization_id = w_info["org_id"]
            worker_user.zone = w_info["zone"]
            worker_user.assigned_admin_id = assigned_admin_id
            db.commit()

def calculate_role_info(role: str, email: str, custom_permissions_str: Optional[str] = None):
    is_normal = role in ["NORMAL_USER", "FIELD_OPERATOR", "SAFETY_OFFICER"] or "user" in email.lower()
    is_admin = not is_normal and (
        role in ["ADMINISTRATOR", "CHIEF_HSE_AUDITOR", "ADMIN"] or 
        "admin" in email.lower()
    )
    role_name = "Administrator" if is_admin else ("Normal User" if role == "NORMAL_USER" else role.replace("_", " ").title())
    
    if custom_permissions_str:
        try:
            perms = json.loads(custom_permissions_str)
            if isinstance(perms, list) and len(perms) > 0:
                return is_admin, role_name, perms
        except Exception:
            perms = [p.strip() for p in custom_permissions_str.split(",") if p.strip()]
            if perms:
                return is_admin, role_name, perms

    permissions = (
        ["ALL", "MANAGE_USERS", "SETTINGS", "REPORTS_EDIT", "AUDIT", "VIEW_DASHBOARD", "RESET_DATA", "UPDATE_PRECURSOR_STATUS"]
        if is_admin else
        ["VIEW_DASHBOARD", "SUBMIT_OBSERVATION", "VIEW_REPORTS", "VIEW_SIGNALS"]
    )
    return is_admin, role_name, permissions

def serialize_user_response(u: User) -> UserResponse:
    is_admin, role_name, permissions = calculate_role_info(u.role, u.email, getattr(u, "permissions", None))
    assigned_admin_name = u.supervisor.full_name if getattr(u, "supervisor", None) else None
    return UserResponse(
        id=u.id,
        organization_id=u.organization_id,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_admin=is_admin,
        role_name=role_name,
        zone=getattr(u, "zone", None),
        assigned_admin_id=getattr(u, "assigned_admin_id", None),
        assigned_admin_name=assigned_admin_name,
        permissions=permissions,
        organization_name=u.organization.name if u.organization else None
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ensure_initial_seed(db)
    
    org_id_clean = payload.org_id.strip().lower()
    email_clean = payload.email.strip().lower()
    
    user = db.query(User).filter(
        User.organization_id == org_id_clean,
        User.email == email_clean
    ).first()

    # Fallback match by email directly if org_id matches user's org or default id001
    if not user:
        candidate = db.query(User).filter(User.email == email_clean).first()
        if candidate and (candidate.organization_id.lower() == org_id_clean or org_id_clean in ["id001", "oil india limited"]):
            user = candidate

    if not user or user.password != payload.password.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Organization ID, Email, or Password."
        )

    is_admin, role_name, permissions = calculate_role_info(user.role, user.email, getattr(user, "permissions", None))

    # Issue JWT token containing verified user ID and organization ID
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_claims = {
        "sub": str(user.id),
        "org_id": user.organization_id,
        "email": user.email,
        "role": user.role,
        "is_admin": is_admin,
        "exp": expire
    }
    encoded_jwt = jwt.encode(token_claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return TokenResponse(
        access_token=encoded_jwt,
        token_type="bearer",
        user=serialize_user_response(user)
    )

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return serialize_user_response(current_user)

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all registered users and provisioned logins for the platform."""
    ensure_initial_seed(db)
    users = db.query(User).order_by(User.id.desc()).all()
    return [serialize_user_response(u) for u in users]


@router.post("/users", response_model=UserResponse)
def create_or_update_user(payload: CreateUserRequest, db: Session = Depends(get_db)):
    """Admin manually provisions or updates a user login with credentials, role, and permissions."""
    ensure_initial_seed(db)

    clean_email = payload.email.strip().lower()
    clean_pass = payload.password.strip()
    clean_name = payload.full_name.strip()
    clean_org = (payload.organization_id or "id001").strip().lower()
    clean_role = (payload.role or "NORMAL_USER").strip().upper()

    if not clean_email or not clean_pass or not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full Name, Email/Login ID, and Password are all required."
        )

    # Ensure organization exists
    org = db.query(Organization).filter(Organization.id == clean_org).first()
    if not org:
        org = Organization(id=clean_org, name="Oil India Limited – Operational Safety Unit")
        db.add(org)
        db.commit()
        db.refresh(org)

    perms_str = json.dumps(payload.permissions) if payload.permissions else None

    # Check if user already exists
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        user.full_name = clean_name
        user.password = clean_pass
        user.role = clean_role
        user.organization_id = clean_org
        user.permissions = perms_str
        db.commit()
        db.refresh(user)
    else:
        user = User(
            organization_id=clean_org,
            email=clean_email,
            password=clean_pass,
            full_name=clean_name,
            role=clean_role,
            permissions=perms_str
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    is_admin, role_name, permissions = calculate_role_info(user.role, user.email, getattr(user, "permissions", None))

    return UserResponse(
        id=user.id,
        organization_id=user.organization_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_admin=is_admin,
        role_name=role_name,
        permissions=permissions,
        organization_name=user.organization.name if user.organization else None
    )

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deletes a provisioned user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
    
    if user.email in ["admin1@gmail.com", "admin2@gmail.com"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary default administrator accounts cannot be deleted."
        )

    email = user.email
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User account {email} has been deleted successfully."}


