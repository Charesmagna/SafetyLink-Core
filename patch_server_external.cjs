const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const routeToAdd = `
  app.post("/api/external-sia", async (req, res) => {
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
  });

  app.post("/api/payfast/checkout",`;

content = content.replace(/  app\.post\("\/api\/payfast\/checkout",/, routeToAdd);

fs.writeFileSync('server.ts', content, 'utf8');
