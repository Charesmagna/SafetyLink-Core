import { validationResult, body } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('display_name').trim().notEmpty().isLength({ max: 100 }),
    body('org_code').trim().notEmpty(),
    body('role').optional().isIn(['member', 'responder']),
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
};

export const alertValidators = [
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('isDrill').optional().isBoolean(),
  body('clientId').optional().trim(),
];
