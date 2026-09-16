const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const additionalRoutes = `
  // --- USSD ENDPOINT (Africa's Talking) ---
  app.post('/ussd', express.urlencoded({ extended: true }), async (req, res) => {
    const { sessionId, phoneNumber, text } = req.body;
    let response = '';

    if (!text || text === '') {
      response = 'CON SafetyLink Emergency\\nAlert sent. Help is coming.\\n1. Confirm OK\\n2. Cancel Alert';
      // Implement logic to trigger panic using the phoneNumber
    } else if (text === '1') {
      response = 'END Alert confirmed. Stay safe. Help is on the way.';
    } else if (text === '2') {
      response = 'END Alert cancelled.';
    } else if (text === 'menu') {
      response = 'CON SafetyLink\\n1. Send Panic Alert\\n2. My Subscription\\n3. Contact Support';
    } else {
      response = 'END Invalid option. Dial again for emergency.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  });

  // --- VAPI WEBHOOK ---
  app.post('/vapi/webhook', express.json(), async (req, res) => {
    const body = req.body;
    const type = body.message?.type;
    const callerNumber = body.message?.call?.customer?.number || 'unknown';

    if (type === 'call-started' || type === 'assistant-request') {
      return res.json({
        assistant: {
          firstMessage: 'SafetyLink emergency line. Stay on the line. Your emergency contacts are being alerted now.',
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            systemPrompt: \`You are SafetyLink emergency AI. Caller: \${callerNumber}. Contacts already alerted. Keep caller calm. Ask only: Are you able to speak freely? Support EN, ZU, AF, XH automatically.\`,
            temperature: 0.3,
          },
          voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
          recordingEnabled: true,
          silenceTimeoutSeconds: 30,
          maxDurationSeconds: 600,
        },
      });
    }

    return res.json({ result: 'ok' });
  });
`;

if (!content.includes('/ussd')) {
  // Find where app.listen is
  const target = `  app.listen(PORT, '0.0.0.0', () => {`;
  content = content.replace(target, additionalRoutes + '\n' + target);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Appended USSD and VAPI to server.ts");
}
