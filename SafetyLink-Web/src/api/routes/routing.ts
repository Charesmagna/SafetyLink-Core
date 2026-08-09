import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Calculate optimal mesh routing or dispatch paths for mobile APK
app.post('/dispatch', async (c) => {
  const { org_code, latitude, longitude } = await c.req.json();
  
  if (!org_code || latitude === undefined || longitude === undefined) {
    return c.json({ error: 'Missing location fields' }, 400);
  }

  // Find all active responders/nodes in the organization
  const { results: nodes } = await c.env.DB.prepare(`
    SELECT u.id, u.name, u.phone, u.latitude, u.longitude, u.panic_status 
    FROM users u
    JOIN organizations o ON u.org_id = o.id
    WHERE o.org_code = ? AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
  `).bind(org_code).all();

  // Basic localized routing logic: find the nearest nodes
  const nodesWithDistance = nodes.map((node: any) => {
    // Basic euclidean distance for localized routing prioritization
    const dLat = (node.latitude as number) - latitude;
    const dLon = (node.longitude as number) - longitude;
    const distanceSq = dLat * dLat + dLon * dLon;
    return { ...node, distanceSq };
  });

  // Sort by closest
  nodesWithDistance.sort((a, b) => a.distanceSq - b.distanceSq);

  // Return the top 5 closest nodes as dispatch targets
  const dispatchTargets = nodesWithDistance.slice(0, 5).map(n => ({
    id: n.id,
    name: n.name,
    phone: n.phone,
    latitude: n.latitude,
    longitude: n.longitude,
    status: n.panic_status
  }));

  return c.json({ 
    success: true, 
    dispatch_targets: dispatchTargets,
    localized_routing_active: true
  });
});

export default app;
