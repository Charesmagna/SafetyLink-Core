import re

with open("server.ts", "r") as f:
    content = f.read()

lyria_route = """
  // 6. Lyria Music Generation
  app.post("/api/gemini/generate-lyria", async (req, res) => {
    try {
      const { prompt } = req.body;
      const genAI = initGemini();
      // Lyria generation is currently experimental. 
      // We simulate backend successful acknowledgement here and rely on the client WebAudio API synth for now,
      // but this endpoint exists to pipe the Lyria API output down to the client when the key is provisioned.
      res.json({ success: true, base64Audio: "" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
"""

content = content.replace("  // Vite middleware for development", lyria_route)

with open("server.ts", "w") as f:
    f.write(content)


with open("src/components/AIHub.tsx", "r") as f:
    aihub = f.read()


old_synth = """      setIsSynthesizingMusic(true);
      setCurrentSynthWave('LYRIA_AMB_136HZ');
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info started Lyria Calming Synthesis', '136.1Hz Earth Frequency');
    } catch (e) {
      console.error('Web Audio API synthesis failed:', e);
    }
  };"""

new_synth = """      setIsSynthesizingMusic(true);
      setCurrentSynthWave('LYRIA_AMB_136HZ');
      addAuditLog('SYSTEM', 'INFO', 'K\\'leva.info started Lyria Calming Synthesis', '136.1Hz Earth Frequency');
      
      // Ping backend Lyria endpoint to initialize logging
      fetch('/api/gemini/generate-lyria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "Generate a calming 136.1Hz earth frequency ambient track" })
      }).catch(() => {});
      
    } catch (e) {
      console.error('Web Audio API synthesis failed:', e);
    }
  };"""

aihub = aihub.replace(old_synth, new_synth)

with open("src/components/AIHub.tsx", "w") as f:
    f.write(aihub)

