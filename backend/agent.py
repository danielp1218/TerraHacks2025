import torch
from torch import nn
import torch.nn.functional as F
import numpy as np

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
    def __init__(self):
        self.state_dim = 10  # e.g., gaze features, squint, DOM metadata
        self.action_dim = 3  # font-size index, color index, activationTime bucket
        self.policy = PolicyNetwork(self.state_dim, self.action_dim)
        self.optimizer = torch.optim.Adam(self.policy.parameters(), lr=1e-3)

    def select_action(self, state):
        # Assume state is a flat list of floats
        state_tensor = torch.tensor(state, dtype=torch.float32)
        logits = self.policy(state_tensor)
        probs = F.softmax(logits, dim=-1)

        action = torch.multinomial(probs, num_samples=1).item()

        # Decode action → config mutation
        font_size = FONT_SIZES[action % len(FONT_SIZES)]
        color = COLORS[(action // len(FONT_SIZES)) % len(COLORS)]
        activation_time = round(torch.random.uniform(0.3, 1.0), 2)

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