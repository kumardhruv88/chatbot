from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime

from ..database import get_db
from ..models.thread import Thread, Document
from ..schemas.thread import DocumentResponse
from ..services.document_processor import DocumentProcessor
from ..config import get_settings

router = APIRouter()
settings = get_settings()

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx", ".md"}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    thread_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document for RAG."""
    
    # Verify thread exists
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size} bytes"
        )
    
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process document
    try:
        processor = DocumentProcessor()
        await processor.process_and_store(
            file_path=file_path,
            thread_id=thread_id,
            filename=file.filename
        )
    except Exception as e:
        # Clean up file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )
    
    # Save document record
    document = Document(
        thread_id=thread_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_ext.lstrip('.')
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(thread_id: int, db: Session = Depends(get_db)):
    """List all documents for a thread."""
    documents = db.query(Document).filter(
        Document.thread_id == thread_id
    ).order_by(Document.upload_date.desc()).all()
    return documents


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document and its embeddings."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found"
        )
    
    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return None
