import { ThresholdSettings, LogEntry, AlertItem } from '../types/smce';

const SETTINGS_KEY = 'smce_threshold_settings_v1';
const LOGS_KEY = 'smce_system_logs_v1';
const ALERTS_KEY = 'smce_alerts_v1';

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  minEquipmentTemp: -20, // °C (Sub-zero threshold)
  maxEquipmentTemp: 40,  // °C
  minBatteryTemp: -10,   // °C
  maxBatteryTemp: 45,    // °C
  maxHumidity: 80,       // % RH (Condensation threat)
  minPressure: 450,      // hPa (Ladakh high altitude lower bound)
  maxPressure: 720,      // hPa (Ladakh high altitude upper bound ~3,000m)
  minBatteryVoltage: 3.3,// V (Per-cell cutoff or pack threshold)
  maxBatteryVoltage: 4.25,// V
  maxCurrent: 2.0,       // A
  heaterAutoThreshold: -15, // °C (Activates heater if equipment temp < this)
  heaterHysteresis: 3,   // °C (Deactivates when temp >= threshold + hysteresis)
  soundAlertsEnabled: false,
  stationName: 'Sector 4 – Ladakh Khardung-La High Altitude Testbed',
  altitudeMeters: 4580,
};

export function loadThresholdSettings(): ThresholdSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_THRESHOLDS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return { ...DEFAULT_THRESHOLDS };
}

export function saveThresholdSettings(settings: ThresholdSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadStoredLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load logs', e);
  }
  return [];
}

export function saveStoredLogs(logs: LogEntry[]): void {
  try {
    // Keep last 300 logs in storage to avoid storage quota overflow
    const trimmed = logs.slice(0, 300);
    localStorage.setItem(LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

export function clearStoredLogs(): void {
  try {
    localStorage.removeItem(LOGS_KEY);
  } catch (e) {
    console.error('Failed to clear logs', e);
  }
}

export function loadStoredAlerts(): AlertItem[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load alerts', e);
  }
  return [];
}

export function saveStoredAlerts(alerts: AlertItem[]): void {
  try {
    const trimmed = alerts.slice(0, 100);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save alerts', e);
  }
}

export function clearStoredAlerts(): void {
  try {
    localStorage.removeItem(ALERTS_KEY);
  } catch (e) {
    console.error('Failed to clear alerts', e);
  }
}

export function exportLogsToCSV(logs: LogEntry[]): void {
  if (!logs || logs.length === 0) return;

  const headers = [
    'Record ID',
    'Timestamp (ISO)',
    'Display Time',
    'Equipment Temp (°C)',
    'Battery Temp (°C)',
    'Humidity (% RH)',
    'Pressure (hPa)',
    'Battery Voltage (V)',
    'Battery Current (A)',
    'Heater Status',
    'System Status',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.timestamp}"`,
    `"${log.displayTime}"`,
    log.temperature.toFixed(2),
    log.batteryTemp.toFixed(2),
    log.humidity.toFixed(1),
    log.pressure.toFixed(1),
    log.voltage.toFixed(2),
    log.current.toFixed(2),
    `"${log.heater}"`,
    `"${log.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('download', `SMCE_HighAltitude_Telemetry_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
