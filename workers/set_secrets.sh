#!/bin/bash
# Run this once to set all Cloudflare Worker secrets
# wrangler must be installed and logged in

cd workers

echo "Setting SafetyLink Worker secrets..."

echo "REDACTED_STRIPE_KEY" | wrangler secret put PAYSTACK_SECRET_KEY
echo "+27680079911" | wrangler secret put RESPONSE_CENTRE_NUMBER
echo "true" | wrangler secret put ALERTS_ENABLED
echo "africastalking" | wrangler secret put USSD_PROVIDER
echo "atsk_da89a68ad07727795c9d06541d8299f2df50a4da3fb2d62d762892e5fd5f268533c9573b" | wrangler secret put USSD_API_KEY

# These you fill in manually:
# wrangler secret put VAPI_PRIVATE_KEY
# wrangler secret put VAPI_ASSISTANT_ID
# wrangler secret put VAPI_PHONE_NUMBER_ID
# wrangler secret put TWILIO_SID
# wrangler secret put TWILIO_NUMBER
# wrangler secret put WHATSAPP_ACCESS_TOKEN
# wrangler secret put BLAND_API_KEY
# wrangler secret put BLAND_VOICE_ID
# wrangler secret put TELEGRAM_BOT
# wrangler secret put TELEGRAM_CHAT
# wrangler secret put UPSTASH_REDIS_REST_URL
# wrangler secret put UPSTASH_REDIS_REST_TOKEN

echo "Done. Deploy with: cd workers && wrangler deploy"
