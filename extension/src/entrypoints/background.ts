import { storage } from '#imports';

export default defineBackground(() => {
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

  storage.setItem('local:appConfig', config);
});