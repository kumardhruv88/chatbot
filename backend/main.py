from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from .config import get_settings
from .database import init_db
from .routers import threads, chat, documents

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    print("Initializing database...")
    init_db()
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.faiss_persist_dir, exist_ok=True)
    
    print(f"Server starting on {settings.backend_host}:{settings.backend_port}")
    yield
    # Shutdown
    print("Server shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Conversational AI Chat API",
    description="Production-ready conversational AI with RAG and web search",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow Vercel frontend URLs
allowed_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add pattern matching for Vercel preview URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Conversational AI Chat API is running"
    }


# Include routers
app.include_router(threads.router, prefix="/api/threads", tags=["Threads"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True
    )
