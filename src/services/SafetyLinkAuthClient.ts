const DEFAULT_API_BASE_URL = 'https://api.safetylink.online';

export type AuthRole = 'USER' | 'ORG' | 'ADMIN';

export interface SafetyLinkUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  orgCode: string;
  createdAt: number;
}

export interface SafetyLinkOrganization {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  createdAt: number;
  approved: boolean;
}

export interface AuthSession {
  token: string;
  role: AuthRole;
  user?: SafetyLinkUser;
  organization?: SafetyLinkOrganization;
}

export class SafetyLinkApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'SafetyLinkApiError';
  }
}

/**
 * Small, server-authoritative auth client for the Cloudflare Worker.
 * Does not read saved local backend URLs, create local credentials, or silently
 * fall back to Firebase/local storage after an API failure.
 */
export class SafetyLinkAuthClient {
  private readonly baseUrl: string;

  constructor(baseUrl = DEFAULT_API_BASE_URL, private readonly fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https:\/\//i.test(this.baseUrl)) {
      throw new SafetyLinkApiError('SafetyLink API must use HTTPS.');
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
    } catch {
      throw new SafetyLinkApiError('Cannot connect to the SafetyLink server. Check your internet connection.');
    }

    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new SafetyLinkApiError(payload?.error || `SafetyLink request failed (${response.status}).`, response.status);
    }
    return payload as T;
  }

  async registerUser(input: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    orgCode?: string;
  }): Promise<{ token: string; user: SafetyLinkUser }> {
    const result: any = await this.request('/api/auth/register-user', {
      method: 'POST',
      body: JSON.stringify({
        username: input.username.trim(),
        password: input.password,
        name: input.fullName.trim(),
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        role: input.role,
        orgCode: input.orgCode?.trim() || '',
      }),
    });
    if (!result?.token || !result?.userId) throw new SafetyLinkApiError('Server returned an incomplete user registration response.');
    return {
      token: result.token,
      user: {
        id: String(result.userId),
        username: String(result.username || input.username),
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        role: String(result.role || input.role),
        orgCode: String(result.orgCode || result.org_code || input.orgCode || ''),
        createdAt: Date.now(),
      },
    };
  }

  async registerOrganization(input: {
    name: string;
    contactName: string;
    contactEmail: string;
    password: string;
  }): Promise<{ token: string; organization: SafetyLinkOrganization; orgCode: string }> {
    const result: any = await this.request('/api/auth/register-org', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name.trim(),
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail.trim().toLowerCase(),
        password: input.password,
      }),
    });
    const org = result?.organization;
    const orgCode = String(result?.org_code || result?.orgId || org?.id || '');
    if (!result?.token || !orgCode || !org) throw new SafetyLinkApiError('Server returned an incomplete organization registration response.');
    return {
      token: result.token,
      orgCode,
      organization: {
        id: orgCode,
        name: String(org.name || result.orgName || input.name),
        contactName: input.contactName.trim(),
        contactEmail: String(org.contactEmail || input.contactEmail).toLowerCase(),
        createdAt: Date.now(),
        approved: org.approved !== false,
      },
    };
  }

  async login(username: string, password: string, orgCode = ''): Promise<AuthSession> {
    const result: any = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password, org_code: orgCode.trim() }),
    });
    if (!result?.token) throw new SafetyLinkApiError('Server did not return an authentication token.');

    if (result.userId) {
      return {
        token: result.token,
        role: 'USER',
        user: {
          id: String(result.userId),
          username: String(result.username || username),
          fullName: String(result.fullName || result.name || result.username || username),
          email: String(result.email || ''),
          phone: String(result.phone || ''),
          role: String(result.role || 'Community Member'),
          orgCode: String(result.orgCode || result.org_code || ''),
          createdAt: Date.now(),
        },
      };
    }

    const code = String(result.org_code || result.orgId || '');
    if (!code) throw new SafetyLinkApiError('Server response did not identify a user or organization account.');
    return {
      token: result.token,
      role: 'ORG',
      organization: {
        id: code,
        name: String(result.orgName || result.org_name || code),
        contactName: username.trim(),
        contactEmail: '',
        createdAt: Date.now(),
        approved: true,
      },
    };
  }

  async loginSuperAdmin(email: string, password: string): Promise<string> {
    const result: any = await this.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!result?.token) throw new SafetyLinkApiError('Server did not return a superadmin session.');
    return result.token;
  }

  async getAdminSummary(sessionToken: string): Promise<Record<string, number>> {
    return this.request('/api/admin/summary', { headers: { Authorization: `Bearer ${sessionToken}` } });
  }

  async getAdminUsers(sessionToken: string): Promise<any[]> {
    const result: any = await this.request('/api/admin/users', { headers: { Authorization: `Bearer ${sessionToken}` } });
    return Array.isArray(result?.users) ? result.users : [];
  }

  /** The Worker JWT route uses a distinct token from the PBKDF2 admin session. */
  async getSuperadminOrganizations(workerToken: string): Promise<any[]> {
    const result: any = await this.request('/api/superadmin/orgs', { headers: { Authorization: `Bearer ${workerToken}` } });
    return Array.isArray(result) ? result : [];
  }
}
