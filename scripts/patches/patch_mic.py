import re
with open("src/components/AIHub.tsx", "r") as f:
    content = f.read()

def replace_block(old, new, content):
    if old in content:
        return content.replace(old, new)
    else:
        print("COULD NOT FIND:", old[:50])
        return content

old_voice = """  const toggleVoiceLink = () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceLog('Voice link terminated.');
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info voice chat disconnected');
    } else {
      setVoiceActive(true);
      setVoiceLog('Connecting to gemini-3.1-flash-live-preview...');
      setTimeout(() => {
        setVoiceLog('Live voice link established! K\\'leva.info is listening...');
        addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info voice chat connected', 'Using gemini-3.1-flash-live-preview');
      }, 1000);
    }
  };"""

new_voice = """  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const toggleVoiceLink = async () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceLog('Voice link terminated.');
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info voice chat disconnected');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    } else {
      setVoiceActive(true);
      setVoiceLog('Connecting to gemini-3.1-flash-live-preview...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Audio = reader.result?.toString().split(',')[1];
              try {
                const res = await fetch('/api/gemini/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audioBase64: base64Audio, mimeType: mediaRecorder.mimeType })
                });
                const data = await res.json();
                if (data.text) {
                  setVoiceLog(`Transcription: ${data.text.substring(0, 50)}...`);
                }
              } catch (err) {}
            };
            reader.readAsDataURL(e.data);
          }
        };
        
        // Collect chunks every 3 seconds
        mediaRecorder.start(3000);

        setVoiceLog('Live audio link established! Audio is streaming to backend...');
        addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info voice chat connected', 'Using Live audio processing');
      } catch (err) {
        setVoiceActive(false);
        setVoiceLog('Microphone access denied or unavailable.');
        addAuditLog('SYSTEM', 'ERROR', 'Microphone access failed');
      }
    }
  };"""

content = replace_block(old_voice, new_voice, content)

with open("src/components/AIHub.tsx", "w") as f:
    f.write(content)

