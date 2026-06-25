import { sendWhatsApp } from '../services/whatsapp.service.js';

export async function send(req, res) {
  const { to, message, alertId } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });
  const result = await sendWhatsApp({ to, message, orgId: req.orgId, alertId: alertId || null });
  res.json(result);
}
