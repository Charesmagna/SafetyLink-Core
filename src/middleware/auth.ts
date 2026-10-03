import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  orgId?: number;
  orgCode?: string;
  role?: string;
  superAdmin?: boolean;
}

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  userId?: string;
  orgId?: number;
  orgCode?: string;
  role?: string;
  superAdmin?: boolean;
  exp: number;
  iat: number;
}

/**
 * Verify JWT token from Authorization header
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    // Decode base64 (simple JWT format: header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (payload.exp < Date.now()) {
      console.warn('[auth] Token expired');
      return null;
    }
    
    return payload;
  } catch (err) {
    console.warn('[auth] Token verification failed:', err);
    return null;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Partial<TokenPayload>): string {
  const tokenPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + env.JWT_EXPIRY,
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64');
  
  return `${header}.${body}.${signature}`;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  
  return parts[1];
}

/**
 * Standard auth middleware for protected routes
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  
  req.userId = payload.userId;
  req.orgId = payload.orgId;
  req.orgCode = payload.orgCode;
  req.role = payload.role;
  req.superAdmin = payload.superAdmin || false;
  
  next();
}

/**
 * Super admin only middleware
 */
export function superAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  // Allow master key bypass for emergency
  if (token === env.INTERNAL_API_SECRET) {
    req.superAdmin = true;
    return next();
  }
  
  const payload = verifyToken(token);
  if (!payload || !payload.superAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  req.superAdmin = true;
  req.userId = payload.userId;
  req.orgId = payload.orgId;
  
  next();
}

/**
 * Organization admin middleware
 */
export function orgAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const payload = verifyToken(token);
  if (!payload || (!payload.superAdmin && payload.role !== 'ORG')) {
    res.status(403).json({ error: 'Organization admin access required' });
    return;
  }
  
  req.userId = payload.userId;
  req.orgId = payload.orgId;
  req.orgCode = payload.orgCode;
  req.role = payload.role;
  req.superAdmin = payload.superAdmin || false;
  
  next();
}
