import { SensorReading, ThresholdSettings } from '../types/smce';

export interface SimulationState {
  enabled: boolean;
  intervalMs: number;
  equipmentTemp: number;
  batteryTemp: number;
  humidity: number;
  pressure: number;
  batteryVoltage: number;
  batteryCurrent: number;
  ambientColdTemp: number; // Target Ladakh ambient temperature
  heaterActive: boolean;
  manualOverrideActive: boolean;
}

export const INITIAL_SIM_STATE: SimulationState = {
  enabled: true,
  intervalMs: 1500,
  equipmentTemp: -16.4,
  batteryTemp: -13.2,
  humidity: 32.5,
  pressure: 574.8, // typical 4,500m Ladakh pressure in hPa
  batteryVoltage: 3.74,
  batteryCurrent: 0.42,
  ambientColdTemp: -22.0,
  heaterActive: false,
  manualOverrideActive: false,
};

/**
 * Step simulation physics one tick forward
 */
export function stepSimulation(
  current: SimulationState,
  isHeaterOn: boolean,
  _settings: ThresholdSettings
): SimulationState {
  if (!current.enabled) {
    return current;
  }

  // If manual override is active, apply gentle jitter around current manual values
  const jitter = (amount: number) => (Math.random() - 0.5) * 2 * amount;

  let eqTemp = current.equipmentTemp;
  let batTemp = current.batteryTemp;
  let currentVal = current.batteryCurrent;
  let voltageVal = current.batteryVoltage;
  let humidityVal = current.humidity;
  let pressureVal = current.pressure;

  if (isHeaterOn) {
    // Thermal rise when heater is active: warm up towards ~10°C
    eqTemp += 0.45 + jitter(0.08);
    batTemp += 0.22 + jitter(0.05);

    // Current draw jumps when 24W PTC heating element is active
    const targetCurrent = 1.68 + jitter(0.06);
    currentVal = currentVal * 0.7 + targetCurrent * 0.3;

    // Slight voltage sag due to heating load and internal resistance
    voltageVal = Math.max(3.0, voltageVal - 0.003 + jitter(0.002));
  } else {
    // Ambient heat loss towards Ladakh sub-zero ambient
    const delta = current.ambientColdTemp - eqTemp;
    eqTemp += delta * 0.04 + jitter(0.08);

    const batDelta = current.ambientColdTemp - batTemp;
    batTemp += batDelta * 0.02 + jitter(0.05);

    // Nominal current (telemetry radio + microcontrollers + sensors)
    const targetCurrent = 0.38 + jitter(0.04);
    currentVal = currentVal * 0.8 + targetCurrent * 0.2;

    // Gradual voltage stabilization or slow discharge
    voltageVal = Math.max(3.0, voltageVal - 0.0004 + jitter(0.002));
  }

  // Humidity slight natural variation (constrained between 10% and 98%)
  humidityVal = Math.min(95, Math.max(12, humidityVal + jitter(0.35)));

  // Barometric pressure high-altitude slight micro-barom oscillation
  pressureVal = Math.min(760, Math.max(440, pressureVal + jitter(0.2)));

  return {
    ...current,
    equipmentTemp: Number(eqTemp.toFixed(2)),
    batteryTemp: Number(batTemp.toFixed(2)),
    humidity: Number(humidityVal.toFixed(1)),
    pressure: Number(pressureVal.toFixed(1)),
    batteryVoltage: Number(voltageVal.toFixed(3)),
    batteryCurrent: Number(currentVal.toFixed(3)),
    heaterActive: isHeaterOn,
  };
}

/**
 * Generate historical seed data so charts look rich and continuous right upon launch
 */
export function generateSeedHistory(
  count: number,
  initial: SimulationState
): Array<{
  timestamp: string;
  displayTime: string;
  equipmentTemp: number;
  batteryTemp: number;
  humidity: number;
  pressure: number;
  batteryVoltage: number;
  batteryCurrent: number;
  heaterState: 'ON' | 'OFF';
}> {
  const history = [];
  const now = Date.now();
  const stepMs = 2000;

  let temp = initial.equipmentTemp - 2.5;
  let batTemp = initial.batteryTemp - 2.0;
  let hum = initial.humidity;
  let press = initial.pressure;
  let volt = initial.batteryVoltage + 0.08;
  let curr = initial.batteryCurrent;
  let heater: 'ON' | 'OFF' = 'OFF';

  for (let i = count; i >= 0; i--) {
    const timePoint = new Date(now - i * stepMs);
    const timeStr = timePoint.toTimeString().split(' ')[0];

    // Simulate heater kicking in if temp was below -18°C
    if (temp < -18.5) {
      heater = 'ON';
    } else if (temp > -12) {
      heater = 'OFF';
    }

    if (heater === 'ON') {
      temp += 0.35 + (Math.random() - 0.5) * 0.1;
      batTemp += 0.18 + (Math.random() - 0.5) * 0.05;
      curr = 1.62 + (Math.random() - 0.5) * 0.08;
    } else {
      temp -= 0.18 + (Math.random() - 0.5) * 0.1;
      batTemp -= 0.1 + (Math.random() - 0.5) * 0.05;
      curr = 0.4 + (Math.random() - 0.5) * 0.05;
    }

    hum = Math.min(85, Math.max(15, hum + (Math.random() - 0.5) * 0.4));
    press = Math.min(650, Math.max(520, press + (Math.random() - 0.5) * 0.3));
    volt = Math.max(3.2, volt - 0.0003 + (Math.random() - 0.5) * 0.002);

    history.push({
      timestamp: timePoint.toISOString(),
      displayTime: timeStr,
      equipmentTemp: Number(temp.toFixed(2)),
      batteryTemp: Number(batTemp.toFixed(2)),
      humidity: Number(hum.toFixed(1)),
      pressure: Number(press.toFixed(1)),
      batteryVoltage: Number(volt.toFixed(3)),
      batteryCurrent: Number(curr.toFixed(3)),
      heaterState: heater,
    });
  }

  return history;
}

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  equipmentTemp: number;
  batteryTemp: number;
  humidity: number;
  pressure: number;
  batteryVoltage: number;
  batteryCurrent: number;
  ambientColdTemp: number;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'subzero_blizzard',
    name: 'Ladakh Blizzard (-26°C)',
    badge: 'TRIGGERS AUTO HEATER',
    description: 'Extreme freezing night in Khardung-La. Temperature falls below -20°C triggering auto thermal protection.',
    equipmentTemp: -24.8,
    batteryTemp: -18.5,
    humidity: 78.0,
    pressure: 545.0,
    batteryVoltage: 3.52,
    batteryCurrent: 0.45,
    ambientColdTemp: -29.0,
  },
  {
    id: 'nominal_telemetry',
    name: 'Nominal High Altitude (-14°C)',
    badge: 'NORMAL STABLE',
    description: 'Standard clear day telemetry at 4,500m AMSL. Systems within safe thresholds.',
    equipmentTemp: -12.4,
    batteryTemp: -9.8,
    humidity: 28.5,
    pressure: 582.0,
    batteryVoltage: 3.82,
    batteryCurrent: 0.38,
    ambientColdTemp: -18.0,
  },
  {
    id: 'low_voltage_lvd',
    name: 'Low Battery Voltage (3.18V)',
    badge: 'CRITICAL LVD',
    description: 'Sub-zero electrolyte impedance causes cell voltage drop below 3.3V safe cutoff.',
    equipmentTemp: -18.2,
    batteryTemp: -14.6,
    humidity: 34.0,
    pressure: 575.0,
    batteryVoltage: 3.18,
    batteryCurrent: 0.52,
    ambientColdTemp: -22.0,
  },
  {
    id: 'overcurrent_spike',
    name: 'Excessive Current Draw (2.65A)',
    badge: 'OVERCURRENT TRIP',
    description: 'PTC element surge or electrical fault causing current to exceed 2.0A threshold limit.',
    equipmentTemp: -10.5,
    batteryTemp: -6.2,
    humidity: 31.0,
    pressure: 578.0,
    batteryVoltage: 3.48,
    batteryCurrent: 2.65,
    ambientColdTemp: -16.0,
  },
  {
    id: 'high_humidity_condensation',
    name: 'Dense Cloud / Icing (89% RH)',
    badge: 'CONDENSATION RISK',
    description: 'Rapid cloud bank engulfs mast causing high humidity and dew/frost precipitation risks.',
    equipmentTemp: -3.5,
    batteryTemp: -1.2,
    humidity: 89.2,
    pressure: 560.0,
    batteryVoltage: 3.76,
    batteryCurrent: 0.44,
    ambientColdTemp: -6.0,
  },
  {
    id: 'high_pass_altitude',
    name: 'Khardung La Pass (5,359m / 512 hPa)',
    badge: 'HYPOBARIC AIR',
    description: 'Extremely thin air test. Atmospheric pressure drops to 512 hPa, reducing thermal convection.',
    equipmentTemp: -19.4,
    batteryTemp: -15.1,
    humidity: 22.0,
    pressure: 512.4,
    batteryVoltage: 3.65,
    batteryCurrent: 0.41,
    ambientColdTemp: -24.0,
  },
];
