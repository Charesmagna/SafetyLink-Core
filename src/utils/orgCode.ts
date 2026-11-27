const STOP_WORDS = new Set([
  'THE', 'OF', 'AND', 'FOR', 'IN', 'AT', 'BY', 'TO', 'A', 'AN',
  'PTY', 'LTD', 'LIMITED', 'INC', 'LLC', 'CO', 'CC', 'SA', 'NPC',
]);

// Unambiguous uppercase alphanumeric charset (excludes 0/O, 1/I/L to prevent typos)
const RAND_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Derives a short, readable uppercase abbreviation from an organization's actual name.
 * Examples:
 * - "Deep South Security" -> "DSS"
 * - "Mamelodi High School" -> "MHS"
 * - "Apex Security" -> "APSE"
 * - "Fidelity" -> "FIDE"
 */
export function buildOrgAbbreviation(orgName: string): string {
  const cleaned = String(orgName || '')
    .toUpperCase()
    .replace(/&/g, ' ')
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const rawWords = cleaned.split(/\s+/).filter(Boolean);
  const meaningful = rawWords.filter((w) => !STOP_WORDS.has(w));
  const words = meaningful.length > 0 ? meaningful : rawWords;

  if (words.length === 0) return 'NODE';

  if (words.length >= 3) {
    return words
      .slice(0, 5)
      .map((w) => w[0])
      .join('');
  }

  if (words.length === 2) {
    const [w1, w2] = words;
    if (w1.length <= 3 && w2.length >= 1) {
      return `${w1}${w2[0]}`.slice(0, 5);
    }
    return `${w1.slice(0, 2)}${w2.slice(0, 2)}`;
  }

  const single = words[0].replace(/[^A-Z0-9]/g, '');
  if (single.length <= 4) return single.padEnd(2, 'X');
  return single.slice(0, 4);
}

/**
 * Generates a cryptographically random alphanumeric suffix (default 5 chars = 33.5M combinations per abbreviation).
 */
export function generateRandomCodeSuffix(length = 5): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += RAND_ALPHABET[bytes[i] % RAND_ALPHABET.length];
  }
  return out;
}

/**
 * Generates an unpredictable, organization-abbreviated mesh node code:
 * e.g. "Deep South Security" -> "SL-DSS-7K4MX"
 */
export function generateOrganizationCode(orgName: string): string {
  const abbrev = buildOrgAbbreviation(orgName);
  const suffix = generateRandomCodeSuffix(5);
  return `SL-${abbrev}-${suffix}`;
}
