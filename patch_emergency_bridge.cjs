const fs = require('fs');
const file = 'src/services/EmergencyBridgeService.ts';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  private async dispatchWithBackoff(payload: any, maxRetries = 5): Promise<boolean> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await CapacitorHttp.post({
          url: this.AURA_API_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${this.authToken}\`,
          },
          data: payload,
        });

        if (response.status === 200 || response.status === 201) {
          return true;
        } else {
          console.error(\`Dispatch failed with status: \${response.status}\`);
        }
      } catch (error) {
        console.error(\`Network error during dispatch attempt \${retries + 1}:\`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000;
        console.log(\`[Offline Dispatch Retry] Retrying in \${delay}ms...\`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Queue to offline storage if all retries failed
    console.warn('[Offline Dispatch] All immediate retries failed. Queuing to secure local DB.');
    // TODO: Write to offline SQLite queue for later synchronization
    return false;
  }
`;

content = content.replace('  private async triggerHapticFeedback(): Promise<void> {', newMethod + '\n  private async triggerHapticFeedback(): Promise<void> {');

const oldCallRegex = /const response = await CapacitorHttp\.post\(\{\s*url: this\.AURA_API_URL,[\s\S]*?if \(response\.status === 200 \|\| response\.status === 201\) \{/m;

const replacementCall = `
      const success = await this.dispatchWithBackoff(payload);
      if (success) {
`;

content = content.replace(oldCallRegex, replacementCall);
fs.writeFileSync(file, content);
