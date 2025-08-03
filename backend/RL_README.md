# RL Agent

## General Concept

The RL agent learns to generate optimal web configurations based on user context and feedback. It automatically saves and loads its state, allowing it to improve over time.

## API Endpoints

### `/rl_config` (POST)
Generate configuration using the RL agent.

**Request Body:**
```json
{
  "tag": "p",
  "userInfo": {
    "age": 25,
    "vision_conditions": ["myopia", "astigmatism"],
    "reading_preferences": {
      "prefers_large_text": 0.8,
      "prefers_high_contrast": 0.9
    }
  }
}
```

**Response:**
```json
{
  "activationTime": 0.75,
  "style": {
    "fontSize": "1.4em",
    "color": "#333333"
  }
}
```

### `/feedback` (POST)
Provide feedback to train the RL agent.

**Request Body:**
```json
{
  "reward": 0.8,
  "session_id": "optional_session_id"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Feedback received and model updated"
}
```

### `/save_model` (POST)
Manually trigger model saving.

**Response:**
```json
{
  "status": "success",
  "message": "Model saved successfully"
}
```

## Model Persistence

- **Model Location**: `model/agent_model.pt`
- **Auto-save Interval**: 300 seconds (5 minutes) by default
- **Checkpoint Format**: PyTorch checkpoint containing model state, optimizer state, and metadata

## User Context Features

The RL agent converts user information into a 10-dimensional state vector:

1. **Tag Hash**: Hash-based encoding of the HTML tag
2. **Age**: Normalized age value (0-1)
3. **Myopia**: Binary indicator for myopia condition
4. **Astigmatism**: Binary indicator for astigmatism condition
5. **Presbyopia**: Binary indicator for presbyopia condition
6. **Large Text Preference**: User preference for large text (0-1)
7. **High Contrast Preference**: User preference for high contrast (0-1)
8-10. **Additional Features**: Reserved for future use

## Running the Application

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the server:
   ```bash
   python main.py
   ```

3. Test the integration:
   ```bash
   python test_integration.py
   ```

## Configuration

The RL agent can be configured with different parameters:

```python
# In main.py
rl_agent = RLAgent(
    model_path="custom/path/model.pt",  # Custom model path
    save_interval=600  # Save every 10 minutes
)
```

## Training Process

1. User requests configuration via `/rl_config`
2. Agent generates configuration based on current policy
3. User interacts with the generated configuration
4. Feedback is provided via `/feedback` endpoint with a reward value (0-1)
5. Agent updates its policy using REINFORCE algorithm
6. Model is periodically saved for persistence

## Reward Guidelines

When providing feedback, use these guidelines for reward values:

- **1.0**: Perfect configuration, user highly satisfied
- **0.8**: Good configuration, minor issues
- **0.6**: Acceptable configuration, some problems
- **0.4**: Poor configuration, significant issues
- **0.2**: Very poor configuration, major problems
- **0.0**: Completely unusable configuration
