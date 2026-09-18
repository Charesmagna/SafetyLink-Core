#!/bin/bash
cd worker
export CLOUDFLARE_API_TOKEN="REDACTED_CLOUDFLARE_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="REDACTED"

set_secret() {
  printf '%s' "$2" | npx wrangler secret put "$1" --name safetylink-api
}

set_secret JWT_SECRET "REDACTEDREDACTED"
set_secret INTERNAL_API_SECRET "SL-INTERNAL-2026-SECURE-KEY-XJ7"
set_secret TWILIO_SID "REDACTED_TWILIO_SID"
set_secret TWILIO_AUTH_TOKEN "REDACTED"
set_secret TWILIO_NUMBER "+16055695774"
set_secret VAPI_PRIVATE_KEY "43fcd7b7-b329-49f2-a9dc-09e366d38aaa"
set_secret VAPI_PHONE_NUMBER_ID "ef00ad6f-92e3-49cb-b54c-fa2b8a8f44d0"
set_secret VAPI_ASSISTANT_ID "9c9313eb-8593-4c49-b993-09eef7e8d540"
set_secret AT_API_KEY "atsk_REDACTEDREDACTED811c0bcb"
set_secret AT_USERNAME "SafetyLink"
set_secret BLAND_API_KEY "not_provided"
set_secret PAYSTACK_SECRET_KEY "REDACTED_STRIPE_KEY"
set_secret PAYSTACK_PUBLIC_KEY "REDACTED_PK"
set_secret RESPONSE_CENTRE_NUMBER "+27739441222"
set_secret NEON_DATA_API_URL "https://ep-long-base-ax4dewhh.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1"
set_secret AWS_ACCESS_KEY_ID "REDACTED"
set_secret AWS_SECRET_ACCESS_KEY "REDACTEDREDACTED"
set_secret AWS_ENDPOINT_URL_S3 "https://REDACTED.r2.cloudflarestorage.com"
set_secret RECAPTCHA_SECRET "6LeTRpwtAAAAAFfEQMdYWnQwQi1fhXvgFOnkNO9X"
set_secret CLOUDINARY_CLOUD "qcp4fx2v"
set_secret CLOUDINARY_KEY "882441484725546"
set_secret CLOUDINARY_SECRET "mM4fbl1kvoiRdKp29W1aiDWz3vQ"

npx wrangler deploy
