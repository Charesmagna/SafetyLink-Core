/**
 * TwilioService — Server Proxy
 */

import { useAppStore } from '../utils/store';

const getProxyBase = () => {
  const customUrl = useAppStore.getState().customBackendUrl;
  return customUrl ? customUrl + '/dispatch' : '/api/dispatch';
};

export const TwilioService = {
  sendSms: async (
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    message: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('sl_jwt_token') ? JSON.parse(localStorage.getItem('sl_jwt_token') as string) : null;
      const r = await fetch(`${getProxyBase()}/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: toNumber, message, accountSid, authToken, fromNumber }),
      });
      return r.ok;
    } catch (e) {
      console.error('[TwilioService] SMS proxy error:', e);
      return false;
    }
  },

  triggerVoiceCall: async (
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    lat: number,
    lng: number,
    description: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('sl_jwt_token') ? JSON.parse(localStorage.getItem('sl_jwt_token') as string) : null;
      const message = `Emergency alert from SafetyLink. ${description}. Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`;
      const r = await fetch(`${getProxyBase()}/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ phone: toNumber, message, accountSid, authToken, fromNumber }),
      });
      return r.ok;
    } catch (e) {
      console.error('[TwilioService] Voice proxy error:', e);
      return false;
    }
  },
};
