# SafetyLink Core

SafetyLink is a unified, highly optimized Sequential Emergency Alert Network designed to function seamlessly under restrictive offline, hardware-constrained, or distress scenarios.

## Section 1: LOCAL TEST with localhost
To test locally:
1. Ensure you have Docker and Docker Compose installed.
2. Run `docker-compose up --build -d` to start the backend, PostgreSQL database, NTFY server, and OwnCloud.
3. Access the web interface at `http://localhost:3000`.
4. Ensure your `.env` contains local endpoints for API calls and WebSockets.

## Section 2: ORACLE DEPLOY - change IPs
When deploying to an Oracle Cloud instance or similar production environment:
1. Update `.env` to replace `localhost` with your public instance IP or domain name.
2. Update the `NTFY_URL` and `OWNCLOUD_URL` similarly.
3. If deploying Android APK, ensure the API URLs are updated in the Retrofit/HTTP client.
4. Run `docker-compose -f docker-compose.prod.yml up -d` or use the standard compose file.

## Section 3: HOW TO GET GEMINI API KEY
To enable the AI capabilities of SafetyLink (e.g., KlevaBot):
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click "Create API Key".
4. Copy the generated key.
5. Paste it into your project's `.env` file under `GEMINI_API_KEY=your_key_here`.
6. Restart the backend to apply changes.

## Supabase Deployment Instructions
1. Get SUPABASE_SERVICE_KEY from Supabase > Settings > API and add it to your `.env` file.
2. Run `npm run deploy:backend` to push the database schema and deploy the `send-sos` Edge Function.
