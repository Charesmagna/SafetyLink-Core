export async function sendTelegramAlert(message: string) {
  console.log(`[Telegram] Sending message to Response Center: ${message}`);
  // In a real implementation, you would use fetch to hit api.telegram.org/bot<token>/sendMessage
}
