import React from 'react';
import { RiskAssessment, RiskCondition, ConditionStatus, ThresholdSettings } from '../types/smce';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';

interface RiskDetectionPanelProps {
  assessment: RiskAssessment;
  settings: ThresholdSettings;
}

export const RiskDetectionPanel: React.FC<RiskDetectionPanelProps> = ({
  assessment,
  settings,
}) => {
  const getStatusBadge = (status: ConditionStatus) => {
    switch (status) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
          icon: AlertOctagon,
          label: 'CRITICAL',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          icon: AlertTriangle,
          label: 'WARNING',
        };
      case 'NORMAL':
      default:
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          label: 'NORMAL',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            ENVIRONMENTAL &amp; EQUIPMENT RISK DETECTION
          </h3>
          <p className="text-xs text-slate-400">
            Real-time threshold telemetry analysis for Ladakh sub-zero and hypobaric hazards
          </p>
        </div>

        {/* Hazard Score Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Composite Hazard Score</div>
            <div className="text-sm font-bold font-mono">
              <span
                className={
                  assessment.hazardScore > 50
                    ? 'text-rose-400'
                    : assessment.hazardScore > 20
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              >
                {assessment.hazardScore} / 100
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Env: <strong className="text-cyan-400">{assessment.environmentalRisk ?? 'SAFE'}</strong>
            </span>
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Condensation: <strong className={assessment.condensationRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}>{assessment.condensationRisk ?? 'LOW'}</strong>
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 ${
              assessment.activeCriticalCount > 0
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                : assessment.activeWarningCount > 0
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {assessment.activeCriticalCount > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>
              {assessment.activeCriticalCount > 0
                ? `${assessment.activeCriticalCount} CRITICAL ANOMALIES`
                : assessment.activeWarningCount > 0
                ? `${assessment.activeWarningCount} WARNINGS DETECTED`
                : 'ALL CHANNELS NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of the 6 Monitored Risk Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessment.conditions.map((cond: RiskCondition) => {
          const badge = getStatusBadge(cond.status);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={cond.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                cond.status === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : cond.status === 'WARNING'
                  ? 'bg-amber-950/15 border-amber-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Condition Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-200">{cond.name}</h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${badge.bg}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </div>

                {/* Metric Readout & Threshold info */}
                <div className="mt-2.5 flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-white">
                    {cond.currentValue.toFixed(1)} <span className="text-xs text-slate-400">{cond.unit}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Rule: {cond.thresholdLabel}
                  </span>
                </div>

                {/* Diagnostic Description */}
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                  {cond.description}
                </p>
              </div>

              {/* Actionable Recommendation Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono flex items-start gap-1.5 text-cyan-300/90">
                <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                <span className="text-slate-400">
                  <strong className="text-cyan-300 font-normal">Action: </strong>
                  {cond.recommendation}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation of Configurable Engine */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 font-mono flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Deterministic threshold engine active. Thresholds: Min Temp ({settings.minEquipmentTemp}°C), Max Temp ({settings.maxEquipmentTemp}°C),
            Max Humidity ({settings.maxHumidity}%), Min Pressure ({settings.minPressure} hPa), Min Volt ({settings.minBatteryVoltage}V), Max Curr ({settings.maxCurrent}A).
          </span>
        </div>
        <span className="text-cyan-400 text-[11px] hover:underline cursor-pointer shrink-0 ml-2">
          Edit in Settings →
        </span>
      </div>
    </div>
  );
};
