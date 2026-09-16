import fs from 'fs';
const content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
// POST /api/auth/register-user
app.post(['/api/auth/register-user', '/api/auth/register'], async (req, res) => {
  const { username, password, fullName, phone, email, orgCode, role } = req.body;
  if (!username || !password || !fullName || !phone || !email || !orgCode) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const existingUser = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
  if (existingUser.length > 0) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  const newUser = {
    id: \`SL-USR-\${Math.floor(1000 + Math.random() * 9000)}\`,
    username: username.toLowerCase(),
    fullName,
    phone,
    email,
    orgCode,
    role: role || 'Community Member',
    passwordHash: hash,
  };

  await db.insert(users).values(newUser);

  res.status(200).json({ success: true, user: newUser });
});

// POST /api/auth/register-org
app.post(['/api/auth/register-org', '/api/org/register', '/api/family/register'], async (req, res) => {
  const { name, contactName, contactEmail, controlRoomNumber, password, id } = req.body;
  if (!name || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'Missing required organization fields' });
  }
  
  const isFamily = req.path.includes('family');
  const type = isFamily ? 'FAMILY' : 'ORGANIZATION';
  const prefix = isFamily ? 'FAM' : 'ORG';
  const newId = id || \`SL-\${prefix}-\${Math.floor(1000 + Math.random() * 9000)}\`;
  
  const newOrg = {
    id: newId,
    name,
    contactName,
    contactEmail,
    controlRoomNumber: controlRoomNumber || '+27829110000',
    escalationPolicy: 'Tier-1 Automatic Escalate to Armed Guard Patrol units.'
  };
  
  await db.insert(organizations).values(newOrg);

  // Auto create admin user for the org
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password || 'tempPassword123', saltRounds);
  const ocUsername = \`oc_\${newId.toLowerCase()}\`;

  const newAdmin = {
    id: \`SL-USR-\${Math.floor(1000 + Math.random() * 9000)}\`,
    username: ocUsername,
    fullName: contactName,
    phone: controlRoomNumber || '+27829110000',
    email: contactEmail,
    orgCode: newId,
    role: 'Organization Administrator',
    passwordHash: hash,
  };

  await db.insert(users).values(newAdmin);

  res.status(200).json({ success: true, org: newOrg, ocUsername, ocPassword: password || 'tempPassword123', familyCode: newId });
});

// POST /api/panic
`;

const updatedContent = content.replace(/\/\/ POST \/api\/panic/g, replacement);
fs.writeFileSync('server.ts', updatedContent);
