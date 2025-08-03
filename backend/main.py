from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from gemini import GeminiService
from agent import RLAgent

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
rl_agent = RLAgent()

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

class RLConfigRequest(BaseModel):
    tag: str
    userInfo: Optional[Dict[str, Any]] = None

class FeedbackRequest(BaseModel):
    reward: float
    session_id: Optional[str] = None

class UpdateWholeConfigRequest(BaseModel):
    userInfo: Dict[str, Any]
    config: Dict[str, Any]

@app.post("/create_config")
async def create_config(request: CreateConfigRequest):
    """
    Generate optimized configuration for a specific HTML tag using Gemini AI
    based on user knowledge and the HTML tag context
    """
    return {"status": "success", "message": "This endpoint is deprecated. Use /generate_config instead."}
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

@app.post("/update_whole_config")
async def update_whole_config(request: UpdateWholeConfigRequest):
    """
    Update the entire configuration based on updated user information
    """
    try:
        user_info = request.userInfo
        current_config = request.config
        
        # Update the entire configuration using Gemini service
        updated_config = gemini_service.update_whole_config(user_info, current_config)
        
        return updated_config
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/rl_config")
async def rl_config(request: RLConfigRequest):
    """
    Generate configuration using the RL agent
    """
    try:
        tag = request.tag
        userInfo = request.userInfo or {}
        
        # Get state from context
        state = rl_agent.get_state_from_context(tag, userInfo)
        
        # Get action from RL agent
        config = rl_agent.select_action(state)
        
        return ConfigElement(
            activationTime=config.get("activationTime", 1.0),
            style=ElementStyle(**config.get("style", {}))
        )
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.post("/feedback")
async def provide_feedback(request: FeedbackRequest):
    """
    Provide feedback to the RL agent for training
    """
    try:
        reward = request.reward
        
        # Update the RL agent's policy with the reward
        rl_agent.update_policy(reward)
        
        return {"status": "success", "message": "Feedback received and model updated"}
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.post("/save_model")
async def save_model():
    """
    Manually trigger model saving
    """
    try:
        rl_agent.save_model()
        return {"status": "success", "message": "Model saved successfully"}
        
    except Exception as e:
        return {"error": str(e), "status": "failed"}

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys
    
    def signal_handler(sig, frame):
        print("\nGracefully shutting down...")
        rl_agent.save_model()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)