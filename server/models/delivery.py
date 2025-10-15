from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class DeliveryStatus(str, enum.Enum):
    draft = "draft"
    deliverd = "delivered"
    approved = "approved"
    rejected = "rejected"


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.draft, index=True)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivered_at = Column(DateTime)
    receipt_url = Column(String)
    checksum = Column(String)

    project = relationship("Project", back_populates="deliveries")
    created_by_user = relationship("User", back_populates="deliveries", foreign_keys=[created_by])
    files = relationship("File", back_populates="delivery")
    surveys = relationship("Survey", back_populates="delivery")
    nces = relationship("NCE", back_populates="delivery")
