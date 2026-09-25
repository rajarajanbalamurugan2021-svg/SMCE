import React from 'react';
import {
  ProtectionControlState,
  RiskAssessment,
  SensorReading,
} from '../types/smce';
import {
  Radio,
  Cpu,
  TrendingDown,
  TrendingUp,
  Flame,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface MahapsIntelligentPipelineProps {
  reading: SensorReading;
  protection: ProtectionControlState;
  assessment: RiskAssessment;
}

export const MahapsIntelligentPipeline: React.FC<MahapsIntelligentPipelineProps> = ({
  reading,
  protection,
  assessment,
}) => {
  const steps = [
    {
      id: 'SENSE',
      title: '1. SENSE',
      sensor: 'BME280 + DS18B20 + INA219',
      data: `${reading.equipmentTemp.toFixed(1)}°C | ${reading.pressure.toFixed(0)} hPa | ${reading.batteryVoltage.toFixed(2)}V`,
      icon: Radio,
      accent: 'text-cyan-400',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/30',
    },
    {
      id: 'ANALYSE',
      title: '2. ANALYSE',
      sensor: 'Micro-climate & Condensation',
      data: `Dew Pt: ${assessment.dewPoint}°C (ΔT: ${assessment.dewPointMargin}°C)`,
      icon: Cpu,
      accent: 'text-blue-400',
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/30',
    },
    {
      id: 'PREDICT',
      title: '3. PREDICT',
      sensor: 'dT/dt Trend Extrapolator',
      data: `${protection.tempTrend === 'FALLING' ? '↓' : protection.tempTrend === 'RISING' ? '↑' : '→'} ${protection.tempRateOfChange > 0 ? '+' : ''}${protection.tempRateOfChange}°C/min → Est: ${protection.predictedTemp}°C`,
      icon: protection.tempTrend === 'FALLING' ? TrendingDown : TrendingUp,
      accent: protection.tempTrend === 'FALLING' ? 'text-amber-400' : 'text-emerald-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/30',
    },
    {
      id: 'ADAPT',
      title: '4. ADAPT',
      sensor: 'Self-Learning PWM Engine',
      data: `PWM: ${protection.heaterPwm}% | Eff: ${protection.learning?.heatingEfficiency ?? 85}% | Adapt: ${protection.learning?.adaptiveFactor ?? 1.1}x`,
      icon: Flame,
      accent: 'text-rose-400',
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/30',
    },
    {
      id: 'PROTECT',
      title: '5. PROTECT',
      sensor: 'Active Interlock Defense',
      data: `${protection.thermalControlMode} | Health: ${protection.systemHealthScore}%`,
      icon: ShieldCheck,
      accent: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/30',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider font-mono flex items-center gap-2">
              MAHAPS INTELLIGENT PROTECTION PIPELINE
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                CLOSED-LOOP NOVELTY
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              MAHAPS predicts thermal deterioration and adaptively controls heating, cooling, and power based on environmental trends and equipment condition.
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Control Mode:</span>
          <strong className="text-cyan-400">{protection.thermalControlMode}</strong>
        </div>
      </div>

      {/* 5-Stage Pipeline Process Cards with connecting arrows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 relative">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              className={`p-3 rounded-lg border ${st.border} ${st.bg} flex flex-col justify-between transition-all hover:scale-[1.02] duration-200 relative group`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${st.accent}`}>
                  {st.title}
                </span>
                <Icon className={`w-4 h-4 ${st.accent}`} />
              </div>
              <div className="text-[11px] font-mono text-slate-300 mt-2 font-medium">
                {st.sensor}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 truncate bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                {st.data}
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400 pointer-events-none">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
