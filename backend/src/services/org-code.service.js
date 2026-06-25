import crypto from 'crypto';
import pool from '../config/db.js';

const PREFIXES = ['SL','LNS','SAF','SEC','WCH','NHW','CPT','JHB','DBN','PTA'];

function generate() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const hex    = crypto.randomBytes(2).toString('hex').toUpperCase();
  const suffix = crypto.randomBytes(1).toString('hex').toUpperCase().slice(0, 2);
  return `${prefix}-${hex}-${suffix}`;
}

export async function generateUniqueOrgCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generate();
    const { rows } = await pool.query(
      'SELECT id FROM organizations WHERE organization_code = $1',
      [code]
    );
    if (!rows.length) return code;
  }
  throw new Error('Could not generate unique org code after 20 attempts');
}
