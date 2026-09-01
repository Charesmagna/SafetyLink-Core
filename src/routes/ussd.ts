import { Router } from 'express';
import { getUssdAdapter } from '../providers/ussd';
import { query } from '../db';
import { createIncident } from '../services/panic-alert';
import { processPanicAlert } from "../services/panic-alert";

export const ussdRouter = Router();

ussdRouter.post('/', async (req, res) => {
  const adapter = getUssdAdapter();
  const ussdReq = adapter.parseRequest(req.body);

  const { text, phoneNumber } = ussdReq;
  let responseText = '';
  let isEnd = false;

  // Extremely basic matching - parse the text
  const parts = text.split('*').filter(Boolean);

  if (parts.length === 0 || text === '') {
    responseText = "Welcome to SafetyLink\n1. Send Panic Alert\n2. Update Emergency Contacts\n3. Check Subscription";
    isEnd = false;
  } else if (parts[0] === '1') {
    // Send Panic Alert
    try {
      const userRes = await query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      if (userRes.rowCount === 0) {
        responseText = "You are not registered with SafetyLink.";
        isEnd = true;
      } else {
        const userId = userRes.rows[0].id as string;
        // Create idempotent panic incident immediately
        const incidentId = await createIncident(userId, 'USSD');
        
        // Queue it asynchronously
        processPanicAlert(incidentId).catch(console.error);
        
        responseText = "Panic sent. Help is coming.";
        isEnd = true;
      }
    } catch (err) {
      console.error(err);
      responseText = "System Error.";
      isEnd = true;
    }
  } else if (parts[0] === '2') {
    responseText = "Visit safetylink.online to securely update contacts.";
    isEnd = true;
  } else if (parts[0] === '3') {
    responseText = "Your SafetyLink subscription is active.";
    isEnd = true;
  } else {
    responseText = "Invalid choice.";
    isEnd = true;
  }

  res.send(adapter.formatResponse(responseText, isEnd));
});
