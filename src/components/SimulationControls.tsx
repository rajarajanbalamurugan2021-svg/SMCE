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
  AlertOctagon,
  Wrench,
  Wind,
  Info,
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
  const [isFaultPanelOpen, setIsFaultPanelOpen] = useState(false);

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

  const toggleFault = (key: 'simulatedHeaterFault' | 'simulatedSensorFault' | 'simulatedFanFault' | 'rapidCoolingActive' | 'rapidHeatingActive') => {
    onUpdateSimState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetToNominal = () => {
    onUpdateSimState((prev) => ({
      ...prev,
      equipmentTemp: -12.4,
      batteryTemp: -9.8,
      humidity: 28.5,
      pressure: 645.0,
      batteryVoltage: 12.15,
      batteryCurrent: 0.42,
      ambientColdTemp: -16.0,
      manualOverrideActive: false,
      simulatedHeaterFault: false,
      simulatedSensorFault: false,
      simulatedFanFault: false,
      rapidCoolingActive: false,
      rapidHeatingActive: false,
      activeScenarioId: 'NORMAL',
    }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Top Banner & Explicit Simulation Disclaimer */}
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
                SIMULATION MODE
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  simState.enabled
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {simState.enabled ? 'ACTIVE SYNTHETIC STREAM (1.5s)' : 'PAUSED'}
              </span>
              <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/80">
                SOFTWARE PHYSICAL MODEL (Not Hardware Data)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Realistic physical kinematics engine for Ladakh high-altitude validation &amp; SIH hackathon evaluation.
            </p>
          </div>
        </div>

        {/* Quick Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFaultPanelOpen(!isFaultPanelOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
              simState.simulatedHeaterFault || simState.simulatedSensorFault || simState.simulatedFanFault
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Fault Injections</span>
          </button>

          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              simState.enabled
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400'
            }`}
          >
            {simState.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {simState.enabled ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Sliders</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SIH DEMO SCENARIO SELECTOR (Requirement #13) */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            SIH 26049 DEMO SCENARIOS (EVALUATION MATRIX):
          </span>
          <button
            onClick={handleResetToNominal}
            className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" /> Reset Nominal Base
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = simState.activeScenarioId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onApplyPreset(preset);
                  onUpdateSimState((prev) => ({ ...prev, activeScenarioId: preset.id }));
                }}
                className={`p-2.5 rounded-lg text-left transition-all group border ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 scale-[1.02]'
                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {preset.id}
                  </span>
                  <span className="text-[9px] font-mono bg-slate-900 px-1 py-0.5 rounded text-slate-400 border border-slate-800">
                    {preset.equipmentTemp}°C
                  </span>
                </div>
                <div className="text-[11px] font-medium text-white mt-1 truncate">
                  {preset.name.split(' (')[0]}
                </div>
                <div className="text-[9px] font-mono text-amber-400/90 mt-0.5 truncate">
                  {preset.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Fault Injections Panel */}
      {isFaultPanelOpen && (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-rose-300">
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              INTELLIGENT FAULT SIMULATOR &amp; HEURISTIC INJECTION:
            </span>
            <span className="text-[10px] text-slate-500">Toggle live to trigger MAHAPS auto-detection</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <button
              onClick={() => toggleFault('simulatedHeaterFault')}
              className={`p-2 rounded border transition-all text-left ${
                simState.simulatedHeaterFault
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Heater Failure</span>
                <span className={`w-2 h-2 rounded-full ${simState.simulatedHeaterFault ? 'bg-rose-400 animate-ping' : 'bg-slate-700'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Zero thermal response</div>
            </button>

            <button
              onClick={() => toggleFault('simulatedSensorFault')}
              className={`p-2 rounded border transition-all text-left ${
                simState.simulatedSensorFault
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Sensor Failure</span>
                <span className={`w-2 h-2 rounded-full ${simState.simulatedSensorFault ? 'bg-rose-400 animate-ping' : 'bg-slate-700'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Disconnected / -999°C</div>
            </button>

            <button
              onClick={() => toggleFault('simulatedFanFault')}
              className={`p-2 rounded border transition-all text-left ${
                simState.simulatedFanFault
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Fan Stall / Fail</span>
                <span className={`w-2 h-2 rounded-full ${simState.simulatedFanFault ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Convective stall</div>
            </button>

            <button
              onClick={() => toggleFault('rapidCoolingActive')}
              className={`p-2 rounded border transition-all text-left ${
                simState.rapidCoolingActive
                  ? 'bg-blue-950/80 border-blue-500 text-blue-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Rapid Cooling</span>
                <span className={`w-2 h-2 rounded-full ${simState.rapidCoolingActive ? 'bg-blue-400 animate-ping' : 'bg-slate-700'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Blizzard gust front</div>
            </button>

            <button
              onClick={() => toggleFault('rapidHeatingActive')}
              className={`p-2 rounded border transition-all text-left ${
                simState.rapidHeatingActive
                  ? 'bg-orange-950/80 border-orange-500 text-orange-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Rapid Heating</span>
                <span className={`w-2 h-2 rounded-full ${simState.rapidHeatingActive ? 'bg-orange-400 animate-ping' : 'bg-slate-700'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Direct solar load</div>
            </button>
          </div>
        </div>
      )}

      {/* Manual Sliders Collapsible Section */}
      {isExpanded && (
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Equipment Temp Slider: -35°C to +40°C */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Equipment Temp:
                </span>
                <span className="font-bold text-white">{simState.equipmentTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min="-35"
                max="40"
                step="0.5"
                value={simState.equipmentTemp}
                onChange={(e) => setManualValue('equipmentTemp', parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-35°C</span>
                <span>Freeze Limit</span>
                <span>+40°C</span>
              </div>
            </div>

            {/* Atmospheric Pressure: 450 to 750 hPa (60-70 kPa range) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" /> Baro Pressure:
                </span>
                <span className="font-bold text-white">
                  {(simState.pressure / 10).toFixed(1)} kPa ({simState.pressure.toFixed(0)} hPa)
                </span>
              </div>
              <input
                type="range"
                min="450"
                max="750"
                step="5"
                value={simState.pressure}
                onChange={(e) => setManualValue('pressure', parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>45 kPa (Thin)</span>
                <span>Ladakh Base</span>
                <span>75 kPa</span>
              </div>
            </div>

            {/* Relative Humidity: 10% to 95% */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Humidity:
                </span>
                <span className="font-bold text-white">{simState.humidity.toFixed(1)}% RH</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="1"
                value={simState.humidity}
                onChange={(e) => setManualValue('humidity', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10% (Dry)</span>
                <span>Condensation Knee</span>
                <span>95%</span>
              </div>
            </div>

            {/* Battery Voltage: 10.0V to 12.6V (or cell equivalent) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Battery Bus:
                </span>
                <span className="font-bold text-white">{simState.batteryVoltage.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="12.6"
                step="0.05"
                value={simState.batteryVoltage}
                onChange={(e) => setManualValue('batteryVoltage', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10.0V (LVD)</span>
                <span>11.1V (Nominal)</span>
                <span>12.6V (Full)</span>
              </div>
            </div>

            {/* Battery Current: 0.2A to 3.0A */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Current Draw:
                </span>
                <span className="font-bold text-white">{simState.batteryCurrent.toFixed(2)} A</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={simState.batteryCurrent}
                onChange={(e) => setManualValue('batteryCurrent', parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.2A Idle</span>
                <span>1.6A Heating</span>
                <span>3.0A Trip</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
