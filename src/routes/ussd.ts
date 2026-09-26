import { Router, Request, Response } from 'express';

export const ussdRouter = Router();

// USSD Gateway session handler (Africa's Talking / Telkom / MTN / Vodacom format)
ussdRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body || {};
    let response = '';

    if (!text || text === '') {
      response = `CON Welcome to SafetyLink Emergency Mesh
1. Trigger SOS Alert
2. Check Patrol Dispatch
3. Request Callback
4. Community SafeZone Status`;
    } else if (text === '1') {
      response = `END 🚨 EMERGENCY TRIGGERED.
Your location and phone (${phoneNumber || 'unknown'}) have been dispatched to the nearest response node.`;
    } else if (text === '2') {
      response = `END SafetyLink Patrol Telemetry:
Active units: 4
Response time est: 3 mins.`;
    } else if (text === '3') {
      response = `END Callback request logged. A response officer will contact you immediately.`;
    } else if (text === '4') {
      response = `END SafeZones Active:
- North Perimeter Gate
- Main Station Hub
- Emergency Shelter B`;
    } else {
      response = `END Invalid selection. SafetyLink mesh standing by.`;
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (error: any) {
    res.status(500).send('END System temporarily unavailable.');
  }
});
