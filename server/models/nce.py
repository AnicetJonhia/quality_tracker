from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class NCEStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class NCESeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    CRITICAL = "critical"

class NCE(Base):
    __tablename__ = "nces"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(NCESeverity), default=NCESeverity.MEDIUM, index=True)
    status = Column(SQLEnum(NCEStatus), default=NCEStatus.OPEN, index=True)
    category = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime)
    

    delivery = relationship("Delivery", back_populates="nces")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="nces_created")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to], back_populates="nces_assigned")
