from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import asyncio

from ..database import get_db
from ..models.thread import Thread, Message
from ..schemas.thread import ChatRequest
from ..services.llm_service import LLMService
from ..services.rag_service import RAGService
from ..services.search_service import SearchService

router = APIRouter()


@router.post("/")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a chat message and get streaming response."""
    
    # Verify thread exists
    thread = db.query(Thread).filter(Thread.id == request.thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {request.thread_id} not found"
        )
    
    # Save user message
    user_message = Message(
        thread_id=request.thread_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()
    
    async def generate_response():
        """Generate streaming response."""
        try:
            # Initialize services
            rag_service = RAGService()
            search_service = SearchService()
            llm_service = LLMService()
            
            context = ""
            sources = []
            
            # Get RAG context if documents exist
            # Check if there are any documents for this thread first to avoid unnecessary status
            has_docs = await rag_service.has_documents(request.thread_id)
            if has_docs:
                yield f"data: {json.dumps({'type': 'status', 'content': 'Reading documents...', 'icon': 'file'})}\n\n"
                rag_results = await rag_service.retrieve_context(
                    query=request.message,
                    thread_id=request.thread_id
                )
                if rag_results["context"]:
                    context += f"\n\nRelevant document excerpts:\n{rag_results['context']}"
                    sources.extend(rag_results["sources"])
            
            # Get web search results if enabled
            if request.enable_search:
                yield f"data: {json.dumps({'type': 'status', 'content': 'Searching the web...', 'icon': 'globe'})}\n\n"
                search_results = await search_service.search(request.message)
                if search_results["context"]:
                    context += f"\n\nWeb search results:\n{search_results['context']}"
                    sources.extend(search_results["sources"])
            
            # Send sources if available
            if sources:
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
            
            # Get conversation history
            messages = db.query(Message).filter(
                Message.thread_id == request.thread_id
            ).order_by(Message.timestamp.desc()).limit(10).all()
            messages.reverse()
            
            # Stream LLM response
            yield f"data: {json.dumps({'type': 'status', 'content': 'Thinking...', 'icon': 'brain'})}\n\n"
            full_response = ""
            async for token in llm_service.stream_chat(
                message=request.message,
                context=context,
                image_data=request.image,
                history=messages[:-1]  # Exclude the last message (current user message)
            ):
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            
            # Save assistant message
            assistant_message = Message(
                thread_id=request.thread_id,
                role="assistant",
                content=full_response,
                sources=sources
            )
            db.add(assistant_message)
            db.commit()
            
            # Auto-generate thread title if this is the first message
            # Check if thread has only 2 messages (1 user + 1 assistant = first exchange)
            message_count = db.query(Message).filter(
                Message.thread_id == request.thread_id
            ).count()
            
            if message_count == 2:  # First exchange complete
                try:
                    # Generate title based on first user message
                    new_title = await llm_service.generate_title(request.message)
                    thread.title = new_title
                    db.commit()
                except Exception as e:
                    print(f"Error generating title: {e}")
                    # Continue even if title generation fails
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'error': error_msg})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
