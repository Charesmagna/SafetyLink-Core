const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Define the function if it doesn't exist
const funcDef = `
  const connectService = async (serviceName: 'turn' | 'twilio') => {
    try {
      if (serviceName === 'turn' && !turnApiToken) throw new Error("Turn.io API Token is required");
      if (serviceName === 'twilio' && (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber)) throw new Error("Twilio Account SID, Auth Token, and From Number are required");

      const response = await supabase.functions.invoke('setup-service', {
        body: {
          service: serviceName,
          token: serviceName === 'turn' ? turnApiToken : undefined,
          accountSid: twilioAccountSid,
          authToken: twilioAuthToken,
          fromNumber: twilioFromNumber
        }
      });

      if (response.error) throw new Error(response.error.message || "Unknown error from edge function");

      useAppStore.getState().addToast(\`Successfully connected to \${serviceName}!\`, "success");
    } catch (e: any) {
      useAppStore.getState().addToast(\`Failed to connect \${serviceName}: \${e.message}\`, "error");
    }
  };

  const testTwilioAndSupabase = async () => {
    try {
      useAppStore.getState().addToast("Testing integrations...", "info");
      
      const response = await supabase.functions.invoke('send-twilio-sms', {
        body: {
          to: currentUser?.phone || "+1234567890",
          message: "SafetyLink Test - Integrations are working!"
        }
      });
      if (response.error) throw new Error(response.error.message);
      
      useAppStore.getState().addToast("Test successful! Integrations are working.", "success");
    } catch (e: any) {
      useAppStore.getState().addToast("Test failed: " + e.message, "error");
    }
  };
`;

// Insert the functions right before `const handleFactoryReset` or similar if they aren't there
if (!content.includes('const testTwilioAndSupabase')) {
  content = content.replace(/(const handleFactoryReset)/, funcDef + '\n  $1');
}

fs.writeFileSync('src/components/Settings.tsx', content);
