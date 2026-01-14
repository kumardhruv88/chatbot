from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any


class ThreadCreate(BaseModel):
    """Schema for creating a new thread."""
    title: str = Field(..., min_length=1, max_length=255)


class ThreadUpdate(BaseModel):
    """Schema for updating a thread."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    thread_id: int
    role: str
    content: str
    sources: List[str] = []
    timestamp: datetime
    
    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    """Schema for document response."""
    id: int
    thread_id: int
    filename: str
    file_type: str
    upload_date: datetime
    
    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    """Schema for thread response."""
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    thread_metadata: dict = {}
    messages: List[MessageResponse] = []
    documents: List[DocumentResponse] = []
    
    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Schema for chat message request."""
    message: str = Field(..., min_length=1)
    thread_id: int
    enable_search: bool = False
    image: Optional[str] = None


class ChatStreamResponse(BaseModel):
    """Schema for streaming chat response."""
    type: str  # 'token', 'sources', 'done', 'error'
    content: Optional[str] = None
    sources: Optional[List[str]] = None
    error: Optional[str] = None
