import { useAppStore } from './store';

interface DatadogConfig {
  clientToken: string;
  applicationId: string;
  site: string;
  service: string;
  env: string;
  version: string;
}

class DatadogMonitor {
  private config: DatadogConfig | null = null;
  private heartbeatInterval: any = null;
  private isInitialized = false;

  public initialize(config: DatadogConfig) {
    if (this.isInitialized) return;
    this.config = config;
    this.isInitialized = true;

    // Log initialization to App store audit logs
    useAppStore.getState().addAuditLog(
      'SYSTEM',
      'INFO',
      'DataDog Telemetry Agent Initialized',
      `Service: ${config.service} | Env: ${config.env} | Site: ${config.site}`
    );

    // Setup global error trackers
    this.setupGlobalCrashHandlers();

    // Setup active background BLE heartbeat monitor
    this.startHeartbeatMonitor();
  }

  private setupGlobalCrashHandlers() {
    window.addEventListener('error', (event) => {
      this.reportCrash('UncaughtException', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportCrash('UnhandledPromiseRejection', String(event.reason), {
        stack: event.reason?.stack
      });
    });
  }

  private startHeartbeatMonitor() {
    // Monitor the BLE background service status and connection states
    this.heartbeatInterval = setInterval(() => {
      const state = useAppStore.getState();
      const deviceCount = state.bleDevices.length;
      const connectedDevices = state.bleDevices.filter(d => d.connectionState === 'CONNECTED').length;
      
      // Simulate transmitting health telemetry payload to Datadog Intake API
      this.sendHeartbeat({
        timestamp: Date.now(),
        status: 'OK',
        service_name: 'safetylink-ble-background',
        metrics: {
          total_bonded_devices: deviceCount,
          active_connections: connectedDevices,
          gps_latitude: state.userLocation?.lat ?? null,
          gps_longitude: state.userLocation?.lng ?? null,
          drill_mode_active: state.drillMode ? 1 : 0
        }
      });
    }, 15000); // 15 seconds heartbeat
  }

  public sendHeartbeat(payload: any) {
    if (!this.isInitialized) return;
    
    // Log heartbeat transmit inside debug level of audit logs
    console.log('[DataDog] Sending background heartbeat telemetry:', payload);
    
    // Check if the BLE listener is considered offline (e.g. if we have active SOS and BLE is disconnected)
    const storeState = useAppStore.getState();
    const isSOS = storeState.activeSOSState !== 'IDLE';
    const hasDevices = storeState.bleDevices.length > 0;
    const anyConnected = storeState.bleDevices.some(d => d.connectionState === 'CONNECTED');

    if (isSOS && hasDevices && !anyConnected) {
      this.reportCrash(
        'BLE_Listener_Failure',
        'BLE hardware beacons unreachable during active SOS state (Silent Failure Detected)',
        { metrics: payload.metrics }
      );
    }
  }

  public reportCrash(type: string, message: string, context?: any) {
    if (!this.isInitialized) return;

    console.error(`[DataDog] CRITICAL EVENT [${type}]: ${message}`, context);

    useAppStore.getState().addAuditLog(
      'SYSTEM',
      'SEVERE',
      `DataDog Crash Alert: ${type}`,
      `Message: ${message} | Context: ${JSON.stringify(context || {})}`
    );

    // Mock transmission to DataDog intake API
    const intakeUrl = `https://http-intake.logs.${this.config?.site}/api/v2/logs`;
    fetch(intakeUrl, {
      method: 'POST',
      headers: {
        'DD-API-KEY': this.config?.clientToken || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ddsource: 'android-capacitor',
        ddtags: `env:${this.config?.env},version:${this.config?.version},service:${this.config?.service}`,
        hostname: 'safetylink-device',
        message: `[${type}] ${message}`,
        severity: 'EMERGENCY',
        context: context
      })
    }).catch(() => {
      // Offline or mocked endpoint fallback
    });
  }

  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.isInitialized = false;
  }
}

export const datadogMonitor = new DatadogMonitor();

export function ddsetup() {
  const metaEnv = (import.meta as any).env || {};
  const clientToken = metaEnv.VITE_DATADOG_CLIENT_TOKEN || 'pub_dd_client_token_mock_12345';
  const applicationId = metaEnv.VITE_DATADOG_APP_ID || 'dd_app_id_mock_abcde';
  const site = metaEnv.VITE_DATADOG_SITE || 'datadoghq.com';
  const service = 'safetylink-secure-mesh';
  const env = metaEnv.MODE || 'development';
  const version = '1.0.0';

  datadogMonitor.initialize({
    clientToken,
    applicationId,
    site,
    service,
    env,
    version
  });
}
