from typing import Optional, List
from pydantic import BaseModel

class LoginRequest(BaseModel):
    org_id: str
    email: str
    password: str

class CreateUserRequest(BaseModel):
    organization_id: Optional[str] = "id001"
    email: str
    password: str
    full_name: str
    role: Optional[str] = "NORMAL_USER"
    permissions: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: int
    organization_id: str
    email: str
    full_name: str
    role: str
    organization_name: Optional[str] = None
    is_admin: bool = False
    role_name: str = "Normal User"
    zone: Optional[str] = None
    assigned_admin_id: Optional[int] = None
    assigned_admin_name: Optional[str] = None
    permissions: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

