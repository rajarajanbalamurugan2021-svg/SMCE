import React, { useState } from 'react';
import { TelemetryChart, DataPoint } from './TelemetryChart';
import { ThresholdSettings, SensorReading } from '../types/smce';
import { Clock, Sliders, Maximize2, Activity } from 'lucide-react';

export type TimeFilter = '1m' | '5m' | '15m' | '1h';

interface TelemetryChartsSectionProps {
  history: SensorReading[];
  settings: ThresholdSettings;
}

export const TelemetryChartsSection: React.FC<TelemetryChartsSectionProps> = ({
  history,
  settings,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('5m');
  const [activeTab, setActiveTab] = useState<'all' | 'temp' | 'humidity' | 'pressure' | 'voltage' | 'current'>('all');

  // Filter history points based on selected time window
  // Assuming updates are ~1.5 - 2s
  const filteredData = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    let count = 40; // Default 1m ~30-40 points
    if (timeFilter === '1m') count = 35;
    else if (timeFilter === '5m') count = 80;
    else if (timeFilter === '15m') count = 160;
    else if (timeFilter === '1h') count = 300;

    return history.slice(-count);
  }, [history, timeFilter]);

  // Transform data for each chart
  const tempData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.equipmentTemp,
        value2: d.batteryTemp,
      })),
    [filteredData]
  );

  const humidityData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.humidity,
      })),
    [filteredData]
  );

  const pressureData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.pressure,
      })),
    [filteredData]
  );

  const voltageData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.batteryVoltage,
      })),
    [filteredData]
  );

  const currentData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.batteryCurrent,
      })),
    [filteredData]
  );

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            REAL-TIME TELEMETRY CHARTS
          </h3>
          <span className="hidden md:inline text-xs text-slate-500 font-mono">
            ({filteredData.length} samples buffer)
          </span>
        </div>

        {/* View Tab Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setActiveTab('temp')}
              className={`px-2 py-1 rounded transition-colors ${
                activeTab === 'temp'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setActiveTab('voltage')}
              className={`px-2 py-1 rounded transition-colors ${
                activeTab === 'voltage'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voltage
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`px-2 py-1 rounded transition-colors ${
                activeTab === 'current'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setActiveTab('humidity')}
              className={`px-2 py-1 rounded transition-colors ${
                activeTab === 'humidity'
                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Humidity
            </button>
            <button
              onClick={() => setActiveTab('pressure')}
              className={`px-2 py-1 rounded transition-colors ${
                activeTab === 'pressure'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pressure
            </button>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
            {(['1m', '5m', '15m', '1h'] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-2 py-1 rounded transition-all ${
                  timeFilter === tf
                    ? 'bg-slate-700 text-cyan-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid or Single Chart View */}
      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Temperature Chart (Col span 2 on large for prominence) */}
          <div className="lg:col-span-2">
            <TelemetryChart
              title="Temperature vs Time"
              subtitle="Dual Channel: PT100 RTD & Li-Ion Core"
              unit="°C"
              series1Name="Equipment Temp"
              series1Color="#f43f5e"
              series2Name="Battery Temp"
              series2Color="#38bdf8"
              data={tempData}
              height={230}
              thresholdLine={{
                value: settings.heaterAutoThreshold,
                label: 'Auto Heater Trigger',
                color: '#f59e0b',
              }}
              secondaryThresholdLine={{
                value: settings.minEquipmentTemp,
                label: 'Critical Freeze',
                color: '#ef4444',
              }}
            />
          </div>

          {/* Voltage vs Time */}
          <TelemetryChart
            title="Battery Voltage vs Time"
            subtitle="INA219 High-Side Bus Monitor"
            unit="V"
            series1Name="Bus Voltage"
            series1Color="#10b981"
            data={voltageData}
            height={200}
            thresholdLine={{
              value: settings.minBatteryVoltage,
              label: 'Min LVD Limit',
              color: '#ef4444',
            }}
          />

          {/* Current vs Time */}
          <TelemetryChart
            title="Battery Current vs Time"
            subtitle="Total System & Heater Load"
            unit="A"
            series1Name="Draw Current"
            series1Color="#f59e0b"
            data={currentData}
            height={200}
            thresholdLine={{
              value: settings.maxCurrent,
              label: 'Max Safe Current',
              color: '#ef4444',
            }}
          />

          {/* Humidity vs Time */}
          <TelemetryChart
            title="Humidity vs Time"
            subtitle="BME280 Environmental RH"
            unit="%"
            series1Name="Relative Humidity"
            series1Color="#06b6d4"
            data={humidityData}
            height={200}
            thresholdLine={{
              value: settings.maxHumidity,
              label: 'Condensation Ceiling',
              color: '#f97316',
            }}
          />

          {/* Pressure vs Time */}
          <TelemetryChart
            title="Atmospheric Pressure vs Time"
            subtitle="Hypobaric Barometer (Ladakh Alt)"
            unit="hPa"
            series1Name="Atm Pressure"
            series1Color="#a855f7"
            data={pressureData}
            height={200}
            thresholdLine={{
              value: settings.minPressure,
              label: 'Extreme Low Pressure',
              color: '#ef4444',
            }}
          />
        </div>
      ) : (
        /* Focused Single View with Expanded Height */
        <div>
          {activeTab === 'temp' && (
            <TelemetryChart
              title="Equipment & Battery Temperature vs Time"
              subtitle="Dual Channel RTD & NTC Probe Telemetry"
              unit="°C"
              series1Name="Equipment Temp"
              series1Color="#f43f5e"
              series2Name="Battery Core Temp"
              series2Color="#38bdf8"
              data={tempData}
              height={360}
              thresholdLine={{
                value: settings.heaterAutoThreshold,
                label: 'Auto Heater Active Threshold',
                color: '#f59e0b',
              }}
              secondaryThresholdLine={{
                value: settings.minEquipmentTemp,
                label: 'Critical Freeze Envelope',
                color: '#ef4444',
              }}
            />
          )}
          {activeTab === 'voltage' && (
            <TelemetryChart
              title="Battery Terminal Voltage vs Time"
              subtitle="High-Resolution Discharge Curve"
              unit="V"
              series1Name="Terminal Voltage"
              series1Color="#10b981"
              data={voltageData}
              height={360}
              thresholdLine={{
                value: settings.minBatteryVoltage,
                label: 'Minimum Cutoff Voltage',
                color: '#ef4444',
              }}
            />
          )}
          {activeTab === 'current' && (
            <TelemetryChart
              title="System Battery Current vs Time"
              subtitle="Load Profile: Telemetry + Active PTC Heat Pads"
              unit="A"
              series1Name="Discharge Current"
              series1Color="#f59e0b"
              data={currentData}
              height={360}
              thresholdLine={{
                value: settings.maxCurrent,
                label: 'Maximum Current Rating',
                color: '#ef4444',
              }}
            />
          )}
          {activeTab === 'humidity' && (
            <TelemetryChart
              title="Enclosure Relative Humidity vs Time"
              subtitle="Dew Point & Frost Precipitation Hazard Monitoring"
              unit="%"
              series1Name="Relative Humidity"
              series1Color="#06b6d4"
              data={humidityData}
              height={360}
              thresholdLine={{
                value: settings.maxHumidity,
                label: 'Critical Condensation Threshold',
                color: '#f97316',
              }}
            />
          )}
          {activeTab === 'pressure' && (
            <TelemetryChart
              title="High-Altitude Barometric Pressure vs Time"
              subtitle="Altitude-Correlated Ambient Pressure Telemetry"
              unit="hPa"
              series1Name="Ambient Barometric Pressure"
              series1Color="#a855f7"
              data={pressureData}
              height={360}
              thresholdLine={{
                value: settings.minPressure,
                label: 'Lower Hypobaric Envelope',
                color: '#ef4444',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
