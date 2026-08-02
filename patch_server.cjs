const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add BullMQ and Twilio imports
content = content.replace('import telnyxFactory from \'telnyx\';', `import telnyxFactory from 'telnyx';\nimport { Queue, Worker } from 'bullmq';\nimport twilio from 'twilio';`);

// 2. Replace the panicQueue mock with real BullMQ conditionally
const mockQueueRegex = /\/\/ In-memory queue to replace BullMQ[\s\S]*?const panicQueue = {[\s\S]*?return job;\n    }\n  };/;
const realQueue = `  // BullMQ / Redis conditionally loaded
  const hasRedis = !!process.env.REDIS_URL;
  const connection = hasRedis ? { url: process.env.REDIS_URL } : undefined;
  
  const panicQueue = hasRedis ? new Queue('panic_events', { connection }) : {
    add: async (name, data, options) => {
      const job = { id: Date.now().toString(), name, data };
      setImmediate(() => processJob(job));
      return job;
    }
  };
  
  if (hasRedis) {
    new Worker('panic_events', async (job) => {
      await processJob(job);
    }, { connection });
  }`;
content = content.replace(mockQueueRegex, realQueue);

// 3. Add Twilio test endpoint before app.post('/api/dispatch/sms'
const twilioTestEndpoint = `  app.post('/api/twilio/test', async (req, res) => {
      const { accountSid, authToken, fromNumber } = req.body;
      if (!accountSid || !authToken || !fromNumber) return res.status(400).json({ error: "Missing Twilio credentials" });
      try {
          const client = twilio(accountSid, authToken);
          // Just validating the client can be initialized and fetch account details
          const account = await client.api.accounts(accountSid).fetch();
          return res.status(200).json({ message: "Twilio credentials valid. " + account.friendlyName });
      } catch (err) {
          console.error("Twilio test error:", err);
          return res.status(500).json({ error: err.message || "Failed to authenticate with Twilio." });
      }
  });\n\n  app.post('/api/dispatch/sms'`;
content = content.replace("app.post('/api/dispatch/sms'", twilioTestEndpoint);

fs.writeFileSync(path, content);
console.log('Patched server.ts successfully');
