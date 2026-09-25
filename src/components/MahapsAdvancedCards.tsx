import React, { useState } from 'react';
import {
  SensorReading,
  ProtectionControlState,
  RiskAssessment,
  ThresholdSettings,
  FaultItem,
} from '../types/smce';
import {
  Thermometer,
  TrendingDown,
  TrendingUp,
  Minus,
  Flame,
  BatteryMedium,
  Compass,
  Droplets,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Layers,
  Wrench,
  XCircle,
} from 'lucide-react';

interface MahapsAdvancedCardsProps {
  reading: SensorReading;
  protection: ProtectionControlState;
  assessment: RiskAssessment;
  settings: ThresholdSettings;
  onClearFault?: (faultId: string) => void;
}

export const MahapsAdvancedCards: React.FC<MahapsAdvancedCardsProps> = ({
  reading,
  protection,
  assessment,
  settings,
  onClearFault,
}) => {
  const [selectedFault, setSelectedFault] = useState<FaultItem | null>(null);

  // Health Score styling
  const healthScore = protection.systemHealthScore ?? 92;
  const healthBadge =
    healthScore >= 85
      ? { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'SAFE' }
      : healthScore >= 60
      ? { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', text: 'CAUTION' }
      : { color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40', text: 'CRITICAL' };

  // Thermal Risk styling
  const thermalRisk = protection.thermalRisk ?? 'SAFE';
  const thermalConfig =
    thermalRisk === 'CRITICAL'
      ? { badge: 'bg-rose-950/60 border-rose-500/60 text-rose-300', glow: 'border-rose-500/40' }
      : thermalRisk === 'HIGH'
      ? { badge: 'bg-orange-950/60 border-orange-500/60 text-orange-300', glow: 'border-orange-500/40' }
      : thermalRisk === 'CAUTION'
      ? { badge: 'bg-amber-950/60 border-amber-500/60 text-amber-300', glow: 'border-amber-500/40' }
      : { badge: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300', glow: 'border-slate-800' };

  // Environmental Risk styling
  const envRisk = assessment.environmentalRisk ?? 'SAFE';
  const envConfig =
    envRisk === 'CRITICAL'
      ? { badge: 'bg-rose-950/60 border-rose-500/60 text-rose-300', text: 'CRITICAL (Severe Sub-zero/Hypobaric)' }
      : envRisk === 'HIGH RISK'
      ? { badge: 'bg-orange-950/60 border-orange-500/60 text-orange-300', text: 'HIGH RISK (Extreme Thin-Air Cold)' }
      : envRisk === 'CAUTION'
      ? { badge: 'bg-amber-950/60 border-amber-500/60 text-amber-300', text: 'CAUTION (Elevated Freeze/Moisture)' }
      : { badge: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300', text: 'SAFE (Nominal Ladakh Base)' };

  // Condensation Risk styling
  const condRisk = assessment.condensationRisk ?? 'LOW';
  const condConfig =
    condRisk === 'HIGH'
      ? { badge: 'bg-rose-950/60 border-rose-500/60 text-rose-300 animate-pulse', bar: 'bg-rose-500 w-full' }
      : condRisk === 'MEDIUM'
      ? { badge: 'bg-amber-950/60 border-amber-500/60 text-amber-300', bar: 'bg-amber-500 w-2/3' }
      : { badge: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300', bar: 'bg-emerald-500 w-1/4' };

  // Trend formatting
  const trendDir = protection.tempTrend ?? 'STABLE';
  const rate = protection.tempRateOfChange ?? 0;
  const predictedTemp = protection.predictedTemp ?? reading.equipmentTemp;

  // Battery health
  const soc = protection.batterySoc ?? 85;
  const isBatteryLow = reading.batteryVoltage < (reading.batteryVoltage > 6 ? 11.2 : 3.4);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          MAHAPS ADAPTIVE THERMAL &amp; SYSTEM METRICS
        </h3>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          9-Point Diagnostics
        </span>
      </div>

      {/* Grid of Advanced Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: System Health Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              1. System Health
            </span>
            <HeartPulse className={`w-4 h-4 ${healthBadge.color}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black font-mono ${healthBadge.color}`}>
                {healthScore}%
              </span>
              <span className="text-xs text-slate-500 font-mono">Index</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${healthBadge.bg} ${healthBadge.color}`}
            >
              {healthBadge.text}
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  healthScore >= 80 ? 'bg-emerald-400' : healthScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1.5 flex justify-between">
              <span>Sensors + Power + Thermal</span>
              <span>Ladakh Guard</span>
            </p>
          </div>
        </div>

        {/* Card 2: Thermal Risk & Predictive Trend */}
        <div className={`bg-slate-900/90 border rounded-xl p-4 shadow-lg flex flex-col justify-between ${thermalConfig.glow} hover:border-cyan-500/50 transition-all`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              2. Thermal Risk &amp; Trend
            </span>
            {trendDir === 'FALLING' ? (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            ) : trendDir === 'RISING' ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {reading.equipmentTemp.toFixed(1)}°C
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${thermalConfig.badge}`}
            >
              RISK: {thermalRisk}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-400">
            <span>Trend:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                trendDir === 'FALLING' ? 'text-rose-400' : trendDir === 'RISING' ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {trendDir === 'FALLING' ? '↓ Falling' : trendDir === 'RISING' ? '↑ Rising' : '→ Stable'} (
              {rate > 0 ? '+' : ''}
              {rate.toFixed(2)}°C/m)
            </span>
          </div>
        </div>

        {/* Card 3: Predicted Temperature */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              3. Predicted Temp (5m)
            </span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-black font-mono ${
                predictedTemp < settings.minEquipmentTemp ? 'text-rose-400' : predictedTemp < settings.heaterAutoThreshold ? 'text-amber-400' : 'text-cyan-300'
              }`}
            >
              {predictedTemp.toFixed(1)}°C
            </span>
            <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60">
              5-MIN HORIZON
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-400">
            <span>Control Mode:</span>
            <span className="font-bold text-cyan-400">{protection.thermalControlMode}</span>
          </div>
        </div>

        {/* Card 4: Heater PWM & Dynamic Duty Cycle */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              4. Heater Software PWM
            </span>
            <Flame className={`w-4 h-4 ${protection.heaterPwm > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-black font-mono ${protection.heaterPwm > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {protection.heaterPwm}% PWM
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {protection.heaterPowerWatts} W
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  protection.heaterPwm > 70
                    ? 'bg-rose-500'
                    : protection.heaterPwm > 30
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${protection.heaterPwm}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1 flex justify-between">
              <span>0% Off</span>
              <span>{protection.heaterPwm > 0 ? 'Adaptive Heat' : 'Standby'}</span>
              <span>100% Max</span>
            </div>
          </div>
        </div>

        {/* Card 5: Thermal Learning & Efficiency Model */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              5. Thermal Learning
            </span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-400">Heating Efficiency:</span>
              <strong className="text-white text-base">
                {protection.learning?.heatingEfficiency ?? 88}%
              </strong>
            </div>
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-400">Response Latency:</span>
              <strong className="text-cyan-300">
                {protection.learning?.lastHeatingResponseSec ?? 18} sec
              </strong>
            </div>
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-400">Adaptive Factor:</span>
              <strong className="text-purple-300">
                {protection.learning?.adaptiveFactor ?? 1.12}x
              </strong>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-1.5 truncate">
            Self-adjusting thermal enclosure coefficient
          </div>
        </div>

        {/* Card 6: Battery Health & Power Guardian */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              6. Battery Health &amp; Power
            </span>
            <BatteryMedium className={`w-4 h-4 ${isBatteryLow ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-white">
              {reading.batteryVoltage.toFixed(2)} V
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isBatteryLow ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-emerald-950 text-emerald-300 border-emerald-600'
              }`}
            >
              SOC: {soc}%
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Bus Current:</span>
              <strong className="text-slate-200">{reading.batteryCurrent.toFixed(2)} A</strong>
            </div>
            <div className="flex justify-between">
              <span>Battery Guard:</span>
              <strong className={isBatteryLow ? 'text-amber-400' : 'text-emerald-400'}>
                {isBatteryLow ? 'PWM THROTTLED (Save)' : 'NORMAL BALANCED'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 7: Environmental Risk (BME280) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              7. Environmental Risk
            </span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-xs font-bold font-mono px-2 py-1 rounded border truncate max-w-full ${envConfig.badge}`}
            >
              {envRisk}
            </span>
            <span className="text-[10px] font-mono text-slate-400">BME280 Matrix</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Pressure:</span>
              <strong className="text-slate-200">
                {(reading.pressure / 10).toFixed(1)} kPa ({reading.pressure.toFixed(0)} hPa)
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Humidity:</span>
              <strong className="text-slate-200">{reading.humidity.toFixed(1)}% RH</strong>
            </div>
          </div>
        </div>

        {/* Card 8: Condensation Risk & Dew Point */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              8. Condensation Risk
            </span>
            <Droplets className={`w-4 h-4 ${condRisk === 'HIGH' ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${condConfig.badge}`}>
              {condRisk} RISK
            </span>
            <span className="text-xs font-mono text-cyan-300">
              Dew Pt: {assessment.dewPoint}°C
            </span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Dew Margin (ΔT):</span>
              <strong className={assessment.dewPointMargin <= 2 ? 'text-rose-400' : 'text-emerald-400'}>
                +{assessment.dewPointMargin}°C
              </strong>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className={`h-full transition-all duration-300 ${condConfig.bar}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 9: Intelligent Fault & Alert Center */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              9. INTELLIGENT FAULT &amp; DIAGNOSTIC CENTER
            </h4>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                protection.activeFaults && protection.activeFaults.filter((f) => !f.cleared).length > 0
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {protection.activeFaults && protection.activeFaults.filter((f) => !f.cleared).length > 0
                ? `${protection.activeFaults.filter((f) => !f.cleared).length} ACTIVE FAULTS`
                : 'NO HARDWARE FAULTS DETECTED'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time heuristic check (Heater / Sensor / Battery / Fan)
          </span>
        </div>

        {/* Fault List */}
        {protection.activeFaults && protection.activeFaults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {protection.activeFaults.slice(0, 4).map((fault) => (
              <div
                key={fault.id}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  fault.severity === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-amber-950/30 border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {fault.severity === 'CRITICAL' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-bold text-white truncate max-w-[280px]">
                      {fault.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {fault.displayTime}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1 font-mono leading-relaxed">
                  {fault.description}
                </p>

                <div className="mt-2 bg-slate-950/70 p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div>
                    <strong className="text-slate-300">Possible Causes:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-400">
                      {fault.possibleCauses.slice(0, 2).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-1 border-t border-slate-800/80 text-cyan-300">
                    <strong>Action:</strong> {fault.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>All thermal heaters, core temperature probes, INA219 power bus, and ventilation circuits healthy.</span>
            </div>
            <span className="text-slate-500 text-[10px]">Zero Fault Condition</span>
          </div>
        )}
      </div>
    </div>
  );
};
