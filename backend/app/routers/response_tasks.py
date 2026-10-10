import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.safety_report import SafetyReport
from ..models.ai_analysis import AIAnalysis
from ..models.response_task import ResponseTask
from ..schemas.response_task import (
    ResponseTaskCreate,
    ResponseTaskResponse,
    ResponseTaskSubmitVerificationRequest,
    ResponseTaskVerifyRequest,
    ResponseTaskRecommendation
)

router = APIRouter(prefix="/api/tasks", tags=["Response Team Tasks"])

DEPARTMENT_DIRECTORY = [
    "Mechanical Maintenance",
    "Electrical Maintenance",
    "Instrumentation & Control",
    "Fire & Rescue",
    "Medical & Ambulance",
    "HSE & Safety Investigation"
]

def serialize_task_model(task: ResponseTask) -> ResponseTaskResponse:
    report = task.safety_report
    return ResponseTaskResponse(
        id=task.id,
        task_reference=task.task_reference,
        report_id=task.report_id,
        report_reference=report.report_reference if report else None,
        report_name=report.incident_location_name or (f"Report #{report.id}" if report else None),
        organization_id=task.organization_id,
        department=task.department,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_by_name=task.assigned_by.full_name if task.assigned_by else None,
        assigned_team_name=task.assigned_team_name or task.department,
        accepted_by_user_id=task.accepted_by_user_id,
        accepted_by_name=task.accepted_by.full_name if task.accepted_by else None,
        accepted_at=task.accepted_at,
        work_notes=task.work_notes,
        evidence_notes=task.evidence_notes,
        evidence_file_url=task.evidence_file_url,
        submitted_for_verification_at=task.submitted_for_verification_at,
        verified_by_name=task.verified_by.full_name if task.verified_by else None,
        verified_at=task.verified_at,
        rework_reason=task.rework_reason,
        rework_requested_at=task.rework_requested_at,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        location=report.location if report else None
    )

def recommend_departments_for_report(report: SafetyReport, ai: Optional[AIAnalysis] = None) -> List[ResponseTaskRecommendation]:
    """
    Intelligent AI routing rules that recommend response teams based on
    incident category, physical equipment context, barrier failure, and high-energy vectors.
    """
    desc = (report.description or "").lower()
    hazard = (ai.identified_hazard if ai else "").lower()
    energy = (ai.energy_source if ai else "").lower()

    recommendations = []

    # 1. Electrical Maintenance
    if any(k in desc or k in hazard or k in energy for k in ["electric", "415v", "cable", "switchboard", "breaker", "substation", "panel", "wire", "arcing", "shock"]):
        recommendations.append(ResponseTaskRecommendation(
            department="Electrical Maintenance",
            confidence=0.96,
            rationale="Detected electrical high-energy vector, live conduit, or switchboard failure requiring certified electrical isolation and breaker repair.",
            hazard="Live Electrical Arc / Overheating",
            energy_vector="Electrical High-Voltage Energy"
        ))

    # 2. Fire & Rescue
    if any(k in desc or k in hazard or k in energy for k in ["fire", "flame", "smoke", "sparks", "welding", "explosion", "flammable", "burn", "ignit"]):
        recommendations.append(ResponseTaskRecommendation(
            department="Fire & Rescue",
            confidence=0.95,
            rationale="Identified active thermal radiation, open flame hazard, or combustible hot work requiring immediate fire containment and boundary cooling.",
            hazard="Thermal / Fire Outbreak",
            energy_vector="Thermal Radiation & Ignition"
        ))

    # 3. Mechanical Maintenance
    if any(k in desc or k in hazard or k in energy for k in ["pipeline", "flange", "valve", "compressor", "pump", "engine", "hydraulic", "pressure", "leak", "rupture", "gasket", "bearing"]):
        recommendations.append(ResponseTaskRecommendation(
            department="Mechanical Maintenance",
            confidence=0.93,
            rationale="Physical pressure boundary breach, rotating asset vibration, or mechanical flange rupture requiring pipe fitting and torque verification.",
            hazard="Pressurized Line Rupture / Mechanical Failure",
            energy_vector="High-Pressure Hydrocarbon Vector"
        ))

    # 4. Instrumentation & Control
    if any(k in desc or k in hazard for k in ["sensor", "alarm", "detector", "scada", "plc", "transmitter", "gauge", "calibration", "tripped"]):
        recommendations.append(ResponseTaskRecommendation(
            department="Instrumentation & Control",
            confidence=0.91,
            rationale="Automated barrier or gas detector malfunction identified requiring sensor recalibration and ESD safety interlock testing.",
            hazard="Control Loop & Gas Detection Failure",
            energy_vector="Process Control Instrumentation"
        ))

    # 5. Medical & Ambulance
    if any(k in desc for k in ["injur", "casualty", "unconscious", "first aid", "hospital", "ambulance", "bleeding", "medic"]):
        recommendations.append(ResponseTaskRecommendation(
            department="Medical & Ambulance",
            confidence=0.98,
            rationale="Frontline personnel injury or toxic inhalation exposure reported requiring urgent onsite paramedic dispatch and triage.",
            hazard="Personnel Exposure / Medical Trauma",
            energy_vector="Biomedical / Ergonomic Energy"
        ))

    # 6. HSE & Safety Investigation (Default for serious near-miss / LSR audit)
    recommendations.append(ResponseTaskRecommendation(
        department="HSE & Safety Investigation",
        confidence=0.88,
        rationale="Mandatory root-cause safety investigation, Life-Saving Rule compliance verification, and critical barrier integrity audit.",
        hazard="Systemic Safety Deviation",
        energy_vector="Administrative / Barrier Integrity"
    ))

    # Sort descending by confidence
    recommendations.sort(key=lambda x: x.confidence, reverse=True)
    return recommendations

@router.get("", response_model=List[ResponseTaskResponse])
def get_response_tasks(
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    report_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches all response tasks filtered by user organization, department, and status."""
    query = db.query(ResponseTask).filter(ResponseTask.organization_id == current_user.organization_id)

    if department and department != "ALL":
        query = query.filter(ResponseTask.department == department)
    if status_filter and status_filter != "ALL":
        query = query.filter(ResponseTask.status == status_filter)
    if report_id:
        query = query.filter(ResponseTask.report_id == report_id)

    tasks = query.order_by(ResponseTask.created_at.desc()).all()
    return [serialize_task_model(t) for t in tasks]

@router.get("/recommend/{report_id}", response_model=List[ResponseTaskRecommendation])
def get_task_recommendation(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns AI-recommended response departments for a given safety incident report."""
    report = db.query(SafetyReport).filter(
        SafetyReport.id == report_id,
        SafetyReport.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Safety report not found in this organization.")

    ai = db.query(AIAnalysis).filter(AIAnalysis.report_id == report_id).first()
    return recommend_departments_for_report(report, ai)

@router.get("/summary/kpis")
def get_task_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns organization-level CAPA and response task metrics."""
    tasks = db.query(ResponseTask).filter(ResponseTask.organization_id == current_user.organization_id).all()
    
    total = len(tasks)
    unassigned = sum(1 for t in tasks if t.status in ["UNASSIGNED", "ASSIGNED"])
    in_progress = sum(1 for t in tasks if t.status == "ACCEPTED")
    awaiting_verification = sum(1 for t in tasks if t.status == "SUBMITTED_FOR_VERIFICATION")
    rework_requested = sum(1 for t in tasks if t.status == "REWORK_REQUESTED")
    verified = sum(1 for t in tasks if t.status == "VERIFIED")

    dept_counts = {}
    for d in DEPARTMENT_DIRECTORY:
        dept_counts[d] = sum(1 for t in tasks if t.department == d)

    return {
        "total_tasks": total,
        "unassigned_or_awaiting_claim": unassigned,
        "in_progress": in_progress,
        "awaiting_verification": awaiting_verification,
        "rework_requested": rework_requested,
        "verified_and_closed": verified,
        "department_distribution": dept_counts
    }

@router.post("", response_model=ResponseTaskResponse, status_code=status.HTTP_201_CREATED)
def create_response_task(
    payload: ResponseTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin assigns a corrective action task to a response department.
    Supports creating multiple linked tasks under a single incident.
    """
    report = db.query(SafetyReport).filter(
        SafetyReport.id == payload.report_id,
        SafetyReport.organization_id == current_user.organization_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Safety report not found in this organization.")

    if payload.department not in DEPARTMENT_DIRECTORY:
        raise HTTPException(status_code=400, detail=f"Invalid department. Must be one of: {', '.join(DEPARTMENT_DIRECTORY)}")

    # Generate task reference
    task_count = db.query(ResponseTask).filter(ResponseTask.report_id == payload.report_id).count()
    dept_slug = "".join([w[0].upper() for w in payload.department.split()[:2]])
    task_ref = f"TSK-{report.report_reference}-{dept_slug}{task_count + 1}"

    new_task = ResponseTask(
        task_reference=task_ref,
        report_id=payload.report_id,
        organization_id=current_user.organization_id,
        department=payload.department,
        title=payload.title,
        description=payload.description,
        priority=payload.priority or "P2 - High",
        status="ASSIGNED",
        assigned_by_id=current_user.id,
        assigned_team_name=payload.assigned_team_name or payload.department,
        due_date=payload.due_date or datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(new_task)

    # Update parent report status if currently Open
    if report.status == "Open":
        report.status = "In Progress"

    db.commit()
    db.refresh(new_task)
    return serialize_task_model(new_task)

@router.post("/{task_id}/accept", response_model=ResponseTaskResponse)
def accept_task_atomically(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atomic Exclusive Acceptance:
    A responder claims the task. If already accepted by another user,
    rejects with HTTP 409 Conflict. Once claimed, other responders cannot accept it.
    """
    task = db.query(ResponseTask).filter(
        ResponseTask.id == task_id,
        ResponseTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Response task not found.")

    # Exclusive Claim Lock check
    if task.accepted_by_user_id and task.accepted_by_user_id != current_user.id:
        responder_name = task.accepted_by.full_name if task.accepted_by else f"User #{task.accepted_by_user_id}"
        accepted_time_str = task.accepted_at.strftime("%Y-%m-%d %H:%M UTC") if task.accepted_at else "previously"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task has already been exclusively claimed by {responder_name} ({accepted_time_str}). Multiple responders cannot accept the same task."
        )

    task.accepted_by_user_id = current_user.id
    task.accepted_at = datetime.utcnow()
    task.status = "ACCEPTED"
    db.commit()
    db.refresh(task)
    return serialize_task_model(task)

@router.post("/{task_id}/submit-verification", response_model=ResponseTaskResponse)
def submit_task_for_verification(
    task_id: int,
    payload: ResponseTaskSubmitVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Responder reports work completion, uploads evidence notes and documentation,
    and submits for official Admin / Verifier sign-off.
    """
    task = db.query(ResponseTask).filter(
        ResponseTask.id == task_id,
        ResponseTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Response task not found.")

    if not payload.work_notes or not payload.work_notes.strip():
        raise HTTPException(status_code=400, detail="Work notes detailing the corrective action are required.")

    task.work_notes = payload.work_notes.strip()
    task.evidence_notes = (payload.evidence_notes or "").strip()
    task.evidence_file_url = payload.evidence_file_url
    task.status = "SUBMITTED_FOR_VERIFICATION"
    task.submitted_for_verification_at = datetime.utcnow()

    # If not previously claimed, assign to submitter
    if not task.accepted_by_user_id:
        task.accepted_by_user_id = current_user.id
        task.accepted_at = datetime.utcnow()

    # Update parent report status
    if task.safety_report:
        task.safety_report.status = "Verification Pending"

    db.commit()
    db.refresh(task)
    return serialize_task_model(task)

@router.post("/{task_id}/verify", response_model=ResponseTaskResponse)
def verify_task_by_admin(
    task_id: int,
    payload: ResponseTaskVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin / Authorized Verifier reviews completed work:
    - If decision == 'APPROVE': Marks task VERIFIED. If all linked tasks for the incident are verified, officially CLOSES the parent incident report.
    - If decision == 'REWORK': Records required rework notes and returns task to response team for correction.
    """
    task = db.query(ResponseTask).filter(
        ResponseTask.id == task_id,
        ResponseTask.organization_id == current_user.organization_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Response task not found.")

    decision_norm = payload.decision.upper()

    if decision_norm == "APPROVE":
        task.status = "VERIFIED"
        task.verified_by_user_id = current_user.id
        task.verified_at = datetime.utcnow()
        task.rework_reason = None

        # Check multi-task coordination rule:
        # Incident can ONLY be closed when ALL sibling tasks are verified!
        all_sibling_tasks = db.query(ResponseTask).filter(
            ResponseTask.report_id == task.report_id,
            ResponseTask.organization_id == current_user.organization_id
        ).all()

        all_verified = all(t.status == "VERIFIED" for t in all_sibling_tasks)
        if all_verified and task.safety_report:
            task.safety_report.status = "Closed"

    elif decision_norm == "REWORK":
        if not payload.rework_reason or not payload.rework_reason.strip():
            raise HTTPException(status_code=400, detail="Rework explanation is required when requesting rework.")

        task.status = "REWORK_REQUESTED"
        task.rework_reason = payload.rework_reason.strip()
        task.rework_requested_at = datetime.utcnow()

        if task.safety_report:
            task.safety_report.status = "In Progress"

    else:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVE' or 'REWORK'.")

    db.commit()
    db.refresh(task)
    return serialize_task_model(task)
