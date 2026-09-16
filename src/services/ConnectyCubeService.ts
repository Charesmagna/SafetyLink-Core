import ConnectyCube from 'connectycube';
import { useAppStore } from '../utils/store';

class ConnectyCubeService {
  private static instance: ConnectyCubeService;

  private constructor() {
    this.init();
  }

  public init() {
    const customConfig = useAppStore.getState().connectyCubeConfig;
    const CREDENTIALS = {
      appId: customConfig?.appId || 10000, 
      authKey: customConfig?.authKey || "dp_live_YmhfM6zbTN3bgx40lMNftVP5", 
      authSecret: customConfig?.authSecret || "104672c2253f80543919ef337b8e4a01ee823bbaa29888278d3783b6b27f5859",
    };
    
    const CONFIG = {
      debug: { mode: 1 },
      endpoints: {
        api: customConfig?.apiEndpoint || 'https://SafetyLink.connectycube.com',
        chat: customConfig?.chatEndpoint || 'SafetyLink.connectycube.com'
      }
    };
    
    ConnectyCube.init(CREDENTIALS, CONFIG);
  }

  public static getInstance(): ConnectyCubeService {
    if (!ConnectyCubeService.instance) {
      ConnectyCubeService.instance = new ConnectyCubeService();
    }
    return ConnectyCubeService.instance;
  }
  
  public async createSession(userCredentials?: any) {
    return new Promise((resolve, reject) => {
      if (userCredentials) {
        ConnectyCube.createSession(userCredentials)
          .then(resolve)
          .catch(reject);
      } else {
        ConnectyCube.createSession()
          .then(resolve)
          .catch(reject);
      }
    });
  }
}

export const connectyCubeService = ConnectyCubeService.getInstance();
