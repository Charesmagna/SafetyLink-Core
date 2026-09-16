import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ussdRouter } from '../routes/ussd';

vi.mock('../db', () => ({
  query: vi.fn(async (text, params) => {
    if (text.includes('SELECT id FROM users')) {
      if (params[0] === '+27831234567') {
        return { rowCount: 1, rows: [{ id: 'user-uuid' }] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (text.includes('panic_incidents WHERE idempotency_key')) {
      return { rowCount: 0, rows: [] };
    }
    if (text.includes('INSERT INTO panic_incidents')) {
      return { rowCount: 1, rows: [{ id: 'incident-uuid' }] };
    }
    return { rowCount: 0, rows: [] };
  }),
}));

vi.mock('../jobs', () => ({
  alertQueue: { add: vi.fn() },
}));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/ussd', ussdRouter);

describe('USSD Endpoint', () => {
  it('should return main menu for empty text', async () => {
    const res = await request(app)
      .post('/ussd')
      .send({ sessionId: '1', serviceCode: '*120*1#', phoneNumber: '+27831234567', text: '' });
    expect(res.text).toContain('Welcome to SafetyLink');
    expect(res.text).toContain('CON'); // Continues
  });

  it('should trigger panic for option 1 and known user', async () => {
    const res = await request(app)
      .post('/ussd')
      .send({ sessionId: '1', serviceCode: '*120*1#', phoneNumber: '+27831234567', text: '1' });
    expect(res.text).toContain('END');
    expect(res.text).toContain('Panic sent. Help is coming.');
  });

  it('should reject panic for option 1 and unknown user', async () => {
    const res = await request(app)
      .post('/ussd')
      .send({ sessionId: '1', serviceCode: '*120*1#', phoneNumber: '+27999999999', text: '1' });
    expect(res.text).toContain('END');
    expect(res.text).toContain('not registered');
  });

  it('should handle option 2 (update contacts)', async () => {
    const res = await request(app)
      .post('/ussd')
      .send({ sessionId: '1', serviceCode: '*120*1#', phoneNumber: '+27831234567', text: '2' });
    expect(res.text).toContain('END');
    expect(res.text).toContain('update contacts');
  });
});
