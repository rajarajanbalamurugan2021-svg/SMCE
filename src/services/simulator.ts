import { SensorReading, ThresholdSettings } from '../types/smce';

export interface SimulationState {
  enabled: boolean;
  intervalMs: number;
  equipmentTemp: number; // -35°C to +40°C
  batteryTemp: number; // -30°C to +45°C
  humidity: number; // 10% to 95%
  pressure: number; // 450 to 750 hPa (60-70 kPa nominal)
  batteryVoltage: number; // 10.5V - 12.6V (or 3.2V - 4.2V)
  batteryCurrent: number; // 0.2A - 3.0A
  ambientColdTemp: number; // Target Ladakh ambient temperature (-35°C to +15°C)
  heaterActive: boolean;
  heaterPwm: number; // 0 to 100%
  manualOverrideActive: boolean;
  // Fault Injection & Simulation flags
  simulatedHeaterFault: boolean;
  simulatedSensorFault: boolean;
  simulatedFanFault: boolean;
  rapidCoolingActive: boolean;
  rapidHeatingActive: boolean;
  activeScenarioId?: string;
}

export const INITIAL_SIM_STATE: SimulationState = {
  enabled: true,
  intervalMs: 1500,
  equipmentTemp: -16.4,
  batteryTemp: -13.2,
  humidity: 32.5,
  pressure: 642.0, // ~64.2 kPa (Ladakh 4,500m AMSL)
  batteryVoltage: 11.85, // Nominal 3S pack (11.85V)
  batteryCurrent: 0.42,
  ambientColdTemp: -24.0,
  heaterActive: false,
  heaterPwm: 0,
  manualOverrideActive: false,
  simulatedHeaterFault: false,
  simulatedSensorFault: false,
  simulatedFanFault: false,
  rapidCoolingActive: false,
  rapidHeatingActive: false,
  activeScenarioId: 'NORMAL',
};

/**
 * Step simulation physics one tick forward
 */
export function stepSimulation(
  current: SimulationState,
  isHeaterOn: boolean,
  _settings: ThresholdSettings,
  heaterPwm: number = 0
): SimulationState {
  if (!current.enabled) {
    return current;
  }

  const jitter = (amount: number) => (Math.random() - 0.5) * 2 * amount;

  let eqTemp = current.equipmentTemp;
  let batTemp = current.batteryTemp;
  let currentVal = current.batteryCurrent;
  let voltageVal = current.batteryVoltage;
  let humidityVal = current.humidity;
  let pressureVal = current.pressure;

  const effectivePwm = Math.max(0, Math.min(100, heaterPwm > 0 ? heaterPwm : isHeaterOn ? 100 : 0));
  const isHeatingEffective = effectivePwm > 0 && !current.simulatedHeaterFault;

  // Thin air pressure convection factor (lower pressure reduces heat exchange)
  const pressureFactor = Math.max(0.65, Math.min(1.15, pressureVal / 650));

  if (current.simulatedSensorFault) {
    // Sensor failure: output error value or frozen out-of-range
    eqTemp = -999.0;
  } else if (isHeatingEffective) {
    // Proportional heating curve based on PWM duty cycle
    const pwmRatio = effectivePwm / 100;
    const heatingLift = (0.55 * pwmRatio + jitter(0.06)) * pressureFactor;
    eqTemp += heatingLift;
    batTemp += heatingLift * 0.45;

    // Current draw jumps with PWM load: 24W heating array at 12V = ~2.0A max
    const maxHeatingAmps = voltageVal > 6 ? 2.0 : 1.6;
    const targetCurrent = 0.35 + maxHeatingAmps * pwmRatio + jitter(0.05);
    currentVal = currentVal * 0.6 + targetCurrent * 0.4;

    // Slight voltage sag under heating load
    voltageVal = Math.max(9.8, voltageVal - 0.002 * pwmRatio + jitter(0.001));
  } else {
    // Ambient heat loss towards Ladakh sub-zero ambient
    let coolingRate = current.rapidCoolingActive ? 0.09 : 0.04;
    const delta = current.ambientColdTemp - eqTemp;
    eqTemp += delta * coolingRate + jitter(0.06);

    const batDelta = current.ambientColdTemp - batTemp;
    batTemp += batDelta * (coolingRate * 0.6) + jitter(0.04);

    // If heater is commanded ON but simulated heater fault is active
    if (effectivePwm > 0 && current.simulatedHeaterFault) {
      // Current still drawn or open circuit fault, but zero thermal gain
      currentVal = currentVal * 0.7 + (0.35 + 1.8 * (effectivePwm / 100)) * 0.3;
    } else {
      // Nominal idle current (sensors, radio, microcontrollers)
      const targetCurrent = 0.38 + jitter(0.03);
      currentVal = currentVal * 0.8 + targetCurrent * 0.2;
    }

    // Slow discharge
    voltageVal = Math.max(9.8, voltageVal - 0.0003 + jitter(0.001));
  }

  // Rapid heating scenario (e.g. solar insolation + internal workload)
  if (current.rapidHeatingActive) {
    eqTemp += 0.8 + jitter(0.1);
    batTemp += 0.4 + jitter(0.08);
  }

  // Relative humidity oscillation (12% to 92%)
  humidityVal = Math.min(94, Math.max(14, humidityVal + jitter(0.25)));

  // Barometric pressure oscillation around 60 - 70 kPa (600 - 700 hPa)
  pressureVal = Math.min(740, Math.max(480, pressureVal + jitter(0.2)));

  // Bounds clamping
  if (!current.simulatedSensorFault) {
    eqTemp = Math.min(45, Math.max(-38, eqTemp));
  }
  batTemp = Math.min(50, Math.max(-32, batTemp));

  return {
    ...current,
    equipmentTemp: Number(eqTemp.toFixed(2)),
    batteryTemp: Number(batTemp.toFixed(2)),
    humidity: Number(humidityVal.toFixed(1)),
    pressure: Number(pressureVal.toFixed(1)),
    batteryVoltage: Number(voltageVal.toFixed(2)),
    batteryCurrent: Number(currentVal.toFixed(2)),
    heaterActive: effectivePwm > 0,
    heaterPwm: effectivePwm,
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
  heaterPwm: number;
  predictedTemp: number;
}> {
  const history = [];
  const now = Date.now();
  const stepMs = 2000;

  let temp = initial.equipmentTemp - 2.5;
  let batTemp = initial.batteryTemp - 2.0;
  let hum = initial.humidity;
  let press = initial.pressure;
  let volt = initial.batteryVoltage + 0.15;
  let curr = initial.batteryCurrent;
  let heater: 'ON' | 'OFF' = 'OFF';
  let pwm = 0;

  for (let i = count; i >= 0; i--) {
    const timePoint = new Date(now - i * stepMs);
    const timeStr = timePoint.toTimeString().split(' ')[0];

    // Simulate adaptive heating kicking in
    if (temp < -17.5) {
      heater = 'ON';
      pwm = 55;
    } else if (temp > -12.5) {
      heater = 'OFF';
      pwm = 0;
    }

    if (heater === 'ON') {
      temp += 0.32 + (Math.random() - 0.5) * 0.08;
      batTemp += 0.16 + (Math.random() - 0.5) * 0.04;
      curr = 1.35 + (Math.random() - 0.5) * 0.06;
    } else {
      temp -= 0.16 + (Math.random() - 0.5) * 0.08;
      batTemp -= 0.09 + (Math.random() - 0.5) * 0.04;
      curr = 0.4 + (Math.random() - 0.5) * 0.04;
    }

    hum = Math.min(85, Math.max(15, hum + (Math.random() - 0.5) * 0.3));
    press = Math.min(680, Math.max(540, press + (Math.random() - 0.5) * 0.2));
    volt = Math.max(10.5, volt - 0.0003 + (Math.random() - 0.5) * 0.002);

    const predicted = Number((temp - 0.4).toFixed(1));

    history.push({
      timestamp: timePoint.toISOString(),
      displayTime: timeStr,
      equipmentTemp: Number(temp.toFixed(2)),
      batteryTemp: Number(batTemp.toFixed(2)),
      humidity: Number(hum.toFixed(1)),
      pressure: Number(press.toFixed(1)),
      batteryVoltage: Number(volt.toFixed(2)),
      batteryCurrent: Number(curr.toFixed(2)),
      heaterState: heater,
      heaterPwm: pwm,
      predictedTemp: predicted,
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
  // Specific injection tags
  simulatedHeaterFault?: boolean;
  simulatedSensorFault?: boolean;
  simulatedFanFault?: boolean;
  rapidCoolingActive?: boolean;
  rapidHeatingActive?: boolean;
  expectedBehavior: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'NORMAL',
    name: 'NORMAL (Nominal Base)',
    badge: 'SAFE • 94% HEALTH',
    description: 'Ladakh station on a clear day at 4,500m AMSL. Nominal pressure (64.5 kPa) and safe sub-zero limits.',
    equipmentTemp: -12.4,
    batteryTemp: -9.8,
    humidity: 28.5,
    pressure: 645.0,
    batteryVoltage: 12.15,
    batteryCurrent: 0.42,
    ambientColdTemp: -16.0,
    expectedBehavior: 'Standby monitoring; heater at 0% PWM; all sensors nominal.',
  },
  {
    id: 'EXTREME COLD',
    name: 'EXTREME COLD (-28°C)',
    badge: 'CRITICAL FREEZE',
    description: 'Severe winter night in Nyoma / Changthang. Ambient drops to -32°C. Triggers full adaptive PWM heating.',
    equipmentTemp: -26.8,
    batteryTemp: -21.4,
    humidity: 45.0,
    pressure: 615.0,
    batteryVoltage: 11.65,
    batteryCurrent: 0.48,
    ambientColdTemp: -34.0,
    expectedBehavior: 'MAHAPS ramps heater to 85–100% PWM to prevent core silicon freeze.',
  },
  {
    id: 'RAPID COOLING',
    name: 'RAPID COOLING (-18°C)',
    badge: 'PREDICTIVE TRIGGER',
    description: 'Sudden dusk temperature drop (-1.2°C/min). Triggers predictive heating BEFORE reaching freeze threshold.',
    equipmentTemp: -17.5,
    batteryTemp: -14.0,
    humidity: 52.0,
    pressure: 628.0,
    batteryVoltage: 11.95,
    batteryCurrent: 0.44,
    ambientColdTemp: -30.0,
    rapidCoolingActive: true,
    expectedBehavior: 'Predictive algorithm detects steep rate of drop and starts 55% PWM heating early.',
  },
  {
    id: 'LOW BATTERY',
    name: 'LOW BATTERY (10.65V)',
    badge: 'BATTERY-AWARE GUARD',
    description: 'Cold battery voltage sags to 10.65V. System balances thermal safety vs battery preservation.',
    equipmentTemp: -18.2,
    batteryTemp: -15.1,
    humidity: 36.0,
    pressure: 635.0,
    batteryVoltage: 10.65,
    batteryCurrent: 0.52,
    ambientColdTemp: -22.0,
    expectedBehavior: 'Low battery detected: PWM throttled to 25% to prevent complete battery brownout.',
  },
  {
    id: 'HEATER FAILURE',
    name: 'HEATER FAILURE (Fault)',
    badge: 'THERMAL FAULT TRIP',
    description: 'PTC element open-circuit or broken thermal bonding. Temperature fails to increase despite PWM drive.',
    equipmentTemp: -21.0,
    batteryTemp: -17.5,
    humidity: 42.0,
    pressure: 630.0,
    batteryVoltage: 11.75,
    batteryCurrent: 1.85,
    ambientColdTemp: -28.0,
    simulatedHeaterFault: true,
    expectedBehavior: 'Intelligent diagnostic triggers: THERMAL FAULT DETECTED (Heating Ineffective).',
  },
  {
    id: 'SENSOR FAILURE',
    name: 'SENSOR FAILURE (Probe Disconnected)',
    badge: 'SENSOR FAULT TRIP',
    description: 'DS18B20 1-Wire probe disconnection or ADC wire open circuit (-999°C reading).',
    equipmentTemp: -999.0,
    batteryTemp: -12.0,
    humidity: 34.0,
    pressure: 640.0,
    batteryVoltage: 11.9,
    batteryCurrent: 0.4,
    ambientColdTemp: -20.0,
    simulatedSensorFault: true,
    expectedBehavior: 'Instant alert: SENSOR DISCONNECTED. System engages safe failback thermal policy.',
  },
  {
    id: 'CONDENSATION RISK',
    name: 'CONDENSATION RISK (88% RH)',
    badge: 'DEW POINT HAZARD',
    description: 'Moist cloud engulfs enclosure near dew point (-4°C equipment temp vs -5.2°C dew point).',
    equipmentTemp: -4.2,
    batteryTemp: -2.0,
    humidity: 88.5,
    pressure: 610.0,
    batteryVoltage: 12.05,
    batteryCurrent: 0.43,
    ambientColdTemp: -8.0,
    expectedBehavior: 'Condensation risk flagged HIGH. Controlled pre-bake heating initiated to prevent ice/dew.',
  },
];
