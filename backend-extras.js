// POST /api/org/register
app.post('/api/org/register', async (req, res) => {
  const orgCode = `ORG-${Math.floor(1000 + Math.random() * 9000)}`;
  return res.status(200).json({ orgCode, ocUsername: `oc_${orgCode}`, ocPassword: 'tempPassword123' });
});

// POST /api/family/register
app.post('/api/family/register', async (req, res) => {
  const familyCode = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;
  return res.status(200).json({ familyCode, ocUsername: `oc_${familyCode}`, ocPassword: 'tempPassword123' });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  return res.status(200).json({ success: true, message: 'User registered' });
});

// POST /api/panic
app.post('/api/panic', async (req, res) => {
  const panicId = `PANIC-${Date.now()}`;
  return res.status(200).json({ panicId, status: "ALERT_SENT", aiReportUrl: "/dummy/report.txt" });
});

// POST /api/lizzy/checkin
app.post('/api/lizzy/checkin', async (req, res) => {
  return res.status(200).json({ status: "ACKNOWLEDGED", message: "Lizzy check-in complete" });
});

// GET /api/admin/stats
app.get('/api/admin/stats', async (req, res) => {
  return res.status(200).json({ totalOrgs: 10, activePanics: 2, totalUsers: 150 });
});

startServer().catch(err => { console.error("Fatal error during server startup:", err); process.exit(1); });
