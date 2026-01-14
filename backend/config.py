from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite:///./chatbot.db"
    
    # API Keys
    groq_api_key: str
    tavily_api_key: str
    pollinations_api_key: str = None
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    
    # Upload Configuration
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760  # 10MB
    
    # Vector Database (FAISS)
    chroma_persist_dir: str = "./chroma_db"  # We keep the name for compatibility
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
