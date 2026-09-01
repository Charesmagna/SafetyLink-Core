export async function sendInfobipSms(to: string, message: string) {
  console.log(`[Infobip] Sending SMS to ${to}: ${message}`);
  // In a real implementation, you would use fetch to hit the Infobip SMS API
}
