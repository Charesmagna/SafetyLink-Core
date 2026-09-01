export async function createThingsBoardCustomer(orgName: string, env: any) {
  const TB_BASE_URL = "https://thingsboard.cloud"; // Replace with your instance URL
  
  try {
    // 1. Authenticate as the Tenant Administrator to obtain the JWT token
    const authResponse = await fetch(`${TB_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: env.TB_TENANT_ADMIN_EMAIL,    // Stored in Cloudflare Secrets
        password: env.TB_TENANT_ADMIN_PASSWORD  // Stored in Cloudflare Secrets
      })
    });
    
    if (!authResponse.ok) {
        throw new Error('Failed to authenticate with ThingsBoard');
    }
    const authData: any = await authResponse.json();
    const token = authData.token;

    // 2. Create the Customer Entity
    const customerResponse = await fetch(`${TB_BASE_URL}/api/customer`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: orgName,
        tenantId: authData.tenantId,
      })
    });

    if (!customerResponse.ok) {
        throw new Error('Failed to create customer on ThingsBoard');
    }

    const customerData: any = await customerResponse.json();
    return customerData.id.id;

  } catch (error) {
    console.error("ThingsBoard customer creation failed:", error);
    return null;
  }
}
