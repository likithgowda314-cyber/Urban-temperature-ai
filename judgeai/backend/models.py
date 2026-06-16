from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime, timezone
from database import Base

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, index=True)
    date = Column(String)
    petitioner = Column(String)
    respondent = Column(String)
    directions = Column(JSON)
    deadline = Column(String)
    department = Column(String)
    confidence = Column(JSON)
    reviewer_name = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, index=True, nullable=True) # Null for initial extraction
    action = Column(String) # 'extraction', 'approval'
    ai_values = Column(JSON)
    approved_values = Column(JSON, nullable=True)
    reviewer_name = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
