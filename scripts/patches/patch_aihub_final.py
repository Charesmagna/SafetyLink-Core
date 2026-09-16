import re
with open("src/components/AIHub.tsx", "r") as f:
    content = f.read()

def replace_block(old, new, content):
    if old in content:
        return content.replace(old, new)
    else:
        print("COULD NOT FIND:", old[:50])
        return content

# 1. Chat
old_chat = """      const baseUrl = useAppStore.getState().customBackendUrl || '';
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sl_token') || ''}` },
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
    }"""

new_chat = """      const response = await fetch(`/api/gemini/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, useThinking: true, useGrounding: 'search' })
      });
      
      if (!response.ok) {
        throw new Error('AI request failed');
      }
      
      const data = await response.json();
      const reply = data.text || 'I could not process your request at this time.';
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error: Could not connect to AI services. Check console.', timestamp: Date.now() }]);
    }"""
content = replace_block(old_chat, new_chat, content)

# 2. Image Analyze
old_img_analyze = """      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ EVIDENCE ANALYZED (gemini-3.1-pro-preview): Checked image "${file.name}". High probability match: Indoor security parameter or user environment. No immediate thermal anomalies or chemical hazardous materials detected. Ground status secure.`,
            timestamp: Date.now()
          }
        ]);
        setIsTyping(false);
        addAuditLog('SECURITY', 'INFO', 'K\\'leva.info analyzed evidence image', file.name);
      }, 1500);
    };"""

new_img_analyze = """      fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: reader.result?.toString().split(',')[1], mimeType: file.type, prompt: "Analyze this image for safety hazards, security parameters, or tactical anomalies." })
      }).then(r => r.json()).then(data => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `⚠️ EVIDENCE ANALYZED (gemini-3.1-pro-preview): ${data.text}`,
            timestamp: Date.now()
          }
        ]);
        setIsTyping(false);
        addAuditLog('SECURITY', 'INFO', 'K\\'leva.info analyzed evidence image', file.name);
      }).catch(() => setIsTyping(false));
    };"""
content = replace_block(old_img_analyze, new_img_analyze, content)

# 3. Image Generate
old_img_gen = """    // Simulate Image Generation via Canvas/SVG DataURL
    setTimeout(() => {
      // We render an gorgeous custom SVG blueprint grid representing their prompt
      const canvas = document.createElement('canvas');
      canvas.width = imageAspectRatio === '16:9' ? 640 : imageAspectRatio === '9:16' ? 360 : 500;
      canvas.height = imageAspectRatio === '16:9' ? 360 : imageAspectRatio === '9:16' ? 640 : 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw futuristic dark mesh layout
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Circular safety rings
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 4, 0, Math.PI * 2);
        ctx.stroke();

        // Target coordinates
        ctx.fillStyle = '#10b981';
        ctx.font = '11px Courier New';
        ctx.fillText(`PROMPT: ${imagePrompt.substring(0, 35)}...`, 20, 30);
        ctx.fillText(`QUALITY: ${imageQuality} RESOLUTION / RATIO: ${imageAspectRatio}`, 20, 50);
        ctx.fillText(`LAT: ${userLocation?.lat.toFixed(5)} LNG: ${userLocation?.lng.toFixed(5)}`, 20, 70);

        // Center crosshair
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
        ctx.stroke();
      }

      setGeneratedImage(canvas.toDataURL());
      setIsGeneratingImg(false);
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info generated tactical safety mockup', imagePrompt);
    }, 1500);"""

new_img_gen = """    fetch('/api/gemini/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imagePrompt, aspectRatio: imageAspectRatio })
    }).then(res => res.json()).then(data => {
      if (data.imageBase64) {
        setGeneratedImage(`data:image/jpeg;base64,${data.imageBase64}`);
        addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info generated tactical safety mockup', imagePrompt);
      }
      setIsGeneratingImg(false);
    }).catch(() => setIsGeneratingImg(false));"""
content = replace_block(old_img_gen, new_img_gen, content)

with open("src/components/AIHub.tsx", "w") as f:
    f.write(content)

