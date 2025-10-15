# schemas/file.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    filename: str
    storage_key: str
    is_receipt: bool = False

class FileResponse(FileBase):
    id: int
    uploaded_at: datetime

    class Config:
        orm_mode = True
