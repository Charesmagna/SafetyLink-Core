/**
 * In-process retry queue for outbound SMS / WhatsApp / location payloads.
 * On startup it attempts to drain any sms_logs rows still in 'queued' state.
 */
import { sendSMS } from './sms.service.js';
import { sendWhatsAppText } from './whatsapp.service.js';
import pool from '../db/index.js';

const RETRY_INTERVAL_MS = 60_000;
const MAX_ATTEMPTS      = 5;

const queue = [];

export function enqueue(job) {
  queue.push({ ...job, attempts: 0 });
}

export async function drainQueue() {
  const pending = queue.splice(0, queue.length);
  for (const job of pending) {
    try {
      if (job.type === 'sms') {
        await sendSMS(job.payload);
      } else if (job.type === 'whatsapp') {
        await sendWhatsAppText(job.payload);
      }
    } catch (err) {
      job.attempts += 1;
      if (job.attempts < MAX_ATTEMPTS) {
        queue.push(job);
      } else {
        console.error('[Queue] Job permanently failed after', MAX_ATTEMPTS, 'attempts:', err.message);
      }
    }
  }
}

export async function drainPersistedSMSQueue() {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sms_logs WHERE status = 'queued' ORDER BY sent_at ASC LIMIT 50`
    );
    for (const row of rows) {
      await sendSMS({
        to:        row.to_number,
        message:   row.message,
        orgCode:   row.org_code,
        alertId:   row.alert_id,
      });
      await pool.query('DELETE FROM sms_logs WHERE id = $1', [row.id]);
    }
    if (rows.length) console.log(`[Queue] Drained ${rows.length} persisted SMS jobs`);
  } catch (err) {
    console.error('[Queue] drainPersistedSMSQueue error:', err.message);
  }
}

export function startQueueWorker() {
  drainPersistedSMSQueue();
  setInterval(drainQueue, RETRY_INTERVAL_MS);
  console.log('[Queue] Worker started — interval', RETRY_INTERVAL_MS, 'ms');
}
