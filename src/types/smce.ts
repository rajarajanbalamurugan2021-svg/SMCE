export type SystemStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'PROTECTION ACTIVE';

export type ConditionStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type HeaterMode = 'AUTO' | 'ON' | 'OFF';

export type ProtectionState = 'ACTIVE' | 'INACTIVE';

export interface SensorReading {
  timestamp: string; // ISO string
  displayTime: string; // HH:mm:ss
  equipmentTemp: number; // °C
  batteryTemp: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  batteryVoltage: number; // V
  batteryCurrent: number; // A
  heaterState: 'ON' | 'OFF';
  systemStatus: SystemStatus;
}

export interface ThresholdSettings {
  minEquipmentTemp: number; // e.g. -20 °C
  maxEquipmentTemp: number; // e.g. 40 °C
  minBatteryTemp: number; // e.g. -10 °C
  maxBatteryTemp: number; // e.g. 45 °C
  maxHumidity: number; // e.g. 80 %
  minPressure: number; // e.g. 450 hPa
  maxPressure: number; // e.g. 750 hPa (Ladakh nominal range)
  minBatteryVoltage: number; // e.g. 3.3 V
  maxBatteryVoltage: number; // e.g. 4.25 V
  maxCurrent: number; // e.g. 2.0 A
  heaterAutoThreshold: number; // e.g. -15 °C (triggers heater if temp falls below this)
  heaterHysteresis: number; // e.g. 3.0 °C (turns off heater once temp reaches threshold + hysteresis)
  soundAlertsEnabled: boolean;
  stationName: string;
  altitudeMeters: number;
}

export interface RiskCondition {
  id: string;
  name: string;
  status: ConditionStatus;
  currentValue: number;
  unit: string;
  thresholdLabel: string;
  description: string;
  recommendation: string;
}

export interface RiskAssessment {
  overallStatus: SystemStatus;
  conditions: RiskCondition[];
  activeCriticalCount: number;
  activeWarningCount: number;
  hazardScore: number; // 0 to 100
}

export interface AlertItem {
  id: string;
  timestamp: string;
  displayTime: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'PROTECTION';
  sensor: string;
  value: string;
  status: string;
  message: string;
  acknowledged: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  displayTime: string;
  temperature: number;
  batteryTemp: number;
  humidity: number;
  pressure: number;
  voltage: number;
  current: number;
  heater: 'ON' | 'OFF';
  status: SystemStatus;
}

export interface ProtectionControlState {
  heaterMode: HeaterMode; // AUTO, ON, OFF
  heaterStatus: 'ON' | 'OFF';
  tempProtection: ProtectionState;
  batteryProtection: ProtectionState;
  systemProtection: ProtectionState;
  lastTriggerReason: string;
  heaterPowerWatts: number;
}
