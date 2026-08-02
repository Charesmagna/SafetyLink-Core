const fs = require('fs');
const path = 'standalone-backend/server.js';
let content = fs.readFileSync(path, 'utf8');

// Add the endpoint the frontend is actually calling
const newEndpoint = `
app.post('/auth/register-org', async (req, res) => {
  try {
    const { id: code, name, contactName, phone } = req.body;
    const { username: ocUsername, password: ocPassword } = await createOCUser(code, 'ORGANIZATION');
    const org = await prisma.organization.create({
      data: { code, name, contactName, phone, ocUsername, ocPassword: encrypt(ocPassword) }
    });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/register-user', async (req, res) => {
  try {
    const { username, password, role, orgCode } = req.body;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/org/register'`;

content = content.replace("app.post('/api/org/register'", newEndpoint);
fs.writeFileSync(path, content);
console.log('Patched standalone-backend/server.js');
