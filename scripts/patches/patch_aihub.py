import re

with open("src/components/AIHub.tsx", "r") as f:
    content = f.read()

def replace_block(old, new, content):
    if old in content:
        return content.replace(old, new)
    else:
        print("COULD NOT FIND:", old[:50])
        return content

old_handle_generate_image = """  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);
    addAuditLog('SYSTEM', 'INFO', 'Generative API Image request queued', `Model: gemini-3.1-flash-image-preview. Ratio: ${imageAspectRatio}`);
    setTimeout(() => {
      setGeneratedImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(imagePrompt)}&backgroundColor=0f172a&shape1Color=3b82f6`);
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info generated tactical safety mockup', imagePrompt);
      setIsGeneratingImg(false);
    }, 2500);
  };"""

new_handle_generate_image = """  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);
    addAuditLog('SYSTEM', 'INFO', 'Generative API Image request queued', `Model: gemini-3.1-flash-image-preview. Ratio: ${imageAspectRatio}`);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: imageAspectRatio })
      });
      const data = await res.json();
      if (data.imageBase64) {
        setGeneratedImage(`data:image/jpeg;base64,${data.imageBase64}`);
        addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info generated tactical safety mockup', imagePrompt);
      } else {
        addToast("Image generation failed", "error");
      }
    } catch (e) {
      addToast("Image generation failed", "error");
    } finally {
      setIsGeneratingImg(false);
    }
  };"""

content = replace_block(old_handle_generate_image, new_handle_generate_image, content)

old_handle_send = """  const handleSend = () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `[Simulated Gemini 3.5 Flash] Received tactical query: "${userMsg.content}". In a live environment, this would utilize grounding with Google Search and Maps API to provide actionable safety routing.`, 
        timestamp: Date.now() 
      };
      setChatHistory(prev => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 1500);
  };"""

new_handle_send = """  const handleSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: currentInput, 
          useThinking: selectedModel === 'gemini-3.1-pro-preview',
          useFlashLite: selectedModel === 'gemini-3.1-flash-lite'
        })
      });
      const data = await res.json();
      
      const assistantMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.text || "No response received.", 
        timestamp: Date.now() 
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (e) {
      addToast("Failed to communicate with Gemini", "error");
    } finally {
      setIsThinking(false);
    }
  };"""

content = replace_block(old_handle_send, new_handle_send, content)

with open("src/components/AIHub.tsx", "w") as f:
    f.write(content)

