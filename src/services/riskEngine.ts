import {
  SensorReading,
  ThresholdSettings,
  RiskAssessment,
  RiskCondition,
  ConditionStatus,
  SystemStatus,
  HeaterMode,
  ProtectionControlState,
  AlertItem,
  ThermalRiskLevel,
  TemperatureTrendDirection,
  ThermalControlMode,
  EnvironmentalRiskLevel,
  CondensationRiskLevel,
  ThermalLearningState,
  FaultItem,
} from '../types/smce';

/**
 * Calculates Dew Point using the Magnus-Tetens formula.
 * @param temp °C
 * @param humidity % RH
 * @returns Dew point in °C
 */
export function calculateDewPoint(temp: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const rhClamped = Math.max(1, Math.min(100, humidity));
  const alpha = (a * temp) / (b + temp) + Math.log(rhClamped / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Number(dewPoint.toFixed(1));
}

/**
 * Evaluates Condensation Risk based on Dew Point Margin (T_equipment - T_dew).
 */
export function evaluateCondensationRisk(
  equipmentTemp: number,
  dewPoint: number
): { risk: CondensationRiskLevel; margin: number; recommendation: string } {
  const margin = Number((equipmentTemp - dewPoint).toFixed(1));
  if (margin <= 2.0) {
    return {
      risk: 'HIGH',
      margin,
      recommendation:
        'CRITICAL CONDENSATION HAZARD: Enclosure temperature is at or near dew point. Activate controlled heating immediately to prevent frost/dew on PCB circuits.',
    };
  }
  if (margin <= 5.0) {
    return {
      risk: 'MEDIUM',
      margin,
      recommendation:
        'CONDENSATION CAUTION: Narrow dew point margin (< 5°C). Avoid sudden cooling; maintain low-level pre-heating.',
    };
  }
  return {
    risk: 'LOW',
    margin,
    recommendation: 'Safe dew point margin (> 5°C). Condensation hazard minimal.',
  };
}

/**
 * Evaluates Environmental Risk using BME280 telemetry (Temperature, Humidity, Pressure).
 */
export function evaluateEnvironmentalRisk(
  temperature: number,
  humidity: number,
  pressure: number,
  settings: ThresholdSettings
): {
  level: EnvironmentalRiskLevel;
  description: string;
} {
  const isHypobaric = pressure < settings.minPressure;
  const isExtremeCold = temperature < settings.minEquipmentTemp;
  const isHighHumidity = humidity > settings.maxHumidity;

  if (isExtremeCold || (isHypobaric && temperature < settings.heaterAutoThreshold)) {
    return {
      level: 'CRITICAL',
      description:
        'CRITICAL: Extreme sub-zero ambient combined with thin atmosphere impairs both thermal retention and electrical dielectric insulation.',
    };
  }

  if (temperature < settings.heaterAutoThreshold || isHighHumidity || pressure < 530) {
    return {
      level: 'HIGH RISK',
      description:
        'HIGH RISK: Sub-zero temperatures and high-altitude hypobaric stress detected. Rapid cooling front likely.',
    };
  }

  if (temperature < 0 || humidity > settings.maxHumidity - 15 || pressure < settings.minPressure + 40) {
    return {
      level: 'CAUTION',
      description:
        'CAUTION: Freezing conditions or elevated moisture approaching risk boundaries. Adaptive monitoring active.',
    };
  }

  return {
    level: 'SAFE',
    description: 'SAFE: Atmospheric pressure, humidity, and temperature parameters nominal for high altitude.',
  };
}

/**
 * Calculates temperature rate of change (°C/min) and trend direction from historical buffer.
 */
export function calculateTemperatureTrend(
  currentTemp: number,
  history: SensorReading[],
  windowPoints: number = 8
): {
  rateOfChange: number; // °C/min
  trend: TemperatureTrendDirection;
  predictedTemp: number; // 5-minute projection
} {
  if (!history || history.length < 2) {
    return {
      rateOfChange: 0,
      trend: 'STABLE',
      predictedTemp: currentTemp,
    };
  }

  const sample = history.slice(-windowPoints);
  const oldest = sample[0];
  const latest = sample[sample.length - 1];

  const tOld = new Date(oldest.timestamp).getTime();
  const tNew = new Date(latest.timestamp).getTime();
  const diffMinutes = Math.max(0.1, (tNew - tOld) / 60000);

  // Raw delta over time window
  const tempDelta = latest.equipmentTemp - oldest.equipmentTemp;
  const rateOfChange = Number((tempDelta / diffMinutes).toFixed(2));

  let trend: TemperatureTrendDirection = 'STABLE';
  if (rateOfChange < -0.25) {
    trend = 'FALLING';
  } else if (rateOfChange > +0.25) {
    trend = 'RISING';
  }

  // Linear projection 5 minutes ahead with physical damping
  const predictedTemp = Number((currentTemp + rateOfChange * 5.0).toFixed(1));

  return {
    rateOfChange,
    trend,
    predictedTemp,
  };
}

/**
 * Calculates System Health Score (0 - 100%) based on 6 core system pillars.
 */
export function calculateSystemHealthScore(
  reading: {
    equipmentTemp: number;
    batteryTemp: number;
    humidity: number;
    pressure: number;
    batteryVoltage: number;
    batteryCurrent: number;
  },
  settings: ThresholdSettings,
  faults: FaultItem[],
  dewPointMargin: number
): number {
  let score = 100;

  // 1. Temperature factor (Max penalty -30)
  if (reading.equipmentTemp < settings.minEquipmentTemp) {
    score -= 30;
  } else if (reading.equipmentTemp < settings.heaterAutoThreshold) {
    score -= 15;
  } else if (reading.equipmentTemp > settings.maxEquipmentTemp) {
    score -= 25;
  }

  // 2. Battery factor (Max penalty -30)
  if (reading.batteryVoltage < settings.minBatteryVoltage) {
    score -= 30;
  } else if (reading.batteryVoltage < settings.minBatteryVoltage + 0.15) {
    score -= 15;
  }

  if (reading.batteryCurrent > settings.maxCurrent) {
    score -= 20;
  } else if (reading.batteryCurrent > settings.maxCurrent * 0.85) {
    score -= 10;
  }

  // 3. Environmental pressure & humidity factor (Max penalty -20)
  if (reading.pressure < settings.minPressure) {
    score -= 15;
  }
  if (reading.humidity > settings.maxHumidity) {
    score -= 15;
  }

  // 4. Condensation hazard penalty
  if (dewPointMargin <= 2.0) {
    score -= 15;
  } else if (dewPointMargin <= 5.0) {
    score -= 5;
  }

  // 5. Active faults penalty (Max penalty -35)
  const activeCriticalFaults = faults.filter((f) => !f.cleared && f.severity === 'CRITICAL').length;
  const activeWarningFaults = faults.filter((f) => !f.cleared && f.severity === 'WARNING').length;
  score -= activeCriticalFaults * 20;
  score -= activeWarningFaults * 8;

  return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Evaluates all sensor parameters against configured thresholds
 * to detect environmental & equipment risks.
 */
export function evaluateRisks(
  reading: Omit<SensorReading, 'systemStatus' | 'heaterState'>,
  settings: ThresholdSettings,
  currentHeaterState: 'ON' | 'OFF',
  history: SensorReading[] = [],
  activeFaults: FaultItem[] = []
): RiskAssessment {
  const conditions: RiskCondition[] = [];

  // 1. Extremely Low Temperature Analysis
  let lowTempStatus: ConditionStatus = 'NORMAL';
  let lowTempDesc = 'Equipment temperature is within safe operational thermal envelope.';
  let lowTempRec = 'Nominal thermal parameters. No intervention needed.';
  if (reading.equipmentTemp < settings.minEquipmentTemp) {
    lowTempStatus = 'CRITICAL';
    lowTempDesc = `Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) breached critical freeze limit (< ${settings.minEquipmentTemp}°C). Severe risk of silicon embrittlement and crystal oscillator drift.`;
    lowTempRec = 'Auto-heating protection mandatory. Check thermal insulation seals.';
  } else if (reading.equipmentTemp < settings.heaterAutoThreshold) {
    lowTempStatus = 'WARNING';
    lowTempDesc = `Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) is approaching sub-zero threshold (< ${settings.heaterAutoThreshold}°C).`;
    lowTempRec = 'Prepare auxiliary heating loop. Monitor thermal rate of decline.';
  }
  conditions.push({
    id: 'risk_low_temp',
    name: 'Extremely Low Temperature',
    status: lowTempStatus,
    currentValue: reading.equipmentTemp,
    unit: '°C',
    thresholdLabel: `< ${settings.minEquipmentTemp}°C (Crit) / < ${settings.heaterAutoThreshold}°C (Auto)`,
    description: lowTempDesc,
    recommendation: lowTempRec,
  });

  // 2. High Temperature Analysis
  let highTempStatus: ConditionStatus = 'NORMAL';
  let highTempDesc = 'Thermal dissipation nominal. Thin atmosphere convective cooling sufficient.';
  let highTempRec = 'Normal operation.';
  if (reading.equipmentTemp > settings.maxEquipmentTemp) {
    highTempStatus = 'CRITICAL';
    highTempDesc = `Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) exceeds upper limit (> ${settings.maxEquipmentTemp}°C). Thin high-altitude air reduces convective cooling efficiency by ~40%!`;
    highTempRec = 'Reduce computation load or throttle power stages immediately.';
  } else if (reading.equipmentTemp > settings.maxEquipmentTemp - 5) {
    highTempStatus = 'WARNING';
    highTempDesc = `Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) elevated, approaching safety ceiling.`;
    highTempRec = 'Monitor processor thermal sensors and radiator heat pipes.';
  }
  conditions.push({
    id: 'risk_high_temp',
    name: 'High Temperature',
    status: highTempStatus,
    currentValue: reading.equipmentTemp,
    unit: '°C',
    thresholdLabel: `> ${settings.maxEquipmentTemp}°C`,
    description: highTempDesc,
    recommendation: highTempRec,
  });

  // 3. High Humidity & Dew Point Analysis
  let humidityStatus: ConditionStatus = 'NORMAL';
  let humidityDesc = 'Relative humidity within safe dry-pack envelope. Low dew-point.';
  let humidityRec = 'Desiccant status normal.';
  if (reading.humidity > settings.maxHumidity) {
    humidityStatus = 'CRITICAL';
    humidityDesc = `Relative humidity (${reading.humidity.toFixed(1)}%) exceeds safety threshold (> ${settings.maxHumidity}%). Extreme condensation/icing risk on high-voltage traces.`;
    humidityRec = 'Enable internal purge or heater pre-bake to prevent internal ice sublimation.';
  } else if (reading.humidity > settings.maxHumidity - 10) {
    humidityStatus = 'WARNING';
    humidityDesc = `Humidity elevated (${reading.humidity.toFixed(1)}%). Impending condensation threshold during dusk/dawn temperature inversion.`;
    humidityRec = 'Ensure enclosure seal integrity and desiccator readiness.';
  }
  conditions.push({
    id: 'risk_high_humidity',
    name: 'High Humidity & Condensation',
    status: humidityStatus,
    currentValue: reading.humidity,
    unit: '%',
    thresholdLabel: `> ${settings.maxHumidity}% RH`,
    description: humidityDesc,
    recommendation: humidityRec,
  });

  // 4. Abnormal Atmospheric Pressure
  let pressureStatus: ConditionStatus = 'NORMAL';
  let pressureDesc = `Barometric reading (${reading.pressure.toFixed(1)} hPa) is consistent with Ladakh high altitude (~${settings.altitudeMeters}m AMSL).`;
  let pressureRec = 'Enclosure pressure relief valve nominal.';
  if (reading.pressure < settings.minPressure) {
    pressureStatus = 'CRITICAL';
    pressureDesc = `Atmospheric pressure (${reading.pressure.toFixed(1)} hPa) dangerously low (< ${settings.minPressure} hPa). Ultra-thin atmosphere impairs dielectric breakdown voltage and thermal conduction.`;
    pressureRec = 'Verify enclosure hermeticity. Avoid high-voltage arcing operations.';
  } else if (reading.pressure > settings.maxPressure) {
    pressureStatus = 'WARNING';
    pressureDesc = `Barometric pressure (${reading.pressure.toFixed(1)} hPa) unusually high for high-altitude station (> ${settings.maxPressure} hPa). Rapid weather front or enclosure over-pressurization.`;
    pressureRec = 'Check barometric sensor calibration and vent valves.';
  }
  conditions.push({
    id: 'risk_pressure',
    name: 'Abnormal Pressure (Hypobaric)',
    status: pressureStatus,
    currentValue: reading.pressure,
    unit: 'hPa',
    thresholdLabel: `${settings.minPressure} – ${settings.maxPressure} hPa`,
    description: pressureDesc,
    recommendation: pressureRec,
  });

  // 5. Low Battery Voltage
  let voltageStatus: ConditionStatus = 'NORMAL';
  let voltageDesc = `Battery voltage (${reading.batteryVoltage.toFixed(2)} V) nominal. Adequate reserve capacity.`;
  let voltageRec = 'Charge state healthy.';
  if (reading.batteryVoltage < settings.minBatteryVoltage) {
    voltageStatus = 'CRITICAL';
    voltageDesc = `Battery terminal voltage (${reading.batteryVoltage.toFixed(2)} V) critically below threshold (< ${settings.minBatteryVoltage} V). Severe electrolyte degradation and brownout risk under freezing temperatures!`;
    voltageRec = 'Trigger Low Voltage Disconnect (LVD) and curtail non-essential subsystems.';
  } else if (reading.batteryVoltage < settings.minBatteryVoltage + 0.15) {
    voltageStatus = 'WARNING';
    voltageDesc = `Battery voltage (${reading.batteryVoltage.toFixed(2)} V) approaching minimum discharge knee (< ${(settings.minBatteryVoltage + 0.15).toFixed(2)} V).`;
    voltageRec = 'Verify solar MPPT charging input and minimize secondary payloads.';
  }
  conditions.push({
    id: 'risk_low_voltage',
    name: 'Low Battery Voltage',
    status: voltageStatus,
    currentValue: reading.batteryVoltage,
    unit: 'V',
    thresholdLabel: `< ${settings.minBatteryVoltage} V`,
    description: voltageDesc,
    recommendation: voltageRec,
  });

  // 6. Excessive Current
  let currentStatus: ConditionStatus = 'NORMAL';
  let currentDesc = `Current draw (${reading.batteryCurrent.toFixed(2)} A) is within safe operational limits.`;
  let currentRec = 'Power bus dissipation nominal.';
  if (reading.batteryCurrent > settings.maxCurrent) {
    currentStatus = 'CRITICAL';
    currentDesc = `Current draw (${reading.batteryCurrent.toFixed(2)} A) exceeds maximum safe rating (> ${settings.maxCurrent} A). Possible short circuit, PTC heater runaway, or motor stall.`;
    currentRec = 'Trip electronic circuit breaker. Inspect load bus for insulation breakdown.';
  } else if (reading.batteryCurrent > settings.maxCurrent * 0.85) {
    currentStatus = 'WARNING';
    currentDesc = `Current draw (${reading.batteryCurrent.toFixed(2)} A) nearing thermal circuit capacity (> ${(settings.maxCurrent * 0.85).toFixed(2)} A).`;
    currentRec = 'Audit active thermal heating elements and telemetry transmitter bursts.';
  }
  conditions.push({
    id: 'risk_excessive_current',
    name: 'Excessive Current',
    status: currentStatus,
    currentValue: reading.batteryCurrent,
    unit: 'A',
    thresholdLabel: `> ${settings.maxCurrent} A`,
    description: currentDesc,
    recommendation: currentRec,
  });

  const criticalCount = conditions.filter((c) => c.status === 'CRITICAL').length;
  const warningCount = conditions.filter((c) => c.status === 'WARNING').length;

  // Determine overall status
  let overallStatus: SystemStatus = 'NORMAL';
  if (criticalCount > 0) {
    overallStatus = 'CRITICAL';
  } else if (currentHeaterState === 'ON') {
    overallStatus = 'PROTECTION ACTIVE';
  } else if (warningCount > 0) {
    overallStatus = 'WARNING';
  }

  // Calculate Hazard Score (0 - 100)
  const hazardScore = Math.min(
    100,
    criticalCount * 35 + warningCount * 15 + (currentHeaterState === 'ON' ? 10 : 0)
  );

  // MAHAPS Dew Point and Condensation
  const dewPoint = calculateDewPoint(reading.equipmentTemp, reading.humidity);
  const condensationAssessment = evaluateCondensationRisk(reading.equipmentTemp, dewPoint);

  // Environmental Risk
  const envRisk = evaluateEnvironmentalRisk(
    reading.equipmentTemp,
    reading.humidity,
    reading.pressure,
    settings
  );

  // Thermal Risk Level
  let thermalRisk: ThermalRiskLevel = 'SAFE';
  if (reading.equipmentTemp < settings.minEquipmentTemp) {
    thermalRisk = 'CRITICAL';
  } else if (reading.equipmentTemp < settings.heaterAutoThreshold) {
    thermalRisk = 'HIGH';
  } else if (reading.equipmentTemp < settings.heaterAutoThreshold + 3) {
    thermalRisk = 'CAUTION';
  }

  // Calculate composite System Health Score
  const systemHealthScore = calculateSystemHealthScore(
    reading,
    settings,
    activeFaults,
    condensationAssessment.margin
  );

  return {
    overallStatus,
    conditions,
    activeCriticalCount: criticalCount,
    activeWarningCount: warningCount,
    hazardScore,
    systemHealthScore,
    environmentalRisk: envRisk.level,
    condensationRisk: condensationAssessment.risk,
    dewPoint,
    dewPointMargin: condensationAssessment.margin,
    thermalRisk,
  };
}

/**
 * Evaluates adaptive/predictive protection logic for MAHAPS.
 * Implements software-based PWM, trend-based pre-heating,
 * self-learning feedback, and intelligent thermal fault detection.
 */
export function evaluateProtectionLogic(
  reading: Omit<SensorReading, 'systemStatus' | 'heaterState'>,
  settings: ThresholdSettings,
  currentProtection: ProtectionControlState,
  history: SensorReading[] = [],
  faultState: {
    simulatedHeaterFault?: boolean;
    simulatedSensorFault?: boolean;
    simulatedFanFault?: boolean;
  } = {}
): {
  newHeaterState: 'ON' | 'OFF';
  protectionState: ProtectionControlState;
  newAlerts: AlertItem[];
  detectedFaults: FaultItem[];
} {
  const newAlerts: AlertItem[] = [];
  const detectedFaults: FaultItem[] = [...currentProtection.activeFaults];
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const isoStr = now.toISOString();

  // 1. Calculate Temperature Trend & Rate of Change
  const { rateOfChange, trend, predictedTemp } = calculateTemperatureTrend(
    reading.equipmentTemp,
    history,
    8
  );

  // 2. Dew Point & Condensation
  const dewPoint = calculateDewPoint(reading.equipmentTemp, reading.humidity);
  const condensation = evaluateCondensationRisk(reading.equipmentTemp, dewPoint);

  // 3. Environmental Risk
  const envAssessment = evaluateEnvironmentalRisk(
    reading.equipmentTemp,
    reading.humidity,
    reading.pressure,
    settings
  );

  // 4. Determine Thermal Risk Level
  let thermalRisk: ThermalRiskLevel = 'SAFE';
  // Predictive check: If temperature is falling rapidly, escalate risk before hitting threshold!
  if (
    reading.equipmentTemp < settings.minEquipmentTemp ||
    predictedTemp < settings.minEquipmentTemp
  ) {
    thermalRisk = 'CRITICAL';
  } else if (
    reading.equipmentTemp < settings.heaterAutoThreshold ||
    (predictedTemp < settings.heaterAutoThreshold && rateOfChange < -0.3)
  ) {
    thermalRisk = 'HIGH';
  } else if (
    reading.equipmentTemp < settings.heaterAutoThreshold + 3.0 ||
    predictedTemp < settings.heaterAutoThreshold + 1.5 ||
    condensation.risk === 'HIGH'
  ) {
    thermalRisk = 'CAUTION';
  } else {
    thermalRisk = 'SAFE';
  }

  // 5. Battery Awareness (Battery SOC & Low-Voltage Throttling)
  // Assuming 1S nominal (3.0 - 4.2V) or 3S (9.0 - 12.6V)
  const is3S = reading.batteryVoltage > 6.0;
  const minV = is3S ? 10.5 : settings.minBatteryVoltage;
  const maxV = is3S ? 12.6 : settings.maxBatteryVoltage;
  const batterySoc = Math.max(0, Math.min(100, Math.round(((reading.batteryVoltage - minV) / (maxV - minV)) * 100)));
  const isBatteryLow = reading.batteryVoltage < minV + (is3S ? 0.6 : 0.2);
  const isBatteryCritical = reading.batteryVoltage < minV;

  // 6. Adaptive PWM & Control Mode Calculation
  let targetPwm = 0;
  let controlMode: ThermalControlMode = 'STANDBY';
  let nextHeaterStatus: 'ON' | 'OFF' = 'OFF';
  let triggerReason = currentProtection.lastTriggerReason;
  let tempProtection: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';
  let batteryProtection: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';

  if (currentProtection.heaterMode === 'ON') {
    controlMode = 'MANUAL';
    nextHeaterStatus = 'ON';
    targetPwm = currentProtection.heaterPwm > 0 ? currentProtection.heaterPwm : 100;
    triggerReason = `Manual Override: Heater engaged at ${targetPwm}% PWM`;
    tempProtection = 'ACTIVE';
  } else if (currentProtection.heaterMode === 'OFF') {
    controlMode = 'MANUAL';
    nextHeaterStatus = 'OFF';
    targetPwm = 0;
    triggerReason = 'Manual Override: Heater forced OFF (0% PWM)';
    tempProtection = 'INACTIVE';
  } else {
    // Mode is AUTO (Autonomous Predictive & Adaptive Control)
    if (thermalRisk === 'CRITICAL') {
      controlMode = 'PREDICTIVE';
      targetPwm = 90;
      nextHeaterStatus = 'ON';
      tempProtection = 'ACTIVE';
      triggerReason = `Critical Thermal Risk: Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) or predicted (${predictedTemp}°C) breached safety limits. Max PWM heating active.`;
    } else if (thermalRisk === 'HIGH') {
      controlMode = 'PREDICTIVE';
      targetPwm = 65;
      nextHeaterStatus = 'ON';
      tempProtection = 'ACTIVE';
      triggerReason = `High Thermal Risk: Rapid cooling trend (${rateOfChange}°C/min). Predictive heating engaged at ${targetPwm}% PWM before freeze limit.`;
    } else if (thermalRisk === 'CAUTION') {
      // Moderate risk: 25-40% PWM
      controlMode = 'ADAPTIVE';
      targetPwm = 35;
      nextHeaterStatus = 'ON';
      tempProtection = 'ACTIVE';
      triggerReason = `Moderate Thermal Risk: Sub-zero approach or condensation risk. Adaptive pre-heating modulated at ${targetPwm}% PWM.`;
    } else {
      // Thermal risk is SAFE
      // Check hysteresis before fully shutting off
      if (
        currentProtection.heaterStatus === 'ON' &&
        reading.equipmentTemp < settings.heaterAutoThreshold + settings.heaterHysteresis
      ) {
        controlMode = 'ADAPTIVE';
        targetPwm = 20; // gentle tail-off
        nextHeaterStatus = 'ON';
        tempProtection = 'ACTIVE';
        triggerReason = `Thermal Recovery Band: Safe range reached. Tapering PWM to ${targetPwm}% to prevent thermal overshoot.`;
      } else {
        controlMode = 'STANDBY';
        targetPwm = 0;
        nextHeaterStatus = 'OFF';
        tempProtection = 'INACTIVE';
        triggerReason = 'Autonomous loop standby: Thermal envelope nominal, heater 0% PWM.';
      }
    }

    // Apply Self-Learning Adaptive Factor if enabled
    if (targetPwm > 0 && currentProtection.learning) {
      targetPwm = Math.min(100, Math.round(targetPwm * currentProtection.learning.adaptiveFactor));
    }

    // Battery-Aware Thermal Control: Throttle PWM if battery is low!
    if (isBatteryCritical) {
      targetPwm = 0;
      nextHeaterStatus = 'OFF';
      controlMode = 'BATTERY GUARD';
      batteryProtection = 'ACTIVE';
      triggerReason = `BATTERY GUARD CUTOFF: Voltage (${reading.batteryVoltage.toFixed(2)}V) below critical threshold. Heater forced OFF to prevent cell damage!`;
    } else if (isBatteryLow && targetPwm > 30) {
      targetPwm = 25; // Throttle to safe clamp
      controlMode = 'BATTERY GUARD';
      batteryProtection = 'ACTIVE';
      triggerReason = `BATTERY-AWARE POWER REDUCTION: Low voltage detected (${reading.batteryVoltage.toFixed(2)}V). Heater PWM throttled to ${targetPwm}% to conserve power.`;
    }
  }

  // Calculate actual dissipated wattage based on PWM
  const maxElementWatts = 24.5;
  const actualWatts = Number(((targetPwm / 100) * maxElementWatts).toFixed(1));

  // 7. Update Self-Learning Adaptive Thermal Model
  const learningState: ThermalLearningState = { ...currentProtection.learning };
  if (nextHeaterStatus === 'ON' && targetPwm >= 20) {
    learningState.samplesCount = (learningState.samplesCount || 0) + 1;
    learningState.lastLearnedRate = rateOfChange;
    // Positive heating response observed
    if (rateOfChange > 0) {
      // Expected rate for given PWM in thin atmosphere is ~0.45 * (PWM/100) °C/min
      const expectedRate = Math.max(0.1, 0.45 * (targetPwm / 100));
      const observedEfficiency = Math.min(100, Math.max(50, Math.round((rateOfChange / expectedRate) * 85)));
      learningState.heatingEfficiency = Math.round(learningState.heatingEfficiency * 0.9 + observedEfficiency * 0.1);
      learningState.lastHeatingResponseSec = Math.max(8, Math.min(45, Math.round(60 / (rateOfChange + 0.1))));
      // Self-adjust adaptive factor: if efficiency is low, increase factor slightly (up to 1.35x)
      learningState.adaptiveFactor = Number(
        (1.0 + (100 - learningState.heatingEfficiency) * 0.003).toFixed(2)
      );
    }
  }

  // 8. Intelligent Fault & Failure Detection
  // Fault 1: Thermal Failure Detected (Heater ON + High PWM, but temp fails to rise or keeps falling)
  const isThermalFailure =
    faultState.simulatedHeaterFault ||
    (nextHeaterStatus === 'ON' &&
      targetPwm >= 40 &&
      rateOfChange < -0.2 &&
      reading.equipmentTemp < settings.heaterAutoThreshold);

  if (isThermalFailure) {
    const existing = detectedFaults.find((f) => f.code === 'FAULT_HEATER_INEFFECTIVE');
    if (!existing) {
      const fault: FaultItem = {
        id: `fault-heat-${Date.now()}`,
        code: 'FAULT_HEATER_INEFFECTIVE',
        timestamp: isoStr,
        displayTime: timeStr,
        category: 'THERMAL',
        severity: 'CRITICAL',
        title: 'THERMAL FAULT DETECTED: Heating Ineffective',
        description: `Heater is active at ${targetPwm}% PWM, but equipment temperature continues to drop (${rateOfChange}°C/min).`,
        possibleCauses: [
          'PTC Ceramic heating element hardware failure or open circuit',
          'Poor thermal contact / degraded thermal interface paste',
          'Excessive enclosure heat loss (seal compromised or blizzard breach)',
          'Core temperature sensor calibration drift',
        ],
        recommendedAction:
          'Inspect heater wiring bus, check thermal bonding surface, and verify enclosure seals.',
        cleared: false,
      };
      detectedFaults.unshift(fault);
      newAlerts.push({
        id: `alert-fault-${Date.now()}`,
        timestamp: isoStr,
        displayTime: timeStr,
        type: 'CRITICAL',
        sensor: 'PTC Heater Array',
        value: `${targetPwm}% PWM`,
        status: 'CRITICAL FAULT',
        message: 'THERMAL FAULT DETECTED: Heating element ineffective. Temperature declining under load.',
        acknowledged: false,
      });
    }
  }

  // Fault 2: Sensor Disconnected / Frozen Reading
  const isSensorFault =
    faultState.simulatedSensorFault ||
    reading.equipmentTemp <= -55 ||
    reading.equipmentTemp >= 85 ||
    isNaN(reading.equipmentTemp);

  if (isSensorFault) {
    const existing = detectedFaults.find((f) => f.code === 'FAULT_SENSOR_DISCONNECTED');
    if (!existing) {
      const fault: FaultItem = {
        id: `fault-sensor-${Date.now()}`,
        code: 'FAULT_SENSOR_DISCONNECTED',
        timestamp: isoStr,
        displayTime: timeStr,
        category: 'SENSOR',
        severity: 'CRITICAL',
        title: 'SENSOR FAULT: Disconnected or Out of Bounds',
        description: `Primary temperature sensor reading is invalid or out of operational range (${reading.equipmentTemp}°C).`,
        possibleCauses: [
          'DS18B20 1-Wire bus communication glitch or disconnected probe',
          'PT100 RTD amplifier saturation / open lead',
          'ADC channel failure on ESP32 board',
        ],
        recommendedAction: 'Verify physical 1-Wire pullup resistor and check probe connector pinout.',
        cleared: false,
      };
      detectedFaults.unshift(fault);
      newAlerts.push({
        id: `alert-sens-${Date.now()}`,
        timestamp: isoStr,
        displayTime: timeStr,
        type: 'CRITICAL',
        sensor: 'DS18B20 Probe',
        value: 'DISCONNECTED',
        status: 'FAULT',
        message: 'SENSOR DISCONNECTED: Critical temperature sensor probe offline.',
        acknowledged: false,
      });
    }
  }

  // Fault 3: Abnormal Battery Voltage / Low Battery Warning
  if (reading.batteryVoltage < settings.minBatteryVoltage) {
    const existing = detectedFaults.find((f) => f.code === 'FAULT_BATTERY_UNDERVOLT');
    if (!existing) {
      detectedFaults.unshift({
        id: `fault-bat-${Date.now()}`,
        code: 'FAULT_BATTERY_UNDERVOLT',
        timestamp: isoStr,
        displayTime: timeStr,
        category: 'BATTERY',
        severity: 'CRITICAL',
        title: 'LOW BATTERY WARNING: Undervoltage Knee Reached',
        description: `Battery terminal voltage (${reading.batteryVoltage.toFixed(2)}V) is critically low (< ${settings.minBatteryVoltage}V).`,
        possibleCauses: [
          'Battery cold electrolyte capacity contraction',
          'Exhausted Li-ion pack charge',
          'Solar charge controller lack of irradiance',
        ],
        recommendedAction: 'Engage Low-Voltage Disconnect (LVD), throttle heater, charge battery pack.',
        cleared: false,
      });
    }
  }

  // Fault 4: Cooling Fan Failure (if temp high and fan not cooling)
  if (faultState.simulatedFanFault || (reading.equipmentTemp > settings.maxEquipmentTemp && rateOfChange > 0.3)) {
    const existing = detectedFaults.find((f) => f.code === 'FAULT_FAN_FAILURE');
    if (!existing) {
      detectedFaults.unshift({
        id: `fault-fan-${Date.now()}`,
        code: 'FAULT_FAN_FAILURE',
        timestamp: isoStr,
        displayTime: timeStr,
        category: 'FAN',
        severity: 'WARNING',
        title: 'COOLING FAN FAULT: Airflow Ineffective',
        description: 'Enclosure temperature elevated but cooling convection response is stalled.',
        possibleCauses: ['Fan intake iced over', 'Motor bearing freeze', 'PWM driver stall'],
        recommendedAction: 'Inspect external exhaust louvers and verify fan RPM tachometer feedback.',
        cleared: false,
      });
    }
  }

  // State transitions alert push
  if (currentProtection.heaterStatus === 'OFF' && nextHeaterStatus === 'ON') {
    newAlerts.push({
      id: `alert-${Date.now()}-heat-on`,
      timestamp: isoStr,
      displayTime: timeStr,
      type: 'PROTECTION',
      sensor: 'PTC Heater Array',
      value: `${targetPwm}% PWM (${actualWatts}W)`,
      status: 'PROTECTION ACTIVE',
      message: `Adaptive heater engaged at ${targetPwm}% PWM. Mode: ${controlMode}.`,
      acknowledged: false,
    });
  }

  // System Health Score
  const systemHealthScore = calculateSystemHealthScore(
    reading,
    settings,
    detectedFaults,
    condensation.margin
  );

  return {
    newHeaterState: nextHeaterStatus,
    protectionState: {
      ...currentProtection,
      heaterStatus: nextHeaterStatus,
      heaterPwm: targetPwm,
      heaterPowerWatts: actualWatts,
      tempProtection,
      batteryProtection,
      systemProtection: tempProtection === 'ACTIVE' || batteryProtection === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      lastTriggerReason: triggerReason,
      predictedTemp,
      tempRateOfChange: rateOfChange,
      tempTrend: trend,
      thermalRisk,
      thermalControlMode: controlMode,
      learning: learningState,
      fanStatus: reading.equipmentTemp > settings.maxEquipmentTemp - 2 ? 'ON' : 'OFF',
      fanPwm: reading.equipmentTemp > settings.maxEquipmentTemp ? 100 : 0,
      activeFaults: detectedFaults.slice(0, 15),
      systemHealthScore,
      condensationRisk: condensation.risk,
      environmentalRisk: envAssessment.level,
      dewPoint,
      dewPointMargin: condensation.margin,
      batterySoc,
    },
    newAlerts,
    detectedFaults,
  };
}
