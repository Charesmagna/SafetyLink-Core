// safetylink-web/src/api/services/thingsboard.ts

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
    
    if (!authResponse.ok) throw new Error("ThingsBoard authentication failed");
    const { token } = await authResponse.json();

    // 2. Execute the POST /api/customer request to create the isolated environment
    const customerResponse = await fetch(`${TB_BASE_URL}/api/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: orgName,
        country: "South Africa",
        description: "Auto-provisioned via SafetyLink onboarding"
      })
    });

    if (!customerResponse.ok) throw new Error("Failed to create customer");
    const customerData = await customerResponse.json();
    
    // Returns the newly created Customer ID
    return customerData.id.id; 
    
  } catch (error) {
    console.error("ThingsBoard Provisioning Error:", error);
    return null;
  }
}
