import React, { useState } from 'react';
import { ThresholdSettings } from '../types/smce';
import { DEFAULT_THRESHOLDS } from '../services/storage';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Shield,
  Thermometer,
  Zap,
  Droplets,
  Gauge,
  Flame,
  MapPin,
  Volume2,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ThresholdSettings;
  onSaveSettings: (settings: ThresholdSettings) => void;
}

function cleanFormNumber(val: any, fallback: number): number {
  if (val === '' || val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<ThresholdSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if parent settings change
  React.useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleNumberChange = (key: keyof ThresholdSettings, rawValue: string, fallback: number) => {
    setSavedSuccess(false);
    if (rawValue === '' || rawValue === '-') {
      setForm((prev) => ({ ...prev, [key]: rawValue as any }));
    } else {
      const parsed = parseFloat(rawValue);
      setForm((prev) => ({ ...prev, [key]: isNaN(parsed) ? fallback : parsed }));
    }
  };

  const handleTextChange = (key: keyof ThresholdSettings, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const formatInputValue = (val: any, fallback: number = 0): string | number => {
    if (val === '' || val === '-') return val;
    if (val === null || val === undefined) return fallback;
    const num = Number(val);
    if (isNaN(num)) return fallback;
    return val;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized: ThresholdSettings = {
      ...form,
      minEquipmentTemp: cleanFormNumber(form.minEquipmentTemp, DEFAULT_THRESHOLDS.minEquipmentTemp),
      maxEquipmentTemp: cleanFormNumber(form.maxEquipmentTemp, DEFAULT_THRESHOLDS.maxEquipmentTemp),
      minBatteryTemp: cleanFormNumber(form.minBatteryTemp, DEFAULT_THRESHOLDS.minBatteryTemp),
      maxBatteryTemp: cleanFormNumber(form.maxBatteryTemp, DEFAULT_THRESHOLDS.maxBatteryTemp),
      maxHumidity: cleanFormNumber(form.maxHumidity, DEFAULT_THRESHOLDS.maxHumidity),
      minPressure: cleanFormNumber(form.minPressure, DEFAULT_THRESHOLDS.minPressure),
      maxPressure: cleanFormNumber(form.maxPressure, DEFAULT_THRESHOLDS.maxPressure),
      minBatteryVoltage: cleanFormNumber(form.minBatteryVoltage, DEFAULT_THRESHOLDS.minBatteryVoltage),
      maxBatteryVoltage: cleanFormNumber(form.maxBatteryVoltage, DEFAULT_THRESHOLDS.maxBatteryVoltage),
      maxCurrent: cleanFormNumber(form.maxCurrent, DEFAULT_THRESHOLDS.maxCurrent),
      heaterAutoThreshold: cleanFormNumber(form.heaterAutoThreshold, DEFAULT_THRESHOLDS.heaterAutoThreshold),
      heaterHysteresis: cleanFormNumber(form.heaterHysteresis, DEFAULT_THRESHOLDS.heaterHysteresis),
      altitudeMeters: cleanFormNumber(form.altitudeMeters, DEFAULT_THRESHOLDS.altitudeMeters),
      stationName: typeof form.stationName === 'string' && form.stationName ? form.stationName : DEFAULT_THRESHOLDS.stationName,
    };
    setForm(sanitized);
    onSaveSettings(sanitized);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all threshold values to factory engineering defaults?')) {
      setForm({ ...DEFAULT_THRESHOLDS });
      onSaveSettings({ ...DEFAULT_THRESHOLDS });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const hysteresisCutoff = (
    cleanFormNumber(form.heaterAutoThreshold, DEFAULT_THRESHOLDS.heaterAutoThreshold) +
    cleanFormNumber(form.heaterHysteresis, DEFAULT_THRESHOLDS.heaterHysteresis)
  ).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              SYSTEM THRESHOLD &amp; CALIBRATION SETTINGS
            </h3>
            <p className="text-xs text-slate-400">
              Configure parameters governing environmental risk detection and autonomous heater trigger loops
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings Saved
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Temperature Thresholds */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-300 font-mono">
            <Thermometer className="w-4 h-4 text-rose-400" />
            TEMPERATURE SAFE ENVELOPE &amp; HEATER ACTIVATION
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Minimum Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formatInputValue(form.minEquipmentTemp, DEFAULT_THRESHOLDS.minEquipmentTemp)}
                onChange={(e) => handleNumberChange('minEquipmentTemp', e.target.value, DEFAULT_THRESHOLDS.minEquipmentTemp)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Critical freeze threshold (Default: -20°C)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Maximum Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formatInputValue(form.maxEquipmentTemp, DEFAULT_THRESHOLDS.maxEquipmentTemp)}
                onChange={(e) => handleNumberChange('maxEquipmentTemp', e.target.value, DEFAULT_THRESHOLDS.maxEquipmentTemp)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Upper thermal limit (Default: 40°C)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Heater Auto Trigger (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formatInputValue(form.heaterAutoThreshold, DEFAULT_THRESHOLDS.heaterAutoThreshold)}
                onChange={(e) => handleNumberChange('heaterAutoThreshold', e.target.value, DEFAULT_THRESHOLDS.heaterAutoThreshold)}
                className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-cyan-400/80 mt-1 block font-mono">
                Activates heater automatically if temp &lt; this
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Heater Hysteresis (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formatInputValue(form.heaterHysteresis, DEFAULT_THRESHOLDS.heaterHysteresis)}
                onChange={(e) => handleNumberChange('heaterHysteresis', e.target.value, DEFAULT_THRESHOLDS.heaterHysteresis)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Off-band delta: shuts off at {hysteresisCutoff}°C
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Electrical Safeguards (Battery & Current) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 font-mono">
            <Zap className="w-4 h-4 text-emerald-400" />
            ELECTRICAL &amp; BATTERY SAFELIMITS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Minimum Battery Voltage (V)
              </label>
              <input
                type="number"
                step="0.05"
                value={formatInputValue(form.minBatteryVoltage, DEFAULT_THRESHOLDS.minBatteryVoltage)}
                onChange={(e) => handleNumberChange('minBatteryVoltage', e.target.value, DEFAULT_THRESHOLDS.minBatteryVoltage)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Low Voltage Disconnect (LVD) threshold (Default: 3.3V)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Maximum Current Rating (A)
              </label>
              <input
                type="number"
                step="0.1"
                value={formatInputValue(form.maxCurrent, DEFAULT_THRESHOLDS.maxCurrent)}
                onChange={(e) => handleNumberChange('maxCurrent', e.target.value, DEFAULT_THRESHOLDS.maxCurrent)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Overcurrent trip ceiling (Default: 2.0A)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Min Battery Temp Limit (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formatInputValue(form.minBatteryTemp, DEFAULT_THRESHOLDS.minBatteryTemp)}
                onChange={(e) => handleNumberChange('minBatteryTemp', e.target.value, DEFAULT_THRESHOLDS.minBatteryTemp)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Li-ion core freezing hazard limit (Default: -10°C)
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Atmospheric & Environmental Parameters */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300 font-mono">
            <Droplets className="w-4 h-4 text-cyan-400" />
            HUMIDITY &amp; HIGH-ALTITUDE PRESSURE BOUNDARIES
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Maximum Humidity (% RH)
              </label>
              <input
                type="number"
                step="1"
                value={formatInputValue(form.maxHumidity, DEFAULT_THRESHOLDS.maxHumidity)}
                onChange={(e) => handleNumberChange('maxHumidity', e.target.value, DEFAULT_THRESHOLDS.maxHumidity)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Condensation &amp; icing alert threshold (Default: 80%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Minimum Pressure (hPa)
              </label>
              <input
                type="number"
                step="5"
                value={formatInputValue(form.minPressure, DEFAULT_THRESHOLDS.minPressure)}
                onChange={(e) => handleNumberChange('minPressure', e.target.value, DEFAULT_THRESHOLDS.minPressure)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Ultra-low pressure limit (Default: 450 hPa)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Maximum Pressure (hPa)
              </label>
              <input
                type="number"
                step="5"
                value={formatInputValue(form.maxPressure, DEFAULT_THRESHOLDS.maxPressure)}
                onChange={(e) => handleNumberChange('maxPressure', e.target.value, DEFAULT_THRESHOLDS.maxPressure)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Upper pressure boundary (Default: 750 hPa)
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Site Identification & Altitude */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-300 font-mono">
            <MapPin className="w-4 h-4 text-purple-400" />
            DEPLOYMENT LOCATION METADATA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Monitoring Station Name
              </label>
              <input
                type="text"
                value={form.stationName || ''}
                onChange={(e) => handleTextChange('stationName', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Deployment Altitude (Meters AMSL)
              </label>
              <input
                type="number"
                step="10"
                value={formatInputValue(form.altitudeMeters, DEFAULT_THRESHOLDS.altitudeMeters)}
                onChange={(e) => handleNumberChange('altitudeMeters', e.target.value, DEFAULT_THRESHOLDS.altitudeMeters)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Trigger */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Apply &amp; Persist Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
