import torch
from torch import nn
import torch.nn.functional as F
import numpy as np
import os
import json
from datetime import datetime
import threading
import time

COLORS = ['#000000', '#333333', '#666666']
FONT_SIZES = [1.0, 1.2, 1.4, 1.6]

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(PolicyNetwork, self).__init__()
        self.sequential = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, action_dim)
        )


    def forward(self, x):
        return self.sequential(x)
    
class RLAgent:
    def __init__(self, model_path="model/agent_model.pt", save_interval=300):
        self.state_dim = 10  # e.g., gaze features, squint, DOM metadata
        self.action_dim = 3  # font-size index, color index, activationTime bucket
        self.policy = PolicyNetwork(self.state_dim, self.action_dim)
        self.optimizer = torch.optim.Adam(self.policy.parameters(), lr=1e-3)
        
        self.model_path = model_path
        self.save_interval = save_interval  # Save every 5 minutes by default
        self.last_save_time = time.time()
        
        # Create model directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Load existing model if available
        self.load_model()
        
        # Start background saving thread
        self.save_thread = threading.Thread(target=self._periodic_save, daemon=True)
        self.save_thread.start()

    def select_action(self, state):
        # Assume state is a flat list of floats
        state_tensor = torch.tensor(state, dtype=torch.float32)
        logits = self.policy(state_tensor)
        probs = F.softmax(logits, dim=-1)

        action = torch.multinomial(probs, num_samples=1).item()

        # Decode action → config mutation
        font_size = FONT_SIZES[action % len(FONT_SIZES)]
        color = COLORS[(action // len(FONT_SIZES)) % len(COLORS)]
        activation_time = round(torch.rand(1).item() * 0.7 + 0.3, 2)  # Random between 0.3 and 1.0

        # Save for future training (simplified)
        self.last_state = state_tensor
        self.last_action = torch.tensor(action)
        return {
            "tag": "p",
            "style": {
                "font-size": f"{font_size}em",
                "color": color
            },
            "activationTime": activation_time
        }

    def update_policy(self, reward):
        # Simple REINFORCE update
        self.optimizer.zero_grad()
        logits = self.policy(self.last_state)
        log_prob = F.log_softmax(logits, dim=-1)[self.last_action]
        loss = -log_prob * reward
        loss.backward()
        self.optimizer.step()
        
        # Check if we should save the model
        current_time = time.time()
        if current_time - self.last_save_time > self.save_interval:
            self.save_model()
            self.last_save_time = current_time

    def load_model(self):
        """Load the model and optimizer state from file if it exists"""
        if os.path.exists(self.model_path):
            try:
                checkpoint = torch.load(self.model_path, map_location='cpu')
                self.policy.load_state_dict(checkpoint['model_state_dict'])
                self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                print(f"Model loaded from {self.model_path}")
            except Exception as e:
                print(f"Failed to load model: {e}")
        else:
            print(f"No existing model found at {self.model_path}, starting fresh")

    def save_model(self):
        """Save the model and optimizer state to file"""
        try:
            checkpoint = {
                'model_state_dict': self.policy.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'timestamp': datetime.now().isoformat(),
                'state_dim': self.state_dim,
                'action_dim': self.action_dim
            }
            torch.save(checkpoint, self.model_path)
            print(f"Model saved to {self.model_path}")
        except Exception as e:
            print(f"Failed to save model: {e}")

    def _periodic_save(self):
        """Background thread function to save model periodically"""
        while True:
            time.sleep(self.save_interval)
            self.save_model()

    def get_state_from_context(self, tag, user_info):
        """Convert tag and user_info into a numerical state vector"""
        state = [0.0] * self.state_dim
        
        # Tag encoding (simple hash-based)
        tag_hash = hash(tag) % 100 / 100.0
        state[0] = tag_hash
        
        # User info features
        if user_info:
            # Extract numerical features from user_info
            age = user_info.get('age', 25) / 100.0  # Normalize age
            state[1] = age
            
            # Vision condition encoding
            vision_conditions = user_info.get('vision_conditions', [])
            if 'myopia' in vision_conditions:
                state[2] = 1.0
            if 'astigmatism' in vision_conditions:
                state[3] = 1.0
            if 'presbyopia' in vision_conditions:
                state[4] = 1.0
                
            # Reading preferences
            reading_prefs = user_info.get('reading_preferences', {})
            state[5] = reading_prefs.get('prefers_large_text', 0.5)
            state[6] = reading_prefs.get('prefers_high_contrast', 0.5)
            
        # Fill remaining dimensions with random features for now
        for i in range(7, self.state_dim):
            state[i] = np.random.random()
            
        return state