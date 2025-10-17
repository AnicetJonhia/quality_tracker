from pydantic import BaseModel
from datetime import datetime
from models.nce import NCEStatus, NCESeverity
from typing import Optional
from .file import FileResponse
from typing import List
from .delivery import DeliveryResponseWithProject



# Update NCE : tous les champs optionnels, patchable





class NCECreate(BaseModel):
    id: int
    delivery_id: int
    title: str
    description: Optional[str] = None
    severity: NCESeverity
    status: NCEStatus
    category: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    files: Optional[List[FileResponse]] = None

    class Config:
        from_attributes = True


class NCEUpdate(BaseModel):
    status: Optional[NCEStatus] = None
    severity: Optional[NCESeverity] = None
    category: Optional[str] = None


class NCEResponse(BaseModel):
    id: int
    delivery: Optional[DeliveryResponseWithProject] = None
    title: str
    description: str
    severity: NCESeverity
    status: NCEStatus
    category: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    files: Optional[List[FileResponse]] = None

    class Config:
        from_attributes = True