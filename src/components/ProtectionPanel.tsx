import React from 'react';
import {
  ProtectionControlState,
  HeaterMode,
  ThresholdSettings,
  SensorReading,
} from '../types/smce';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  BatteryMedium,
  Radio,
  SlidersHorizontal,
  Info,
  Power,
  RotateCw,
} from 'lucide-react';

interface ProtectionPanelProps {
  protection: ProtectionControlState;
  onSetHeaterMode: (mode: HeaterMode) => void;
  settings: ThresholdSettings;
  reading: SensorReading;
}

export const ProtectionPanel: React.FC<ProtectionPanelProps> = ({
  protection,
  onSetHeaterMode,
  settings,
  reading,
}) => {
  const isHeaterOn = protection.heaterStatus === 'ON';
  const isTempProtected = protection.tempProtection === 'ACTIVE';
  const isBatteryProtected = protection.batteryProtection === 'ACTIVE';
  const isSystemProtected = protection.systemProtection === 'ACTIVE';

  // Distance from auto trigger threshold
  const marginToHeater = reading.equipmentTemp - settings.heaterAutoThreshold;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
              isHeaterOn
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              PROTECTION CONTROL
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isSystemProtected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                AUTONOMOUS LOOP
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-altitude thermal management &amp; low-temperature defense matrix
            </p>
          </div>
        </div>

        {/* Protection Core State Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Loop Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border ${
              isSystemProtected
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSystemProtected ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
            {isSystemProtected ? 'PROTECTION ENGAGED' : 'MONITORING STANDBY'}
          </span>
        </div>
      </div>

      {/* Prominent Mandatory Explanation Box */}
      <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-900 border-l-4 border-cyan-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-cyan-200">Autonomous Thermal Safeguard Rule:</h4>
            <p className="text-sm font-medium text-slate-100 mt-0.5 leading-relaxed">
              If the temperature falls below the configured minimum threshold ({settings.heaterAutoThreshold}°C),
              the system activates the heater automatically to protect the equipment.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
              <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Trigger Threshold: <strong className="text-amber-400">{settings.heaterAutoThreshold}°C</strong>
              </span>
              <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Deactivation Ceiling: <strong className="text-emerald-400">{settings.heaterAutoThreshold + settings.heaterHysteresis}°C</strong> (+{settings.heaterHysteresis}°C Hysteresis)
              </span>
              <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Current Margin: <strong className={marginToHeater <= 0 ? 'text-rose-400' : 'text-cyan-400'}>
                  {marginToHeater <= 0 ? 'BREACHED (Heater Active)' : `+${marginToHeater.toFixed(1)}°C Safe`}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Status Indicator Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Heater Status */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
            isHeaterOn
              ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Heater Status</span>
            <Flame className={`w-4 h-4 ${isHeaterOn ? 'text-rose-400 animate-bounce' : 'text-slate-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-lg font-bold font-mono ${
                isHeaterOn ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {protection.heaterStatus}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {isHeaterOn ? `${protection.heaterPowerWatts} W` : '0.0 W'}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            {isHeaterOn ? 'PTC Element Dissipating' : 'PTC Array Dormant'}
          </div>
        </div>

        {/* Temperature Protection */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
            isTempProtected
              ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Temp Protection</span>
            <Cpu className={`w-4 h-4 ${isTempProtected ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-lg font-bold font-mono ${
                isTempProtected ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {protection.tempProtection}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            {isTempProtected ? 'Thermal Loop Active' : 'Thermal Envelope Nominal'}
          </div>
        </div>

        {/* Battery Protection */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
            isBatteryProtected
              ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-950/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Battery Protection</span>
            <BatteryMedium className={`w-4 h-4 ${isBatteryProtected ? 'text-amber-400' : 'text-slate-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-lg font-bold font-mono ${
                isBatteryProtected ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {protection.batteryProtection}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            {isBatteryProtected ? 'Freeze Guard Engaged' : 'Cell Volt/Temp Nominal'}
          </div>
        </div>

        {/* System Protection */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
            isSystemProtected
              ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-950/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">System Protection</span>
            {isSystemProtected ? (
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-lg font-bold font-mono ${
                isSystemProtected ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {protection.systemProtection}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            {isSystemProtected ? 'Safety Interlocks Engaged' : 'Passive Monitoring'}
          </div>
        </div>
      </div>

      {/* Manual Heater Control Section */}
      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Manual Heater Control</h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select control mode for prototype demonstration or override automated logic.
          </p>
        </div>

        {/* 3 Buttons: ON / OFF / AUTO */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-lg">
          <button
            onClick={() => onSetHeaterMode('ON')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              protection.heaterMode === 'ON'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            ON
          </button>

          <button
            onClick={() => onSetHeaterMode('OFF')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              protection.heaterMode === 'OFF'
                ? 'bg-slate-700 text-white shadow-lg scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Power className="w-3.5 h-3.5 opacity-60" />
            OFF
          </button>

          <button
            onClick={() => onSetHeaterMode('AUTO')}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              protection.heaterMode === 'AUTO'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-105 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            AUTO
          </button>
        </div>
      </div>

      {/* Diagnostic state explanation string */}
      <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span className="text-slate-500">Active Logic Policy:</span>
        <span className="text-cyan-300 truncate max-w-xl">{protection.lastTriggerReason}</span>
      </div>
    </div>
  );
};
