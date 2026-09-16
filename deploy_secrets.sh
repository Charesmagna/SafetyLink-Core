#!/bin/bash
cd worker
export CLOUDFLARE_API_TOKEN="REDACTED_CLOUDFLARE_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="d089bef8b0b58c5d9506b512ec2f63dc"

set_secret() {
  printf '%s' "$2" | npx wrangler secret put "$1" --name safetylink-api
}

set_secret JWT_SECRET "a7f3c2e8b1d4f9a0c5e2b8d1f6a3c7e0b4d9f2a5c8e1b6d3f0a7c4e9b2d5f8a1"
set_secret INTERNAL_API_SECRET "SL-INTERNAL-2026-SECURE-KEY-XJ7"
set_secret TWILIO_SID "REDACTED_TWILIO_SID"
set_secret TWILIO_AUTH_TOKEN "3a555d3f587af716d5f97dcc572604b0"
set_secret TWILIO_NUMBER "+16055695774"
set_secret VAPI_PRIVATE_KEY "43fcd7b7-b329-49f2-a9dc-09e366d38aaa"
set_secret VAPI_PHONE_NUMBER_ID "ef00ad6f-92e3-49cb-b54c-fa2b8a8f44d0"
set_secret VAPI_ASSISTANT_ID "9c9313eb-8593-4c49-b993-09eef7e8d540"
set_secret AT_API_KEY "atsk_70185519dcb73c623d397526470199068eb47cc409ac454f59ae7cd45da0a2aa811c0bcb"
set_secret AT_USERNAME "SafetyLink"
set_secret BLAND_API_KEY "not_provided"
set_secret PAYSTACK_SECRET_KEY "REDACTED_STRIPE_KEY"
set_secret PAYSTACK_PUBLIC_KEY "pk_live_123a593f6611ef474e5076a9d1b8c442eb9f3aa3"
set_secret RESPONSE_CENTRE_NUMBER "+27739441222"
set_secret NEON_DATA_API_URL "https://ep-long-base-ax4dewhh.apirest.c-4.us-east-2.aws.neon.tech/neondb/rest/v1"
set_secret AWS_ACCESS_KEY_ID "375c7925df088e45da2409ccd00cbb07"
set_secret AWS_SECRET_ACCESS_KEY "c69466e33f32d39b1ab448df54e85f486412ce3e6b513a1962b3e8dd7057b281"
set_secret AWS_ENDPOINT_URL_S3 "https://d089bef8b0b58c5d9506b512ec2f63dc.r2.cloudflarestorage.com"
set_secret RECAPTCHA_SECRET "6LeTRpwtAAAAAFfEQMdYWnQwQi1fhXvgFOnkNO9X"
set_secret CLOUDINARY_CLOUD "qcp4fx2v"
set_secret CLOUDINARY_KEY "882441484725546"
set_secret CLOUDINARY_SECRET "mM4fbl1kvoiRdKp29W1aiDWz3vQ"

npx wrangler deploy
