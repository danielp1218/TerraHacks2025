"""
a test script to verify the RL agent integration with main.py
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.json()}")
    return response.status_code == 200

def test_rl_config():
    """Test the RL configuration endpoint"""
    payload = {
        "tag": "p",
        "userInfo": {
            "age": 25,
            "vision_conditions": ["myopia"],
            "reading_preferences": {
                "prefers_large_text": 0.8,
                "prefers_high_contrast": 0.9
            }
        }
    }
    
    response = requests.post(f"{BASE_URL}/rl_config", json=payload)
    print(f"RL config response: {response.json()}")
    return response.status_code == 200

def test_feedback():
    """Test the feedback endpoint"""
    payload = {
        "reward": 0.8,
        "session_id": "test_session_1"
    }
    
    response = requests.post(f"{BASE_URL}/feedback", json=payload)
    print(f"Feedback response: {response.json()}")
    return response.status_code == 200

def test_save_model():
    """Test manual model saving"""
    response = requests.post(f"{BASE_URL}/save_model")
    print(f"Save model response: {response.json()}")
    return response.status_code == 200

def main():
    print("Testing RL Agent Integration...")
    print("=" * 50)
    
    # Test all endpoints
    tests = [
        ("Health Check", test_health),
        ("RL Config Generation", test_rl_config),
        ("Feedback Submission", test_feedback),
        ("Manual Model Save", test_save_model)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\nTesting {test_name}...")
        try:
            success = test_func()
            results.append((test_name, success))
            print(f"✅ {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")

if __name__ == "__main__":
    main()
