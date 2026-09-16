import fetch from 'node-fetch';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !ZONE_ID) {
  console.error("Error: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID must be set in environment.");
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
  'Content-Type': 'application/json'
};

async function addWwwRecord() {
  console.log("Adding CNAME record for www...");
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'CNAME',
      name: 'www',
      content: 'safetylink.online',
      ttl: 1, // Auto
      proxied: true
    })
  });
  
  const data = await res.json();
  if (data.success || (data.errors && data.errors[0]?.code === 81053)) {
    console.log("✅ CNAME record for 'www' configured successfully (or already exists).");
  } else {
    console.error("❌ Failed to add CNAME:", data.errors);
  }
}

async function addRedirectRule() {
  console.log("Adding Page Rule for www -> non-www redirect...");
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      targets: [
        {
          target: 'url',
          constraint: {
            operator: 'matches',
            value: 'www.safetylink.online/*'
          }
        }
      ],
      actions: [
        {
          id: 'forwarding_url',
          value: {
            url: 'https://safetylink.online/$1',
            status_code: 301
          }
        }
      ],
      priority: 1,
      status: 'active'
    })
  });

  const data = await res.json();
  if (data.success || (data.errors && data.errors[0]?.message?.includes('already exists'))) {
    console.log("✅ Redirect Page Rule configured successfully (or already exists).");
  } else {
    console.error("❌ Failed to add Page Rule:", data.errors);
  }
}

async function main() {
  console.log("Starting Cloudflare DNS & Routing configuration...");
  await addWwwRecord();
  await addRedirectRule();
  console.log("Configuration complete.");
}

main();
