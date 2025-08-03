from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from gemini import GeminiService

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # i heckin love allowing all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_service = GeminiService()

class ElementStyle(BaseModel):
    fontSize: Optional[int] = None
    color: Optional[str] = None
    fontFamily: Optional[str] = None
    fontWeight: Optional[str] = None
    textDecoration: Optional[str] = None
    backgroundSize: Optional[str] = None
    border: Optional[str] = None
    boxShadow: Optional[str] = None
    padding: Optional[str] = None
    margin: Optional[str] = None
    textColor: Optional[str] = None
    scale: Optional[float] = None
    opacity: Optional[float] = None
    backgroundColor: Optional[str] = None
    borderRadius: Optional[str] = None

class ConfigElement(BaseModel):
    activationTime: float
    style: ElementStyle

class CreateConfigRequest(BaseModel):
    tag: str
    userInfo: Optional[Dict[str, Any]] = None

class UpdateUserInfoRequest(BaseModel):
    message: str
    userInfo: Optional[Dict[str, Any]] = None

@app.post("/create_config")
async def create_config(request: CreateConfigRequest):
    """
    Generate optimized configuration for a specific HTML tag using Gemini AI
    based on user knowledge and the HTML tag context
    """
    try:
        tag = request.tag
        userInfo = request.userInfo or {}

        config_json = gemini_service.generate_config(tag, userInfo)
        
        return ConfigElement(
            activationTime=config_json.get("activationTime", 1.0),
            style=ElementStyle(**config_json.get("style", {}))
        )
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.post("/update_user_info")
async def update_user_info(request: UpdateUserInfoRequest):
    """
    update user info
    """
    try:
        message = request.message
        current_user_info = request.userInfo
        
        # Update user profile using Gemini service
        updated_info = gemini_service.update_user_profile(message, current_user_info)
        
        return updated_info
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)