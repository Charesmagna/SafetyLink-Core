const fs = require('fs');
const path = 'src/components/AIHub.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const handleChatSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1200\);\n  \};/g;

const replacement = `const handleChatSubmit = async (e: React.FormEvent) => {
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

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log("Patched successfully!");
} else {
    console.log("Regex not found");
}
