import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Validate request body against schema
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { [key: string]: string } = {};
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = req.body[key];
      
      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[key] = `${key} is required`;
        continue;
      }
      
      if (value === undefined || value === null) continue;
      
      // Check type
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors[key] = `${key} must be ${rules.type}, got ${actualType}`;
        continue;
      }
      
      // Check pattern (for strings)
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors[key] = `${key} format is invalid`;
      }
      
      // Check min/max
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors[key] = `${key} must be >= ${rules.min}`;
      }
      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors[key] = `${key} must be <= ${rules.max}`;
      }
      
      // Check enum
      if (rules.enum && !rules.enum.includes(value)) {
        errors[key] = `${key} must be one of: ${rules.enum.join(', ')}`;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Validation failed', errors });
      return;
    }
    
    next();
  };
}

/**
 * Sanitize input to prevent XSS/injection
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>"'`]/g, (char) => {
      const map: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
      };
      return map[char];
    })
    .trim();
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-()]/g, ''));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prevent SSRF attacks by checking URL
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const blockedHosts = ['localhost', '127.0.0.1', '169.254.169.254', '0.0.0.0'];
    
    if (blockedHosts.includes(parsed.hostname)) return false;
    if (parsed.hostname.endsWith('.local') || parsed.hostname.endsWith('.internal')) return false;
    
    return true;
  } catch {
    return false;
  }
}
