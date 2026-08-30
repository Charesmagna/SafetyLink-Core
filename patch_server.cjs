const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Optimize external-sia
const externalSiaOriginal = `  app.post("/api/external-sia", async (req, res) => {
    try {
      const { url, payload } = req.body;
      const SIA_TOKEN = process.env.VITE_SIA_TOKEN || 'placeholder';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SIA_TOKEN
        },
        body: JSON.stringify(payload)
      });
      res.json({ success: response.ok, status: response.status });
    } catch (e: any) {
      console.error("External SIA Proxy Error:", e);
      res.status(500).json({ error: e.message });
    }
  });`;

const externalSiaOptimized = `  app.post("/api/external-sia", async (req, res) => {
    try {
      const { url, payload } = req.body;
      
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ error: "Invalid URL provided." });
      }

      // Basic SSRF Protection
      try {
        const targetUrl = new URL(url);
        const blockedHosts = ['localhost', '127.0.0.1', '169.254.169.254', '0.0.0.0'];
        if (blockedHosts.includes(targetUrl.hostname) || targetUrl.hostname.endsWith('.local') || targetUrl.hostname.endsWith('.internal')) {
          console.warn(\`Blocked SSRF attempt to internal domain: \${targetUrl.hostname}\`);
          return res.status(403).json({ error: "Access to internal domains is forbidden." });
        }
      } catch (e) {
        return res.status(400).json({ error: "Malformed URL structure." });
      }

      // Timeout Optimization for Proxy
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const SIA_TOKEN = process.env.VITE_SIA_TOKEN || 'placeholder';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SIA_TOKEN,
          'User-Agent': 'SafetyLink-External-SIA-Proxy/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal as any
      });
      
      clearTimeout(timeoutId);
      const textRes = await response.text().catch(() => "");
      res.json({ success: response.ok, status: response.status, body: textRes.substring(0, 500) });
    } catch (e: any) {
      console.error("External SIA Proxy Error:", e);
      if (e.name === 'AbortError') {
         return res.status(504).json({ error: "Gateway Timeout: External endpoint took too long to respond." });
      }
      res.status(500).json({ error: e.message || "Internal server proxy error" });
    }
  });`;

content = content.replace(externalSiaOriginal, externalSiaOptimized);

// 2. Optimize Paystack webhook to be asynchronous after validation
const paystackBlockRegex = /(if \(hash !== signature\) \{[\s\S]*?return res\.status\(401\)\.send\('Unauthorized'\);\n      \})\n\n      \/\/ 2\. DETECT SUCCESSFUL CHARGES\n      const eventPayload = req\.body;([\s\S]*?\} catch \(error\) \{\n              console\.error\('Error: Failed to send merchant fulfillment email:', error\);\n          \}\n      \}\n\n      return res\.status\(200\)\.send\('Webhook Received'\);)/g;

content = content.replace(paystackBlockRegex, (match, validationCheck, payloadProcessing) => {
    return `${validationCheck}\n\n      // Fast response to prevent timeout loops from payment gateway\n      res.status(200).send('Webhook Received');\n\n      // Process heavy tasks asynchronously\n      setImmediate(async () => {\n        try {\n          const eventPayload = req.body;${payloadProcessing.replace(/return res\.status\(200\)\.send\('Webhook Received'\);/g, '')}        } catch (e) {\n          console.error('Async Webhook Processing Error:', e);\n        }\n      });`;
});


// 3. Optimize Payfast webhook
const payfastBlockRegex = /(if \(validateResult !== 'VALID'\) \{[\s\S]*?return res\.status\(401\)\.send\('Unauthorized'\);\n      \})\n\n      if \(pfData\.payment_status === 'COMPLETE'\) \{([\s\S]*?)\}\n\n      res\.status\(200\)\.send\('OK'\);/g;

content = content.replace(payfastBlockRegex, (match, validationCheck, payloadProcessing) => {
    return `${validationCheck}\n\n      // Fast response to prevent timeout loops\n      res.status(200).send('OK');\n\n      // Process heavy database operations asynchronously\n      setImmediate(async () => {\n        try {\n          if (pfData.payment_status === 'COMPLETE') {${payloadProcessing}          }\n        } catch (e) {\n          console.error('Async Payfast Webhook Processing Error:', e);\n        }\n      });`;
});

fs.writeFileSync('server.ts', content);
