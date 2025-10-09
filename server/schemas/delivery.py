from pydantic import BaseModel
from datetime import datetime
from models.delivery import DeliveryStatus
from typing import Optional

class DeliveryCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None

class DeliveryResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: DeliveryStatus
    version: int
    created_at: datetime
    delivered_at: Optional[datetime]

    class Config:
        from_attributes = True