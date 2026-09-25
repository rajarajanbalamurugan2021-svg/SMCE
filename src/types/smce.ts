export type SystemStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'PROTECTION ACTIVE';

export type ConditionStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type HeaterMode = 'AUTO' | 'ON' | 'OFF';

export type ProtectionState = 'ACTIVE' | 'INACTIVE';

export type ThermalRiskLevel = 'SAFE' | 'CAUTION' | 'HIGH' | 'CRITICAL';

export type TemperatureTrendDirection = 'FALLING' | 'RISING' | 'STABLE';

export type ThermalControlMode = 'PREDICTIVE' | 'ADAPTIVE' | 'MANUAL' | 'BATTERY GUARD' | 'REACTIVE' | 'STANDBY';

export type EnvironmentalRiskLevel = 'SAFE' | 'CAUTION' | 'HIGH RISK' | 'CRITICAL';

export type CondensationRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type SIHDemoScenario =
  | 'NORMAL'
  | 'EXTREME COLD'
  | 'RAPID COOLING'
  | 'LOW BATTERY'
  | 'HEATER FAILURE'
  | 'SENSOR FAILURE'
  | 'CONDENSATION RISK';

export interface ThermalLearningState {
  heatingEfficiency: number; // e.g. 88%
  lastHeatingResponseSec: number; // e.g. 18 sec
  adaptiveFactor: number; // e.g. 1.15
  samplesCount: number;
  lastLearnedRate: number; // °C/min
}

export interface FaultItem {
  id: string;
  code: string;
  timestamp: string;
  displayTime: string;
  category: 'THERMAL' | 'SENSOR' | 'BATTERY' | 'FAN' | 'COMMUNICATION';
  severity: 'CRITICAL' | 'WARNING';
  title: string;
  description: string;
  possibleCauses: string[];
  recommendedAction: string;
  cleared: boolean;
}

export interface SensorReading {
  timestamp: string; // ISO string
  displayTime: string; // HH:mm:ss
  equipmentTemp: number; // °C (DS18B20 / PT100)
  batteryTemp: number; // °C (NTC Core Probe)
  humidity: number; // % (BME280)
  pressure: number; // hPa (BME280)
  batteryVoltage: number; // V (INA219)
  batteryCurrent: number; // A (INA219)
  heaterState: 'ON' | 'OFF';
  systemStatus: SystemStatus;
  // MAHAPS Extensions
  predictedTemp?: number; // Estimated equipment temperature in 5-10 mins (°C)
  tempRateOfChange?: number; // Rate of change in °C/min
  tempTrend?: TemperatureTrendDirection;
  heaterPwm?: number; // Software PWM duty cycle (0-100%)
  fanState?: 'ON' | 'OFF';
  fanPwm?: number; // Cooling/ventilation fan speed (0-100%)
  dewPoint?: number; // Calculated dew point (°C)
  dewPointMargin?: number; // equipmentTemp - dewPoint (°C)
  condensationRisk?: CondensationRiskLevel;
  environmentalRisk?: EnvironmentalRiskLevel;
  thermalRisk?: ThermalRiskLevel;
  thermalControlMode?: ThermalControlMode;
  systemHealthScore?: number; // 0 - 100%
  batteryHealthScore?: number; // 0 - 100%
  batterySoc?: number; // 0 - 100%
}

export interface ThresholdSettings {
  minEquipmentTemp: number; // e.g. -20 °C
  maxEquipmentTemp: number; // e.g. 40 °C
  minBatteryTemp: number; // e.g. -10 °C
  maxBatteryTemp: number; // e.g. 45 °C
  maxHumidity: number; // e.g. 80 %
  minPressure: number; // e.g. 450 hPa
  maxPressure: number; // e.g. 750 hPa (Ladakh nominal range)
  minBatteryVoltage: number; // e.g. 3.3 V (or 10.5V in 3S mode)
  maxBatteryVoltage: number; // e.g. 4.25 V (or 12.6V in 3S mode)
  maxCurrent: number; // e.g. 2.0 A
  heaterAutoThreshold: number; // e.g. -15 °C (triggers heater if temp falls below this)
  heaterHysteresis: number; // e.g. 3.0 °C (turns off heater once temp reaches threshold + hysteresis)
  soundAlertsEnabled: boolean;
  stationName: string;
  altitudeMeters: number;
  // MAHAPS Adaptive settings
  predictiveWindowMinutes?: number; // default 5 min
  adaptiveLearningEnabled?: boolean;
  lowBatteryThrottleThreshold?: number; // e.g. 3.4V (or 11.1V for 3S)
  maxPwmOnLowBattery?: number; // e.g. 30%
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
  // MAHAPS extensions
  systemHealthScore: number; // 0 to 100%
  environmentalRisk: EnvironmentalRiskLevel;
  condensationRisk: CondensationRiskLevel;
  dewPoint: number;
  dewPointMargin: number;
  thermalRisk: ThermalRiskLevel;
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
  heaterPwm?: number;
  predictedTemp?: number;
  healthScore?: number;
}

export interface ProtectionControlState {
  heaterMode: HeaterMode; // AUTO, ON, OFF
  heaterStatus: 'ON' | 'OFF';
  tempProtection: ProtectionState;
  batteryProtection: ProtectionState;
  systemProtection: ProtectionState;
  lastTriggerReason: string;
  heaterPowerWatts: number;
  // MAHAPS Extensions
  heaterPwm: number; // 0 to 100%
  predictedTemp: number; // °C
  tempRateOfChange: number; // °C/min
  tempTrend: TemperatureTrendDirection;
  thermalRisk: ThermalRiskLevel;
  thermalControlMode: ThermalControlMode;
  learning: ThermalLearningState;
  fanStatus: 'ON' | 'OFF';
  fanPwm: number;
  activeFaults: FaultItem[];
  systemHealthScore: number;
  condensationRisk: CondensationRiskLevel;
  environmentalRisk: EnvironmentalRiskLevel;
  dewPoint: number;
  dewPointMargin: number;
  batterySoc: number;
}
