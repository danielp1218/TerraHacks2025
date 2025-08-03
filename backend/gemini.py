import json
from time import time
import google.generativeai as genai
import os
from typing import Dict, Any
from dotenv import load_dotenv
load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

class GeminiService:
    """Service class for handling Gemini AI interactions"""
    
    @staticmethod
    def _extract_json_from_response(response_text: str) -> str:
        """
        Extract JSON content from Gemini response, handling markdown code blocks
        """
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            # Find the start and end of the JSON content
            start_index = response_text.find("```json") + 7
            end_index = response_text.rfind("```")
            if end_index > start_index:
                response_text = response_text[start_index:end_index].strip()
        elif response_text.startswith("```"):
            # Handle generic code blocks
            start_index = response_text.find("```") + 3
            end_index = response_text.rfind("```")
            if end_index > start_index:
                response_text = response_text[start_index:end_index].strip()
        return response_text
    
    @staticmethod
    def generate_config(tag: str, user_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate optimized configuration for a specific HTML tag using Gemini AI
        """
        prompt = f"""
        You are an accessibility expert assistant. Generate an optimal configuration for the HTML tag "{tag}" based on the following user information:

        User Information: {json.dumps(user_info, indent=2)}

        Please generate a JSON configuration that includes:
        1. activationTime: A float value (0.1 to 2.0) representing how quickly the accessibility enhancement should activate
        2. style: An object with styling properties that improve accessibility for this user
        
        Consider factors like:
        - Visual impairments (if mentioned)
        - Motor disabilities (if mentioned)
        - Cognitive preferences (if mentioned)
        - Previous feedback or preferences
        
        The style object can include properties like:
        - fontSize (integer, in pixels)
        - color (hex color string)
        - backgroundColor (hex color string)
        - scale (float, 1.0 = normal size)
        - textColor (hex color string)
        - borderRadius (string with CSS units)
        - padding (string with CSS units)
        - margin (string with CSS units)
        
        Return ONLY valid JSON in this exact format:
        {{
            "activationTime": number,
            "style": {{
                "fontSize": number,
                "color": "#000000",
                "backgroundColor": "#ffffff",
                "scale": 1.2
            }}
        }}
        For example for an average person, a config might look like:
        {{
            "activationTime": 0.8,
            "style": {{
                "fontSize": 18,
                "color": "#000000",
                "backgroundColor": "#ffffff",
                "scale": 1.2
            }}
        }}
        """
        
        try:
            response = model.generate_content(prompt)

            # Extract JSON from markdown code block if present
            response_text = GeminiService._extract_json_from_response(response.text)

            config_json = json.loads(response_text)
            return config_json
            
        except (json.JSONDecodeError, Exception) as e:
            return {
                "activationTime": 1.0,
                "style": {
                    "fontSize": 18,
                    "scale": 1.2
                }
            }
    
    @staticmethod
    def update_user_profile(message: str, current_user_info: Dict[str, Any]) -> str:
        """
        Update user information using Gemini AI to extract insights and preferences
        """

        print("Updating user profile with message:", message)
        print("Current user info:", json.dumps(current_user_info, indent=2))
        
        prompt = f"""
        You are an accessibility expert assistant. Analyze the following user feedback/interaction and update the user's profile accordingly.
        
        New User Message/Feedback: {message}
        Current User Information: {json.dumps(current_user_info, indent=2)}
        
        Based on this information, please:
        1. Extract any accessibility preferences or needs
        2. Identify any patterns in user behavior
        3. Note any specific difficulties or positive feedback
        4. Update the user profile with new insights
        
        Consider extracting information about:
        - Visual impairments (color blindness, low vision, etc.)
        - Motor disabilities (difficulty clicking, tremors, etc.)
        - Cognitive preferences (reading speed, attention span, etc.)
        - Device preferences
        - Specific element types they struggle with
        - Positive feedback about configurations that worked well
        
        Return ONLY valid JSON representing the updated user profile:
        {{
            "accessibility_needs": {{
                "visual": ["any visual impairments or preferences"],
                "motor": ["any motor difficulties or preferences"],
                "cognitive": ["any cognitive preferences"]
            }},
            "preferences": {{
                "font_size": "preferred size or null",
                "contrast": "high/normal/low or null",
                "colors": ["preferred colors"],
                "interaction_speed": "slow/normal/fast"
            }},
            "feedback_history": [
                {{
                    "timestamp": "2025-08-02",
                    "feedback": "summary of feedback",
                    "sentiment": "positive/negative/neutral"
                }}
            ]
        }}
        """
        
        try:
            print("Gemini prompt:", prompt)
            # Generate response from Gemini
            response = model.generate_content(prompt)
            response.resolve()
            print("Gemini response:", response.text)

            # Save response to debug file
            debug_dir = "./debug"
            os.makedirs(debug_dir, exist_ok=True)
            with open(f"{debug_dir}/gemini_response_user_update_{time()}.txt", "w") as f:
                f.write(f"Prompt:\n{prompt}\n\nResponse:\n{response.text}")

            # Extract JSON from markdown code block if present
            response_text = GeminiService._extract_json_from_response(response.text)

            # Parse and return the updated user information
            updated_info = json.loads(response_text)
            return json.dumps(updated_info)
            
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error updating user profile: {e}")
            fallback_info = current_user_info.copy()
            fallback_info["last_feedback"] = str(message)
            fallback_info["timestamp"] = "2025-08-02"
            return json.dumps(fallback_info)
