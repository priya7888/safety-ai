from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False) # In production we hash; matching simple auth credentials
    full_name = Column(String(100), default="Safety Officer")
    role = Column(String(50), default="HSE_OFFICER")
    mode = Column(String(50), default="Field Operations")
    zone = Column(String(100), nullable=True) # e.g. "Rig Operations", "Refinery Processing"
    assigned_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    permissions = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    safety_reports = relationship("SafetyReport", foreign_keys="[SafetyReport.user_id]", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")
    supervisor = relationship("User", remote_side=[id], foreign_keys=[assigned_admin_id], backref="assigned_workers")
