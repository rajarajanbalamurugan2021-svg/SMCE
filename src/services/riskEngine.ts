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
} from '../types/smce';

/**
 * Evaluates all sensor parameters against configured thresholds
 * to detect environmental & equipment risks.
 */
export function evaluateRisks(
  reading: Omit<SensorReading, 'systemStatus' | 'heaterState'>,
  settings: ThresholdSettings,
  currentHeaterState: 'ON' | 'OFF'
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

  // 3. High Humidity Analysis
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
  const hazardScore = Math.min(100, criticalCount * 35 + warningCount * 15 + (currentHeaterState === 'ON' ? 10 : 0));

  return {
    overallStatus,
    conditions,
    activeCriticalCount: criticalCount,
    activeWarningCount: warningCount,
    hazardScore,
  };
}

/**
 * Evaluates automatic protection logic for the Heater and Subsystem Protections
 */
export function evaluateProtectionLogic(
  reading: Omit<SensorReading, 'systemStatus' | 'heaterState'>,
  settings: ThresholdSettings,
  currentProtection: ProtectionControlState
): {
  newHeaterState: 'ON' | 'OFF';
  protectionState: ProtectionControlState;
  newAlerts: AlertItem[];
} {
  const newAlerts: AlertItem[] = [];
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const isoStr = now.toISOString();

  let nextHeaterStatus: 'ON' | 'OFF' = currentProtection.heaterStatus;
  let lastReason = currentProtection.lastTriggerReason;
  let tempProtection: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';
  let batteryProtection: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';

  // 1. Temperature Protection Logic:
  // If temp falls below configured auto threshold -> turn heater ON in AUTO mode
  // If temp warms up above auto threshold + hysteresis -> turn heater OFF
  if (currentProtection.heaterMode === 'AUTO') {
    if (reading.equipmentTemp < settings.heaterAutoThreshold) {
      if (currentProtection.heaterStatus === 'OFF') {
        nextHeaterStatus = 'ON';
        lastReason = `Auto-Heating engaged: Equipment temp (${reading.equipmentTemp.toFixed(1)}°C) < auto threshold (${settings.heaterAutoThreshold}°C)`;
        newAlerts.push({
          id: `alert-${Date.now()}-heat-on`,
          timestamp: isoStr,
          displayTime: timeStr,
          type: 'PROTECTION',
          sensor: 'PT100 Equipment Temp',
          value: `${reading.equipmentTemp.toFixed(1)} °C`,
          status: 'PROTECTION ACTIVE',
          message: `Automatic thermal protection activated. PTC ceramic heating element initiated.`,
          acknowledged: false,
        });
      }
      tempProtection = 'ACTIVE';
    } else if (reading.equipmentTemp >= settings.heaterAutoThreshold + settings.heaterHysteresis) {
      if (currentProtection.heaterStatus === 'ON') {
        nextHeaterStatus = 'OFF';
        lastReason = `Auto-Heating standby: Equipment temp reached safe recovery point (${(settings.heaterAutoThreshold + settings.heaterHysteresis).toFixed(1)}°C)`;
        newAlerts.push({
          id: `alert-${Date.now()}-heat-off`,
          timestamp: isoStr,
          displayTime: timeStr,
          type: 'INFO',
          sensor: 'PT100 Equipment Temp',
          value: `${reading.equipmentTemp.toFixed(1)} °C`,
          status: 'NORMAL',
          message: `Temperature restored to safe operational range. Automatic heater deactivated.`,
          acknowledged: false,
        });
      }
      tempProtection = 'INACTIVE';
    } else {
      // Within hysteresis band: maintain current heater state
      if (currentProtection.heaterStatus === 'ON') {
        tempProtection = 'ACTIVE';
      }
    }
  } else if (currentProtection.heaterMode === 'ON') {
    nextHeaterStatus = 'ON';
    tempProtection = 'ACTIVE';
    lastReason = 'Manual Override: Heater continuously ON';
  } else {
    // Mode is OFF
    nextHeaterStatus = 'OFF';
    tempProtection = 'INACTIVE';
    lastReason = 'Manual Override: Heater forced OFF';
  }

  // 2. Battery Protection Logic:
  // If battery temp is below minBatteryTemp OR voltage is below minBatteryVoltage
  if (
    reading.batteryTemp < settings.minBatteryTemp ||
    reading.batteryVoltage < settings.minBatteryVoltage
  ) {
    batteryProtection = 'ACTIVE';
  } else {
    batteryProtection = 'INACTIVE';
  }

  // 3. System Protection State:
  const systemProtection: 'ACTIVE' | 'INACTIVE' =
    tempProtection === 'ACTIVE' || batteryProtection === 'ACTIVE' || nextHeaterStatus === 'ON'
      ? 'ACTIVE'
      : 'INACTIVE';

  const heaterWatts = nextHeaterStatus === 'ON' ? 24.5 : 0.0;

  return {
    newHeaterState: nextHeaterStatus,
    protectionState: {
      heaterMode: currentProtection.heaterMode,
      heaterStatus: nextHeaterStatus,
      tempProtection,
      batteryProtection,
      systemProtection,
      lastTriggerReason: lastReason,
      heaterPowerWatts: heaterWatts,
    },
    newAlerts,
  };
}
