import React, { useState } from 'react';
import { SimulationState, PRESET_SCENARIOS, PresetScenario } from '../services/simulator';
import { ThresholdSettings } from '../types/smce';
import {
  Play,
  Pause,
  Sliders,
  Sparkles,
  RotateCcw,
  Zap,
  Thermometer,
  Droplets,
  Gauge,
  BatteryCharging,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SimulationControlsProps {
  simState: SimulationState;
  onUpdateSimState: (updater: (prev: SimulationState) => SimulationState) => void;
  settings: ThresholdSettings;
  isHeaterOn: boolean;
  onApplyPreset: (preset: PresetScenario) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simState,
  onUpdateSimState,
  settings,
  isHeaterOn,
  onApplyPreset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSimulation = () => {
    onUpdateSimState((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const setManualValue = (key: keyof SimulationState, val: number) => {
    if (isNaN(val) || !isFinite(val)) return;
    onUpdateSimState((prev) => ({
      ...prev,
      [key]: val,
      manualOverrideActive: true,
    }));
  };

  const handleResetToNominal = () => {
    onUpdateSimState((prev) => ({
      ...prev,
      equipmentTemp: -14.2,
      batteryTemp: -10.5,
      humidity: 32.0,
      pressure: 575.0,
      batteryVoltage: 3.82,
      batteryCurrent: 0.42,
      ambientColdTemp: -18.0,
      manualOverrideActive: false,
    }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              simState.enabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                SENSOR SIMULATION ENGINE
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  simState.enabled
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {simState.enabled ? 'ACTIVE STREAM (1.5s)' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive physical telemetry testbed for Ladakh high-altitude validation
            </p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              simState.enabled
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400'
            }`}
          >
            {simState.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {simState.enabled ? 'Pause Sim' : 'Start Sim'}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Manual Sliders</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Preset Scenario Buttons for Presentation Demonstration */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>ONE-CLICK DEMONSTRATION SCENARIOS (FOR HACKATHON JURY / EXHIBITION):</span>
          <button
            onClick={handleResetToNominal}
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Nominal
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                  {preset.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono bg-slate-900 px-1 py-0.2 rounded text-slate-400 border border-slate-800">
                  {preset.equipmentTemp}°C
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-200 mt-1 truncate">
                {preset.name}
              </div>
              <div className="text-[9px] font-mono text-amber-400/90 mt-0.5 truncate">
                {preset.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Manual Slider Controls */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 font-mono">
              DIRECT SENSOR VALUE INJECTION (DRAG TO OVERRIDE)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Heater feedback loop is active ({isHeaterOn ? 'Thermal Rise' : 'Passive Loss'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            {/* Equipment Temp Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  Equipment Temp
                </span>
                <span className="font-bold text-white">
                  {simState.equipmentTemp.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="50"
                step="0.5"
                value={isNaN(simState.equipmentTemp) ? -16.4 : simState.equipmentTemp}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('equipmentTemp', v);
                }}
                className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-40°C</span>
                <span className="text-amber-400">Trigger: {settings.heaterAutoThreshold}°C</span>
                <span>+50°C</span>
              </div>
            </div>

            {/* Battery Temp Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-sky-300 flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-sky-400" />
                  Battery Temp
                </span>
                <span className="font-bold text-white">
                  {(isNaN(simState.batteryTemp) ? -12.0 : simState.batteryTemp).toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="0.5"
                value={isNaN(simState.batteryTemp) ? -12.0 : simState.batteryTemp}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('batteryTemp', v);
                }}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-30°C</span>
                <span className="text-sky-400">Min: {settings.minBatteryTemp}°C</span>
                <span>+50°C</span>
              </div>
            </div>

            {/* Battery Voltage Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Battery Voltage
                </span>
                <span className="font-bold text-white">
                  {(isNaN(simState.batteryVoltage) ? 3.75 : simState.batteryVoltage).toFixed(2)} V
                </span>
              </div>
              <input
                type="range"
                min="2.8"
                max="4.3"
                step="0.02"
                value={isNaN(simState.batteryVoltage) ? 3.75 : simState.batteryVoltage}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('batteryVoltage', v);
                }}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>2.8V</span>
                <span className="text-rose-400">Cutoff: {settings.minBatteryVoltage}V</span>
                <span>4.3V</span>
              </div>
            </div>

            {/* Current Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Battery Current
                </span>
                <span className="font-bold text-white">
                  {(isNaN(simState.batteryCurrent) ? 0.42 : simState.batteryCurrent).toFixed(2)} A
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.5"
                step="0.05"
                value={isNaN(simState.batteryCurrent) ? 0.42 : simState.batteryCurrent}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('batteryCurrent', v);
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.1A</span>
                <span className="text-rose-400">Limit: {settings.maxCurrent}A</span>
                <span>4.5A</span>
              </div>
            </div>

            {/* Humidity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan-300 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  Humidity
                </span>
                <span className="font-bold text-white">
                  {(isNaN(simState.humidity) ? 32.0 : simState.humidity).toFixed(1)} %
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={isNaN(simState.humidity) ? 32.0 : simState.humidity}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('humidity', v);
                }}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>5%</span>
                <span className="text-amber-400">Max: {settings.maxHumidity}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Pressure Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-purple-300 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  Atmospheric Pressure
                </span>
                <span className="font-bold text-white">
                  {(isNaN(simState.pressure) ? 568.5 : simState.pressure).toFixed(1)} hPa
                </span>
              </div>
              <input
                type="range"
                min="400"
                max="850"
                step="5"
                value={isNaN(simState.pressure) ? 568.5 : simState.pressure}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setManualValue('pressure', v);
                }}
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>400 hPa</span>
                <span className="text-purple-400">Ladakh Range (450 - 720)</span>
                <span>850 hPa</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
