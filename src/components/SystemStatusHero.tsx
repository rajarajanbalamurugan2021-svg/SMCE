import React from 'react';
import { SystemStatus, ProtectionControlState, RiskAssessment } from '../types/smce';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Activity,
  HeartPulse,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SystemStatusHeroProps {
  status: SystemStatus;
  protection: ProtectionControlState;
  assessment: RiskAssessment;
  heaterStatus: 'ON' | 'OFF';
  uptimeSeconds: number;
}

export const SystemStatusHero: React.FC<SystemStatusHeroProps> = ({
  status,
  protection,
  assessment,
  heaterStatus,
  uptimeSeconds,
}) => {
  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const healthScore = protection.systemHealthScore ?? 92;
  const healthStatus = healthScore >= 85 ? 'SAFE' : healthScore >= 60 ? 'CAUTION' : 'CRITICAL';

  // Determine styling and badge
  const getStatusConfig = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          title: 'CRITICAL',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-950/80',
          glowRing: 'ring-rose-500/40 bg-gradient-to-r from-rose-950/40 via-red-900/30 to-slate-900',
          indicatorColor: 'bg-rose-500',
          icon: AlertOctagon,
          summary: 'Critical environmental or equipment threshold breach. Immediate safeguard intervention active.',
        };
      case 'WARNING':
        return {
          title: 'WARNING',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-950/60',
          glowRing: 'ring-amber-500/40 bg-gradient-to-r from-amber-950/40 via-yellow-900/20 to-slate-900',
          indicatorColor: 'bg-amber-400',
          icon: AlertTriangle,
          summary: 'Subsystem operating near threshold limits. Monitoring thermal and electrical parameters closely.',
        };
      case 'PROTECTION ACTIVE':
        return {
          title: 'PROTECTION ACTIVE',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-lg shadow-cyan-950/80 animate-pulse',
          glowRing: 'ring-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-blue-900/30 to-slate-900',
          indicatorColor: 'bg-cyan-400',
          icon: Flame,
          summary: `MAHAPS Adaptive Thermal Loop Engaged: Software PWM heating at ${protection.heaterPwm}% (${protection.heaterPowerWatts}W) to maintain core thermal equilibrium.`,
        };
      case 'NORMAL':
      default:
        return {
          title: 'NORMAL',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-950/50',
          glowRing: 'ring-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900',
          indicatorColor: 'bg-emerald-400',
          icon: ShieldCheck,
          summary: 'All telemetry channels nominal. Atmospheric & equipment parameters well within safety boundaries.',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-2xl border border-slate-800 p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-500 ${config.glowRing}`}
    >
      {/* Background Grid Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Huge Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Glowing Status Beacon */}
          <div className="relative flex items-center justify-center">
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${config.badgeBg}`}>
              <StatusIcon className="w-10 h-10 animate-bounce" />
            </div>
            {/* Ambient Pulse Dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.indicatorColor}`} />
              <span className={`relative inline-flex rounded-full h-4 w-4 ${config.indicatorColor}`} />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
                MAHAPS SYSTEM STATUS
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                {protection.thermalControlMode ?? 'AUTONOMOUS PREDICTIVE'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white mt-1 flex items-center gap-3">
              {config.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {config.summary}
            </p>
          </div>
        </div>

        {/* Right: Quick Telemetry Chips including Prominent System Health Score */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono text-xs">
          {/* Prominent System Health Score */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-emerald-400" />
              <span>System Health</span>
            </div>
            <div className="font-bold flex items-baseline gap-1 mt-0.5">
              <span className={`text-base ${healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {healthScore}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase">
                {healthStatus}
              </span>
            </div>
          </div>

          {/* Heater & PWM */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Heater PWM</span>
            </div>
            <div className="font-bold flex items-center gap-1 mt-0.5">
              <span className={heaterStatus === 'ON' ? 'text-rose-400' : 'text-slate-300'}>
                {protection.heaterPwm}% ({protection.heaterStatus})
              </span>
            </div>
          </div>

          {/* Thermal Risk / Hazard Score */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Hazard Index</span>
            </div>
            <div className="font-bold flex items-center gap-1 mt-0.5 text-white">
              <span>{assessment.hazardScore}/100</span>
              <span className="text-[10px] text-slate-400">({protection.thermalRisk ?? 'SAFE'})</span>
            </div>
          </div>

          {/* Mission Uptime */}
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 uppercase">Mission Uptime</div>
            <div className="font-bold text-slate-200 mt-0.5">
              {formatUptime(uptimeSeconds)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
