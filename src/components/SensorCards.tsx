import React from 'react';
import { SensorReading, ThresholdSettings, ConditionStatus } from '../types/smce';
import {
  Thermometer,
  BatteryCharging,
  Droplets,
  Gauge,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface SensorCardsProps {
  reading: SensorReading;
  previousReading?: SensorReading;
  settings: ThresholdSettings;
  history: SensorReading[];
}

interface SensorCardMeta {
  id: string;
  name: string;
  channel: string;
  value: number;
  unit: string;
  status: ConditionStatus;
  statusText: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
  prevValue?: number;
  minLimit: number;
  maxLimit: number;
  precision: number;
  historyValues: number[];
}

export const SensorCards: React.FC<SensorCardsProps> = ({
  reading,
  previousReading,
  settings,
  history,
}) => {
  // Determine statuses for each card
  const getEquipmentTempStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val < settings.minEquipmentTemp || val > settings.maxEquipmentTemp) {
      return { status: 'CRITICAL', text: val < settings.minEquipmentTemp ? 'Critical Sub-Zero' : 'Thermal Overload' };
    }
    if (val < settings.heaterAutoThreshold || val > settings.maxEquipmentTemp - 5) {
      return { status: 'WARNING', text: val < settings.heaterAutoThreshold ? 'Low Temp (Auto Heat)' : 'High Temp' };
    }
    return { status: 'NORMAL', text: 'Normal' };
  };

  const getBatteryTempStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val < settings.minBatteryTemp || val > settings.maxBatteryTemp) {
      return { status: 'CRITICAL', text: val < settings.minBatteryTemp ? 'Freeze Hazard' : 'Overheat' };
    }
    if (val < settings.minBatteryTemp + 3 || val > settings.maxBatteryTemp - 5) {
      return { status: 'WARNING', text: val < settings.minBatteryTemp + 3 ? 'Cold Stress' : 'Elevated' };
    }
    return { status: 'NORMAL', text: 'Normal' };
  };

  const getHumidityStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val > settings.maxHumidity) return { status: 'CRITICAL', text: 'Condensation Hazard' };
    if (val > settings.maxHumidity - 10) return { status: 'WARNING', text: 'High Humidity' };
    return { status: 'NORMAL', text: 'Normal' };
  };

  const getPressureStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val < settings.minPressure) return { status: 'CRITICAL', text: 'Ultra Hypobaric' };
    if (val > settings.maxPressure) return { status: 'WARNING', text: 'High Pressure' };
    return { status: 'NORMAL', text: 'Normal (High-Alt)' };
  };

  const getVoltageStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val < settings.minBatteryVoltage) return { status: 'CRITICAL', text: 'Critical Low (LVD)' };
    if (val < settings.minBatteryVoltage + 0.15) return { status: 'WARNING', text: 'Voltage Low' };
    return { status: 'NORMAL', text: 'Normal' };
  };

  const getCurrentStatus = (val: number): { status: ConditionStatus; text: string } => {
    if (val > settings.maxCurrent) return { status: 'CRITICAL', text: 'Overcurrent Trip' };
    if (val > settings.maxCurrent * 0.85) return { status: 'WARNING', text: 'High Current Load' };
    return { status: 'NORMAL', text: 'Normal' };
  };

  const eqTempStatus = getEquipmentTempStatus(reading.equipmentTemp);
  const batTempStatus = getBatteryTempStatus(reading.batteryTemp);
  const humStatus = getHumidityStatus(reading.humidity);
  const pressStatus = getPressureStatus(reading.pressure);
  const voltStatus = getVoltageStatus(reading.batteryVoltage);
  const currStatus = getCurrentStatus(reading.batteryCurrent);

  // Extract recent 15 values for mini sparklines
  const last15 = history.slice(-15);

  const cards: SensorCardMeta[] = [
    {
      id: 'eq_temp',
      name: 'Equipment Temperature',
      channel: 'CH-1 PT100 RTD',
      value: reading.equipmentTemp,
      unit: '°C',
      status: eqTempStatus.status,
      statusText: eqTempStatus.text,
      icon: Thermometer,
      accentColor: '#f43f5e',
      borderColor: eqTempStatus.status === 'CRITICAL' ? 'border-rose-500' : eqTempStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: eqTempStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : eqTempStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.equipmentTemp,
      minLimit: settings.minEquipmentTemp,
      maxLimit: settings.maxEquipmentTemp,
      precision: 1,
      historyValues: last15.map((h) => h.equipmentTemp),
    },
    {
      id: 'bat_temp',
      name: 'Battery Temperature',
      channel: 'CH-2 NTC Core Probe',
      value: reading.batteryTemp,
      unit: '°C',
      status: batTempStatus.status,
      statusText: batTempStatus.text,
      icon: BatteryCharging,
      accentColor: '#38bdf8',
      borderColor: batTempStatus.status === 'CRITICAL' ? 'border-rose-500' : batTempStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: batTempStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : batTempStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.batteryTemp,
      minLimit: settings.minBatteryTemp,
      maxLimit: settings.maxBatteryTemp,
      precision: 1,
      historyValues: last15.map((h) => h.batteryTemp),
    },
    {
      id: 'humidity',
      name: 'Humidity',
      channel: 'CH-3 BME280 RH',
      value: reading.humidity,
      unit: '%',
      status: humStatus.status,
      statusText: humStatus.text,
      icon: Droplets,
      accentColor: '#06b6d4',
      borderColor: humStatus.status === 'CRITICAL' ? 'border-rose-500' : humStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: humStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : humStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.humidity,
      minLimit: 10,
      maxLimit: settings.maxHumidity,
      precision: 1,
      historyValues: last15.map((h) => h.humidity),
    },
    {
      id: 'pressure',
      name: 'Atmospheric Pressure',
      channel: 'CH-4 Baro BMP/BME',
      value: reading.pressure,
      unit: 'hPa',
      status: pressStatus.status,
      statusText: pressStatus.text,
      icon: Gauge,
      accentColor: '#a855f7',
      borderColor: pressStatus.status === 'CRITICAL' ? 'border-rose-500' : pressStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: pressStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : pressStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.pressure,
      minLimit: settings.minPressure,
      maxLimit: settings.maxPressure,
      precision: 1,
      historyValues: last15.map((h) => h.pressure),
    },
    {
      id: 'voltage',
      name: 'Battery Voltage',
      channel: 'CH-5 INA219 Bus V',
      value: reading.batteryVoltage,
      unit: 'V',
      status: voltStatus.status,
      statusText: voltStatus.text,
      icon: Zap,
      accentColor: '#10b981',
      borderColor: voltStatus.status === 'CRITICAL' ? 'border-rose-500' : voltStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: voltStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : voltStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.batteryVoltage,
      minLimit: settings.minBatteryVoltage,
      maxLimit: settings.maxBatteryVoltage,
      precision: 2,
      historyValues: last15.map((h) => h.batteryVoltage),
    },
    {
      id: 'current',
      name: 'Battery Current',
      channel: 'CH-6 Shunt 0.1Ω',
      value: reading.batteryCurrent,
      unit: 'A',
      status: currStatus.status,
      statusText: currStatus.text,
      icon: Zap,
      accentColor: '#f59e0b',
      borderColor: currStatus.status === 'CRITICAL' ? 'border-rose-500' : currStatus.status === 'WARNING' ? 'border-amber-500' : 'border-slate-800',
      bgGlow: currStatus.status === 'CRITICAL' ? 'bg-rose-500/10' : currStatus.status === 'WARNING' ? 'bg-amber-500/10' : 'bg-slate-900/90',
      prevValue: previousReading?.batteryCurrent,
      minLimit: 0,
      maxLimit: settings.maxCurrent,
      precision: 2,
      historyValues: last15.map((h) => h.batteryCurrent),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const delta = card.prevValue !== undefined ? card.value - card.prevValue : 0;
        const hasDelta = Math.abs(delta) > 0.001;

        // Sparkline path
        const sparklinePoints = card.historyValues;
        let sparkPath = '';
        if (sparklinePoints.length > 1) {
          const sMin = Math.min(...sparklinePoints);
          const sMax = Math.max(...sparklinePoints);
          const sRange = sMax === sMin ? 1 : sMax - sMin;
          const sWidth = 80;
          const sHeight = 24;

          sparkPath = sparklinePoints
            .map((val, idx) => {
              const x = (idx / (sparklinePoints.length - 1)) * sWidth;
              const y = sHeight - ((val - sMin) / sRange) * (sHeight - 4) - 2;
              return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
        }

        // Status badge styling
        let statusBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        let StatusIcon = CheckCircle2;
        if (card.status === 'CRITICAL') {
          statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
          StatusIcon = AlertOctagon;
        } else if (card.status === 'WARNING') {
          statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
          StatusIcon = AlertTriangle;
        }

        return (
          <div
            key={card.id}
            className={`relative rounded-xl border p-4 shadow-lg transition-all duration-300 hover:border-slate-700 ${card.borderColor} ${card.bgGlow}`}
          >
            {/* Top row: Sensor Name & Channel */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  {card.channel}
                </span>
                <h4 className="text-sm font-semibold text-slate-200 tracking-wide mt-0.5">
                  {card.name}
                </h4>
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 border border-slate-700/60"
                style={{ color: card.accentColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle row: Big Digital Value + Sparkline */}
            <div className="flex items-baseline justify-between mt-3 mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {card.value < 0 ? card.value.toFixed(card.precision) : `${card.value.toFixed(card.precision)}`}
                </span>
                <span className="text-sm font-semibold text-slate-400 font-mono">
                  {card.unit}
                </span>
              </div>

              {/* Mini Sparkline */}
              {sparkPath && (
                <div className="w-20 h-6 select-none opacity-80">
                  <svg viewBox="0 0 80 24" className="w-full h-full overflow-visible">
                    <path
                      d={sparkPath}
                      fill="none"
                      stroke={card.accentColor}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Bottom Row: Status Badge & Trend Delta */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
              {/* Status Indicator */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-mono">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadgeClass}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {card.statusText}
                </span>
              </div>

              {/* Trend Indicator */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                {hasDelta ? (
                  delta > 0 ? (
                    <span className="flex items-center text-cyan-400">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      +{delta.toFixed(card.precision)}
                    </span>
                  ) : (
                    <span className="flex items-center text-rose-400">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      {delta.toFixed(card.precision)}
                    </span>
                  )
                ) : (
                  <span className="flex items-center text-slate-500">
                    <Minus className="w-3 h-3 mr-0.5" />
                    0.0
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
