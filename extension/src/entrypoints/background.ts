import { storage } from '#imports';

const backendUrl = "http://localhost:8000";

const initStorage = async () => {
  const config: ExtensionConfig = {
    "div": {
      activationTime: 1,
      style: {
        scale: 1.2,
        color: "#000000",
        textColor: "#FFFFFF"
      }
    },
    "p": {
      activationTime: 0.5,
      style: {
        fontSize: 16,
        color: "#000000",
        textColor: "#FFFFFF"
      }
    }
  };
  const userInfo = {
    "accessibility_needs": { 
      "visual": [], 
      "motor": [], 
      "cognitive": [] 
    }, 
    "preferences": { 
      "font_size": "", 
      "contrast": "", 
      "colors": [],
      "interaction_speed": "" 
    }, 
    "feedback_history": [], 
    "successful_configs": {}
  }

  storage.defineItem('local:appConfig', {
    fallback: config,
    init: () => {
      return config;
    }
  });
  storage.defineItem('local:userInfo', {
    fallback: userInfo,
    init: () => {
      return userInfo;
    }
  });
  storage.setItem('local:appConfig', config);
  storage.setItem('local:userInfo', userInfo);
}

export default defineBackground(() => {
  if (storage.getItem('local:appConfig') === null) {
    initStorage();
  }


  browser.runtime.onMessage.addListener(async (message: { type: string, data: object }) => {
    if (message.type === 'updateConfig') {
      const tag = (message.data as { tag: string }).tag;
      const userInfo = await storage.getItem('local:userInfo')
      fetch(`${backendUrl}/create_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tag: tag,
          userInfo: userInfo
        })
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const prevConfig = await storage.getItem('local:appConfig') as ExtensionConfig;
        storage.setItem('local:appConfig', { ...prevConfig, [tag]: await response.json() });
      });
    } else if (message.type === 'updateUserInfo') {
      const userMessage = message.data;
      const userInfo = await storage.getItem('local:userInfo');
      fetch(`${backendUrl}/update_user_info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          userInfo: userInfo
        })
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        storage.setItem('local:userInfo', await response.json());
        
      });
    }
  })
});