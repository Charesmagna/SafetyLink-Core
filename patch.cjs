const fs = require('fs');
const path = 'src/components/OrgDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                onClick={async () => {
                  if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
                    alert('Please enter your Twilio credentials first.');
                    return;
                  }
                  setTwilioTestStatus('testing');
                  setTwilioTestMessage('Handshaking with Twilio API Gateway...');
                  await new Promise(r => setTimeout(r, 1000));
                  setTwilioTestMessage('Validating account permissions and Twilio SMS routing tables...');
                  await new Promise(r => setTimeout(r, 1200));
                  setTwilioTestMessage(\`Dispatching automated test distress broadcast to Control Helpline: \${currentOrg.controlRoomNumber || '+27829110000'}...\`);
                  await new Promise(r => setTimeout(r, 1000));
                  setTwilioTestStatus('success');
                  setTwilioTestMessage('SUCCESS: Live Loopback confirmed. Test emergency call queued and SMS delivered to dispatch operator!');
                  useAppStore.getState().addAuditLog(
                    'SECURITY',
                    'INFO',
                    'Twilio Connection Test Initiated',
                    \`Handshake verified for Account SID: \${twilioAccountSid}. Emulated call sequence completed successfully.\`
                  );
                }}`;

const replacement = `                onClick={async () => {
                  if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
                    alert('Please enter your Twilio credentials first.');
                    return;
                  }
                  setTwilioTestStatus('testing');
                  setTwilioTestMessage('Handshaking with Twilio API Gateway...');
                  
                  try {
                    const response = await fetch('/api/twilio/test', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        accountSid: twilioAccountSid,
                        authToken: twilioAuthToken,
                        fromNumber: twilioFromNumber
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      setTwilioTestStatus('success');
                      setTwilioTestMessage(\`SUCCESS: Live Loopback confirmed. \${data.message || 'Test emergency call queued and SMS delivered to dispatch operator!'}\`);
                      useAppStore.getState().addAuditLog(
                        'SECURITY',
                        'INFO',
                        'Twilio Connection Test Initiated',
                        \`Handshake verified for Account SID: \${twilioAccountSid}. Live call sequence completed successfully.\`
                      );
                    } else {
                      setTwilioTestStatus('error');
                      setTwilioTestMessage(\`Twilio Error: \${data.error || 'Failed to connect'}\`);
                    }
                  } catch (error) {
                    setTwilioTestStatus('error');
                    setTwilioTestMessage(\`Network Error: \${error.message || 'Failed to reach server'}\`);
                  }
                }}`;

if(content.includes(target)) {
    fs.writeFileSync(path, content.replace(target, replacement));
    console.log('Patched OrgDashboard.tsx successfully');
} else {
    console.error('Target not found in OrgDashboard.tsx');
}
