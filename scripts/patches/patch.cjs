const fs = require('fs');
const path = 'src/components/AIHub.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate high intelligence Gemini model thinking processing
    setTimeout(() => {
      let reply = '';
      const promptLower = userMsg.toLowerCase();
      if (promptLower.includes('sos') || promptLower.includes('panic') || promptLower.includes('danger')) {
        reply = \`CRITICAL ALERT INTERCEPTED: Activating coordinated response metrics. I have verified your geo-coordinates at [\${userLocation?.lat.toFixed(5)}, \${userLocation?.lng.toFixed(5)}]. Initializing dispatch enqueuer with 10s cancel buffer. Keep your wearable iTAG nearby.\`;
      } else if (promptLower.includes('location') || promptLower.includes('gps') || promptLower.includes('where')) {
        reply = \`GEOLOCATION DECRYPT: Your node is centered at Latitude: \${userLocation?.lat.toFixed(6)}, Longitude: \${userLocation?.lng.toFixed(6)}. Map accuracy index is calculated at 98.7% (High-precision cellular trilateration).\`;
      } else if (promptLower.includes('itag') || promptLower.includes('ble') || promptLower.includes('button')) {
        reply = \`HARDWARE HARMONY: Physical BLE buttons can be bonded via the Scanner Tab. When pressed once, they notify contacts. A triple-click triggers instant SOS bypass.\`;
      } else if (promptLower.includes('who are you') || promptLower.includes('kleva') || promptLower.includes('k\\'leva') || promptLower.includes('lizzy')) {
        reply = \`IDENT DECRYPT: I am Lizzy from K'lev.ai, your edge-computing AI safety agent. Built specifically for high-durability Mesh Networks to coordinate medical, tactical, and community nodes.\`;
      } else {
        reply = \`SECURE MEMO: Node request received. Under emergency conditions, I will coordinate with TM Media Solutions servers to ensure persistent dispatch alerts. Let me know if you need exit routing or weather grounding.\`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info processed chat request', \`Query: \${userMsg.substring(0, 30)}\`);
    }, 1200);
  };`;

const replacement = `  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const baseUrl = useAppStore.getState().customBackendUrl || '';
      const response = await fetch(\`\${baseUrl}/api/ai/chat\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('sl_token') || ''}\` },
        body: JSON.stringify({ message: userMsg })
      });
      
      if (!response.ok) {
        throw new Error('AI request failed');
      }
      
      const data = await response.json();
      let reply = data.text || 'I could not process your request at this time.';
      
      if (data.groundingChunks && data.groundingChunks.length > 0) {
         reply += "\\n\\nSources:\\n" + data.groundingChunks.map((chunk: any) => chunk.web?.uri || chunk.web?.title).join('\\n');
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error: Could not connect to AI services. (Check if GEMINI_API_KEY is configured in the worker)', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info processed chat request', \`Query: \${userMsg.substring(0, 30)}\`);
    }
  };`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
