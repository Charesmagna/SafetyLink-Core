export async function sendBlandCall(to: string, message: string) {
  const BLAND_API_KEY = process.env.BLAND_API_KEY;
  if (!BLAND_API_KEY) {
    console.log(`[Bland AI] Missing API Key, simulating call to ${to}: ${message}`);
    return;
  }
  try {
    await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: { 'Authorization': BLAND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: to,
        task: message,
        voice: 'mason',
        max_duration: 2,
        wait_for_greeting: true
      })
    });
    console.log(`[Bland AI] Call initiated to ${to}`);
  } catch (e: any) {
    console.error('[Bland AI] Error:', e.message);
  }
}
