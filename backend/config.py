import os

class Settings:
    PROJECT_NAME: str = "Academic Nexus AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # AI Keys (can be populated via settings or environment variables)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # DB Configuration
    DB_FILE: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "nexus.db")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "uploads")

settings = Settings()
os.makedirs(os.path.dirname(settings.DB_FILE), exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
