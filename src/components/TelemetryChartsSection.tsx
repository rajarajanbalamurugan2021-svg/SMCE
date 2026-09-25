import React, { useState } from 'react';
import { TelemetryChart, DataPoint } from './TelemetryChart';
import { ThresholdSettings, SensorReading } from '../types/smce';
import { Clock, Sliders, Maximize2, Activity, Flame } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<
    'all' | 'temp' | 'pwm' | 'voltage' | 'current' | 'pressure' | 'humidity'
  >('all');

  // Filter history points based on selected time window
  const filteredData = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    let count = 40; // Default 1m ~30-40 points
    if (timeFilter === '1m') count = 35;
    else if (timeFilter === '5m') count = 80;
    else if (timeFilter === '15m') count = 160;
    else if (timeFilter === '1h') count = 300;

    return history.slice(-count);
  }, [history, timeFilter]);

  // 1. Temperature & Predicted Temperature Data
  const tempData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.equipmentTemp,
        value2: d.predictedTemp ?? Number((d.equipmentTemp + (d.tempRateOfChange ?? 0) * 3).toFixed(1)),
      })),
    [filteredData]
  );

  // 2. Heater PWM % Data
  const pwmData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.heaterPwm !== undefined ? d.heaterPwm : d.heaterState === 'ON' ? 100 : 0,
      })),
    [filteredData]
  );

  // 3. Battery Voltage Data
  const voltageData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.batteryVoltage,
      })),
    [filteredData]
  );

  // 4. Battery Current Data
  const currentData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.batteryCurrent,
      })),
    [filteredData]
  );

  // 5. Atmospheric Pressure Data
  const pressureData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.pressure,
      })),
    [filteredData]
  );

  // 6. Humidity Data
  const humidityData: DataPoint[] = React.useMemo(
    () =>
      filteredData.map((d) => ({
        timestamp: d.timestamp,
        displayTime: d.displayTime,
        value: d.humidity,
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
            ({filteredData.length} samples buffer • 6 Channels)
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
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'temp'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Temp &amp; Pred
            </button>
            <button
              onClick={() => setActiveTab('pwm')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'pwm'
                  ? 'bg-orange-500/20 text-orange-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Heater PWM
            </button>
            <button
              onClick={() => setActiveTab('voltage')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'voltage'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voltage
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'current'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setActiveTab('pressure')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'pressure'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pressure
            </button>
            <button
              onClick={() => setActiveTab('humidity')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'humidity'
                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Humidity
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
          {/* Temperature & Predicted Temperature (Col span 2 on large for prominence) */}
          <div className="lg:col-span-2">
            <TelemetryChart
              title="Temperature vs Predicted Temperature"
              subtitle="Current Telemetry & 5-Min Extrapolated Projection (Dual Curve)"
              unit="°C"
              series1Name="Current Equipment Temp"
              series1Color="#f43f5e"
              series2Name="Predicted Temp (5m Horizon)"
              series2Color="#c084fc"
              data={tempData}
              height={230}
              thresholdLine={{
                value: settings.heaterAutoThreshold,
                label: `Auto Threshold (${settings.heaterAutoThreshold}°C)`,
                color: '#f59e0b',
              }}
              secondaryThresholdLine={{
                value: settings.minEquipmentTemp,
                label: `Freeze Cutoff (${settings.minEquipmentTemp}°C)`,
                color: '#ef4444',
              }}
            />
          </div>

          {/* Heater PWM % Duty Cycle */}
          <TelemetryChart
            title="Adaptive Heater PWM Duty Cycle"
            subtitle="Modulated 0–100% Closed-Loop Power Dissipation"
            unit="%"
            series1Name="Heater PWM Level"
            series1Color="#f97316"
            data={pwmData}
            height={200}
            thresholdLine={{
              value: 70,
              label: 'High Power Band (70%)',
              color: '#ef4444',
            }}
          />

          {/* Voltage vs Time */}
          <TelemetryChart
            title="Battery Voltage vs Time"
            subtitle="INA219 High-Side Power Bus"
            unit="V"
            series1Name="Pack Voltage"
            series1Color="#10b981"
            data={voltageData}
            height={200}
            thresholdLine={{
              value: settings.minBatteryVoltage,
              label: `LVD Cutoff (${settings.minBatteryVoltage}V)`,
              color: '#ef4444',
            }}
          />

          {/* Current vs Time */}
          <TelemetryChart
            title="Battery Current Draw vs Time"
            subtitle="Load Current including PTC Element & Microcontroller"
            unit="A"
            series1Name="Current Draw"
            series1Color="#fbbf24"
            data={currentData}
            height={200}
            thresholdLine={{
              value: settings.maxCurrent,
              label: `Trip Current (${settings.maxCurrent}A)`,
              color: '#ef4444',
            }}
          />

          {/* Atmospheric Pressure vs Time */}
          <TelemetryChart
            title="Atmospheric Pressure vs Time"
            subtitle="BME280 Ladakh Hypobaric Altitude Monitor"
            unit="hPa"
            series1Name="Atmospheric Pressure"
            series1Color="#a855f7"
            data={pressureData}
            height={200}
            thresholdLine={{
              value: settings.minPressure,
              label: `Min Altitude Limit (${settings.minPressure} hPa)`,
              color: '#ef4444',
            }}
          />

          {/* Humidity vs Time */}
          <div className="lg:col-span-2">
            <TelemetryChart
              title="Relative Humidity vs Time"
              subtitle="BME280 Internal Enclosure Moisture Level"
              unit="%"
              series1Name="Relative Humidity"
              series1Color="#38bdf8"
              data={humidityData}
              height={190}
              thresholdLine={{
                value: settings.maxHumidity,
                label: `Condensation Risk Limit (${settings.maxHumidity}%)`,
                color: '#f43f5e',
              }}
            />
          </div>
        </div>
      ) : activeTab === 'temp' ? (
        <TelemetryChart
          title="High-Resolution Temperature & Predictive Trajectory"
          subtitle="Dual Overlay: PT100 RTD Hardware Temp vs Predictive Kinematic Model"
          unit="°C"
          series1Name="Equipment Core Temp"
          series1Color="#f43f5e"
          series2Name="Predicted Temp (5m Horizon)"
          series2Color="#c084fc"
          data={tempData}
          height={380}
          thresholdLine={{
            value: settings.heaterAutoThreshold,
            label: `Auto Heater Engage (${settings.heaterAutoThreshold}°C)`,
            color: '#f59e0b',
          }}
          secondaryThresholdLine={{
            value: settings.minEquipmentTemp,
            label: `Critical Low Freeze (${settings.minEquipmentTemp}°C)`,
            color: '#ef4444',
          }}
        />
      ) : activeTab === 'pwm' ? (
        <TelemetryChart
          title="Heater Software PWM Modulation Curve"
          subtitle="Dynamic 0 - 100% Duty Cycle modulated by rate of change and battery health"
          unit="%"
          series1Name="PWM Duty Cycle"
          series1Color="#f97316"
          data={pwmData}
          height={380}
          thresholdLine={{
            value: 70,
            label: 'High Output Threshold (70%)',
            color: '#ef4444',
          }}
        />
      ) : activeTab === 'voltage' ? (
        <TelemetryChart
          title="Battery Bus Voltage Stream"
          subtitle="Telemetry Bus terminal voltage with Low Voltage Disconnect boundary"
          unit="V"
          series1Name="Battery Voltage"
          series1Color="#10b981"
          data={voltageData}
          height={380}
          thresholdLine={{
            value: settings.minBatteryVoltage,
            label: `LVD Cutoff (${settings.minBatteryVoltage}V)`,
            color: '#ef4444',
          }}
        />
      ) : activeTab === 'current' ? (
        <TelemetryChart
          title="Electrical Current Dissipation Stream"
          subtitle="Dynamic load profile of electronics and heating element array"
          unit="A"
          series1Name="Current"
          series1Color="#fbbf24"
          data={currentData}
          height={380}
          thresholdLine={{
            value: settings.maxCurrent,
            label: `Trip Current (${settings.maxCurrent}A)`,
            color: '#ef4444',
          }}
        />
      ) : activeTab === 'pressure' ? (
        <TelemetryChart
          title="High-Altitude Barometric Pressure"
          subtitle="BME280 Sensor in Ladakh hypobaric alpine profile (~4,500m AMSL)"
          unit="hPa"
          series1Name="Pressure"
          series1Color="#a855f7"
          data={pressureData}
          height={380}
          thresholdLine={{
            value: settings.minPressure,
            label: `Min Altitude Boundary (${settings.minPressure} hPa)`,
            color: '#ef4444',
          }}
        />
      ) : (
        <TelemetryChart
          title="Internal Relative Humidity Analysis"
          subtitle="Enclosure seal integrity and desiccator monitoring"
          unit="%"
          series1Name="Humidity"
          series1Color="#38bdf8"
          data={humidityData}
          height={380}
          thresholdLine={{
            value: settings.maxHumidity,
            label: `Max Humidity Boundary (${settings.maxHumidity}%)`,
            color: '#f43f5e',
          }}
        />
      )}
    </div>
  );
};
