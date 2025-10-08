from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    QUALITY = "quality"
    PRODUCER = "producer"
    CLIENT = "client"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.PRODUCER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deliveries = relationship("Delivery", back_populates="created_by_user", foreign_keys="Delivery.created_by")
    surveys = relationship("Survey", back_populates="user")
    nces_created = relationship("NCE", foreign_keys="NCE.created_by", back_populates="created_by_user")
    nces_assigned = relationship("NCE", foreign_keys="NCE.assigned_to", back_populates="assigned_to_user")
    notifications = relationship("Notification", back_populates="user")
