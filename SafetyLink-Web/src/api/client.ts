const API_BASE = '/api';

export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('safetylink_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (endpoint: string, body: any) => {
    const token = localStorage.getItem('safetylink_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
