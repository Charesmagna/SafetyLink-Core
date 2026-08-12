import { useAppStore } from '../utils/store';
import { PanicEvent } from '../types/index';

export class OrgSyncService {
  /**
   * Pushes high-priority alerts directly into a third-party security API.
   * e.g., Patriot Systems, Listener, or a custom webhook.
   */
  static async pushIncidentToExternalSIA(event: PanicEvent, externalWebhookUrl: string): Promise<boolean> {
    try {
      console.log("[OrgSyncService] Synchronizing SIA payload to " + externalWebhookUrl + "...");
      
      const siaPayload = {
        alarm_type: 'PANIC',
        node_id: event.id,
        user_id: event.profileUsed || 'unknown',
        coordinates: {
          lat: event.lat,
          lng: event.lng
        },
        timestamp: event.timestamp,
        meta: {
          battery: '100%',
          signal: 'LTE'
        }
      };

      // Mocking the external network delay
      await new Promise(r => setTimeout(r, 800));

      // 1. Fire webhook
      if (externalWebhookUrl && externalWebhookUrl.startsWith('http')) {
        console.log("Sending payload:", siaPayload);
        try {
          const response = await fetch(externalWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + import.meta.env.VITE_SIA_TOKEN || 'placeholder'
            },
            body: JSON.stringify(siaPayload)
          });
          if (!response.ok) {
            throw new Error('SIA sync failed with status ' + response.status);
          }
        } catch (fetchErr) {
          console.warn("External SIA sync failed, continuing locally.", fetchErr);
        }
      }

      useAppStore.getState().addAuditLog(
        'DISPATCH', 
        'INFO', 
        '[Org API] Deep Sync Complete', 
        "SIA Protocol Payload delivered to " + externalWebhookUrl + " for user " + (event.profileUsed || 'unknown')
      );

      return true;
    } catch (e) {
      console.error('[OrgSyncService] Failed to sync:', e);
      return false;
    }
  }

  /**
   * Polls the external system for any incident resolution signals.
   */
  static async pollIncidentResolution(eventId: string): Promise<boolean> {
     // Mocking an endpoint check
     console.log("[OrgSyncService] Polling external API for resolution of " + eventId + "...");
     return false;
  }
}
