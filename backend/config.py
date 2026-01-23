from pydantic_settings import BaseSettings
from functools import lru_cache
import os

# Check if running in production (Railway or Render)
IS_PRODUCTION = os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RENDER')
DATA_DIR = '/tmp' if IS_PRODUCTION else '.'


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database - use /tmp for production (Railway/Render have limited writable dirs)
    database_url: str = f"sqlite:///{DATA_DIR}/chatbot.db"
    
    # API Keys
    groq_api_key: str
    tavily_api_key: str
    pollinations_api_key: str = None
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    
    # Upload Configuration - use /tmp for production
    upload_dir: str = f"{DATA_DIR}/uploads"
    max_file_size: int = 10485760  # 10MB
    
    # Vector Database (FAISS) - use /tmp for production
    faiss_persist_dir: str = f"{DATA_DIR}/faiss_db"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
