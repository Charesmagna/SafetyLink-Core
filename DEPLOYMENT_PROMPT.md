Deploy SafetyLink DNS Shield

1. **Prerequisites**: Ensure Wrangler CLI is installed (`npm install -g wrangler`) and you are logged into Cloudflare (`wrangler login`).
2. **Clone**: Clone the repo:
   `git clone https://x:art_v2_x_bd41e6cad66aeaf4d0bd77145d6c47c732010e66@31b91e7f9954ad8aa334d46f012bd8ed.artifacts.cloudflare.net/git/lee-production/lee-safetylink-dns-shield-cc5ed41c.git safetylink-dns-shield`
3. **Navigate**: `cd safetylink-dns-shield/dns-worker`
4. **KV Namespace**: Create the blocklist namespace:
   `npx wrangler kv:namespace create "DNS_BLOCKLIST"`
   *Copy the generated ID and update `wrangler.jsonc`.*
5. **D1 Database**: Create the org configuration database:
   `npx wrangler d1 create safetylink-dns-db`
   *Copy the generated ID and update `wrangler.jsonc`.*
6. **Migrations**: Apply the database schema:
   `npx wrangler d1 execute safetylink-dns-db --local --file=./schema.sql`
   `npx wrangler d1 execute safetylink-dns-db --remote --file=./schema.sql`
7. **Deploy Worker**: 
   `npm install && npx wrangler deploy`
8. **DNS Records**: In the Cloudflare Dashboard for `safetylink.online`, add two Proxied (Orange Cloud) records:
   - A Record: `dns` -> `192.0.2.1`
   - AAAA Record: `dns` -> `100::`
9. **Worker Route**: In Cloudflare Dashboard -> Workers Routes, add a route for `dns.safetylink.online/*` and select the `safetylink-dns-worker`.
10. **Seed Blocklist**: Send a POST request to your deployed worker's admin endpoint to trigger the StevenBlack blocklist sync.