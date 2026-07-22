import fs from 'fs';
const content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const foundUsers = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
  const user = foundUsers[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    orgCode: user.orgCode,
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '7d' });
  const { passwordHash, ...safeUser } = user;
  
  let org = null;
  if (user.orgCode) {
    const foundOrgs = await db.select().from(organizations).where(eq(organizations.id, user.orgCode));
    if (foundOrgs.length > 0) {
      org = foundOrgs[0];
    }
  }

  return res.status(200).json({
    message: 'Login successful',
    user: safeUser,
    org: org,
    token,
  });
});
`;

// Replace the entire login block
// First, find the start and end
const startStr = "app.post('/api/auth/login', async (req, res) => {";
const endStr = "// POST /dispatch/sms";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + replacement + "\n" + content.substring(endIndex);
  fs.writeFileSync('server.ts', newContent);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find start or end index for login block.");
}
