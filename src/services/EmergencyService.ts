import { BaseService } from './BaseService';
import { Contact } from '../types';

export class EmergencyService extends BaseService {
  private static instance: EmergencyService;

  private constructor() {
    super('EmergencyService');
  }

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  /**
   * Executes a POST request to Twilio SMS API and simultaneously logs the event to CockroachDB endpoint.
   */
  public async dispatchEmergency(
    lat: number,
    lng: number,
    description: string,
    contacts: Contact[]
  ): Promise<{ twilioSuccess: boolean; cockroachSuccess: boolean }> {
    this.logInfo('Initiating transaction flow for emergency trigger...', `Coords: ${lat}, ${lng}`);

    // Twilio parameters
    const env = (import.meta as any).env || {};
    const twilioAccountSid = env.VITE_TWILIO_ACCOUNT_SID || 'AC_MOCK_TWILIO_ACCOUNT_SID_SAFETY_LINK';
    const twilioAuthToken = env.VITE_TWILIO_AUTH_TOKEN || 'MOCK_AUTH_TOKEN_VALUE_48102947291';
    const twilioFromNumber = env.VITE_TWILIO_FROM_NUMBER || '+15005550006';

    // CockroachDB HTTP/Serverless endpoint parameters
    const cockroachEndpoint = env.VITE_COCKROACH_DB_ENDPOINT || 'https://aws-us-east-1.cockroachlabs.cloud/api/v1/databases/safetylink-prod/sql';
    const cockroachApiKey = env.VITE_COCKROACH_DB_API_KEY || 'MOCK_COCKROACH_SECRET_KEY_8829471';

    let twilioSuccess = true;
    let cockroachSuccess = true;

    // Build emergency payload
    const payload = {
      incidentId: `INC-${Math.floor(1000 + Math.random() * 9000)}-SA`,
      lat,
      lng,
      timestamp: Date.now(),
      description,
      severity: 'CRITICAL',
      status: 'DISPATCHED'
    };

    // 1. Dispatch SMS alerts to each contact via Twilio SMS API
    const smsPromises = contacts.map(async (contact) => {
      if (contact.channelType !== 'SMS') {
        this.logInfo(`Skipping Twilio SMS for ${contact.label} as channel type is ${contact.channelType}`);
        return;
      }

      const bodyText = contact.template
        .replace('{LAT}', lat.toFixed(5))
        .replace('{LNG}', lng.toFixed(5));

      try {
        this.logInfo(`Dispatching Twilio SMS API request for ${contact.label} (${contact.phone})...`);
        
        // Setup x-www-form-urlencoded body for Twilio Messages endpoint
        const formData = new URLSearchParams();
        formData.append('To', contact.phone);
        formData.append('From', twilioFromNumber);
        formData.append('Body', bodyText);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Twilio HTTP Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        this.logInfo(`Twilio SMS delivered to ${contact.label}. SID: ${data.sid}`);
      } catch (err: any) {
        this.logError(`Twilio dispatch failed for ${contact.label}: ${err.message}`);
        twilioSuccess = false;
      }
    });

    // 2. Simultaneously log event transaction to the CockroachDB endpoint
    const dbPromise = (async () => {
      try {
        this.logInfo('Logging emergency event transaction directly to CockroachDB Serverless endpoint...');
        
        // Execute insert query via secure CockroachDB SQL endpoint
        const response = await fetch(cockroachEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cockroachApiKey}`,
            'X-Cockroach-Transaction-Priority': 'HIGH'
          },
          body: JSON.stringify({
            statement: `
              INSERT INTO org_events (id, timestamp, latitude, longitude, description, severity, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7);
            `,
            parameters: [
              payload.incidentId,
              new Date(payload.timestamp).toISOString(),
              payload.lat,
              payload.lng,
              payload.description,
              payload.severity,
              payload.status
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`CockroachDB API returned status ${response.status}`);
        }

        this.logInfo(`Transaction committed in CockroachDB! Row inserted for incident ${payload.incidentId}.`);
      } catch (err: any) {
        this.logError(`Failed logging event transaction to CockroachDB: ${err.message}`);
        cockroachSuccess = false;
      }
    })();

    // Run simultaneously
    await Promise.all([...smsPromises, dbPromise]);

    return { twilioSuccess, cockroachSuccess };
  }
}
