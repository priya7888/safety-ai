from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ResponseTaskCreate(BaseModel):
    report_id: int
    department: str
    title: str
    description: str
    priority: Optional[str] = "P2 - High"
    assigned_team_name: Optional[str] = None
    due_date: Optional[str] = None

class ResponseTaskSubmitVerificationRequest(BaseModel):
    work_notes: str
    evidence_notes: Optional[str] = None
    evidence_file_url: Optional[str] = None

class ResponseTaskVerifyRequest(BaseModel):
    decision: str  # "APPROVE" or "REWORK"
    rework_reason: Optional[str] = None

class ResponseTaskResponse(BaseModel):
    id: int
    task_reference: str
    report_id: int
    report_reference: Optional[str] = None
    report_name: Optional[str] = None
    organization_id: str
    department: str
    title: str
    description: str
    priority: str
    status: str
    assigned_by_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    accepted_by_user_id: Optional[int] = None
    accepted_by_name: Optional[str] = None
    accepted_at: Optional[datetime] = None
    work_notes: Optional[str] = None
    evidence_notes: Optional[str] = None
    evidence_file_url: Optional[str] = None
    submitted_for_verification_at: Optional[datetime] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    rework_reason: Optional[str] = None
    rework_requested_at: Optional[datetime] = None
    due_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    location: Optional[str] = None

    class Config:
        from_attributes = True

class ResponseTaskRecommendation(BaseModel):
    department: str
    confidence: float
    rationale: str
    hazard: Optional[str] = None
    energy_vector: Optional[str] = None
