from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.thread import Thread, Message
from ..schemas.thread import ThreadCreate, ThreadUpdate, ThreadResponse

router = APIRouter()


@router.get("/", response_model=List[ThreadResponse])
async def list_threads(db: Session = Depends(get_db)):
    """Get all conversation threads."""
    threads = db.query(Thread).order_by(Thread.updated_at.desc()).all()
    return threads


@router.post("/", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(thread_data: ThreadCreate, db: Session = Depends(get_db)):
    """Create a new conversation thread."""
    thread = Thread(title=thread_data.title)
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(thread_id: int, db: Session = Depends(get_db)):
    """Get a specific thread with all messages and documents."""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    return thread


@router.patch("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: int, 
    thread_update: ThreadUpdate, 
    db: Session = Depends(get_db)
):
    """Update thread title."""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    if thread_update.title:
        thread.title = thread_update.title
    
    db.commit()
    db.refresh(thread)
    return thread


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(thread_id: int, db: Session = Depends(get_db)):
    """Delete a thread and all associated messages and documents."""
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    db.delete(thread)
    db.commit()
    return None
