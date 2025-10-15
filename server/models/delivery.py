from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class DeliveryStatus(str, enum.Enum):
    DRAFT = "draft"
    DELIVERED = "delivered"
    APPROVED = "approved"
    REJECTED = "rejected"


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.DRAFT, index=True)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivered_at = Column(DateTime)


    project = relationship("Project", back_populates="deliveries")
    created_by_user = relationship("User", back_populates="deliveries", foreign_keys=[created_by])
    files = relationship("File", back_populates="delivery", cascade="all, delete")
    surveys = relationship("Survey", back_populates="delivery")
    nces = relationship("NCE", back_populates="delivery")
