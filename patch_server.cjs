const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  // 3. Google Drive Public Folder Fetcher
  app.get("/api/drive/media", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
      }
      const folderId = req.query.folderId || '1l78cZjsK9RFFsr4DNqYwhK4swg8SIbmW';
      
      const response = await fetch(\`https://www.googleapis.com/drive/v3/files?q='\${folderId}'+in+parents&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,description)&key=\${apiKey}\`);
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || "Failed to fetch from Google Drive API" });
      }
      
      res.json({ success: true, files: data.files });
    } catch (e) {
      console.error("Google Drive API Error:", e);
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(
  /\/\/ 2\. Pipedream Workflow Deployment/,
  newRoute + '\n  // 2. Pipedream Workflow Deployment'
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts with Google Drive endpoint');
