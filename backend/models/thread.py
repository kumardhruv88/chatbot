from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Thread(Base):
    """Conversation thread model."""
    __tablename__ = "threads"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    thread_metadata = Column(JSON, default={})
    
    # Relationships
    messages = relationship("Message", back_populates="thread", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="thread", cascade="all, delete-orphan")


class Message(Base):
    """Chat message model."""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, default=[])  # List of document names or URLs
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    thread = relationship("Thread", back_populates="messages")


class Document(Base):
    """Uploaded document model."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("threads.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, txt, docx, md
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    thread = relationship("Thread", back_populates="documents")
