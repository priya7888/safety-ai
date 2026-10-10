from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class ResponseTask(Base):
    __tablename__ = "response_tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_reference = Column(String(50), unique=True, index=True, nullable=False) # e.g. TSK-REP-00101-1
    report_id = Column(Integer, ForeignKey("safety_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # One of the 6 official departments:
    # 'Mechanical Maintenance', 'Electrical Maintenance', 'Instrumentation & Control',
    # 'Fire & Rescue', 'Medical & Ambulance', 'HSE & Safety Investigation'
    department = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="P2 - High", nullable=False) # P1 - Critical, P2 - High, P3 - Medium, P4 - Low
    
    # Workflow status:
    # UNASSIGNED -> ASSIGNED -> ACCEPTED -> SUBMITTED_FOR_VERIFICATION -> VERIFIED / REWORK_REQUESTED
    status = Column(String(50), default="UNASSIGNED", nullable=False, index=True)
    
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_team_name = Column(String(100), nullable=True)
    
    # Atomic exclusive claim
    accepted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    accepted_at = Column(DateTime, nullable=True)
    
    # Work & Evidence submission
    work_notes = Column(Text, nullable=True)
    evidence_notes = Column(Text, nullable=True)
    evidence_file_url = Column(String(500), nullable=True)
    submitted_for_verification_at = Column(DateTime, nullable=True)
    
    # Admin verification & Rework
    verified_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rework_reason = Column(Text, nullable=True)
    rework_requested_at = Column(DateTime, nullable=True)
    
    due_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    safety_report = relationship("SafetyReport", back_populates="response_tasks")
    organization = relationship("Organization")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    accepted_by = relationship("User", foreign_keys=[accepted_by_user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])
