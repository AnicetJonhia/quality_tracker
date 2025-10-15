from sqlalchemy import Column, Integer, String,Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    nce_id = Column(Integer, ForeignKey("nces.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_receipt = Column(Boolean, default=False)

    # Relations inverses
    nce = relationship("NCE", back_populates="files")
    delivery = relationship("Delivery", back_populates="files")



