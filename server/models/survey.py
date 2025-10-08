from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.base import Base

class SurveyType(str, enum.Enum):
    NPS = "nps"
    CSAT = "csat"

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    survey_type = Column(SQLEnum(SurveyType), nullable=False)
    score = Column(Integer)
    comment = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    delivery = relationship("Delivery", back_populates="surveys")
    user = relationship("User", back_populates="surveys")
