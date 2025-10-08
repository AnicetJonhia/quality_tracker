from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base

class DeliveryFile(Base):
    __tablename__ = "delivery_files"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    checksum = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    delivery = relationship("Delivery", back_populates="files")
