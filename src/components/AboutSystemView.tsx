import React from 'react';
import {
  Info,
  Shield,
  Cpu,
  Layers,
  Flame,
  Zap,
  MapPin,
  CheckCircle2,
  Workflow,
  Radio,
  FileCode,
  Award,
  Sparkles,
  TrendingDown,
  Wrench,
  Droplets,
  HeartPulse,
} from 'lucide-react';

export const AboutSystemView: React.FC = () => {
  const mahapsFeatures = [
    {
      title: 'Predictive Thermal Management',
      icon: TrendingDown,
      desc: 'Replaces crude reactive On/Off logic with continuous rate-of-change (dT/dt) analysis. Forecasts temperature 5–10 minutes ahead and initiates gradual pre-heating before critical freeze thresholds are breached.',
    },
    {
      title: 'Adaptive Software PWM Heater Control',
      icon: Flame,
      desc: 'Dynamically modulates PTC heating power from 0% to 100% duty cycle. Moderates thermal dissipation according to cooling velocity, preventing wasteful battery drain in sub-zero alpine conditions.',
    },
    {
      title: 'Self-Learning Thermal Response',
      icon: Sparkles,
      desc: 'Tracks thermal rise per watt-second and time taken to heat. Uses recursive learning multipliers (1.0x–1.35x) to automatically compensate for enclosure insulation wear or severe external wind chill.',
    },
    {
      title: 'Intelligent Fault & Failure Detection',
      icon: Wrench,
      desc: 'Heuristic diagnostic detector: if heater is driven with high PWM but temperature stagnates or drops, flags "THERMAL FAULT DETECTED". Also flags probe disconnects, low voltage, and fan stall.',
    },
    {
      title: 'Battery-Aware Thermal Control',
      icon: Zap,
      desc: 'Monitors Li-ion cell impedance and voltage droop. Throttles heater PWM if battery drops below threshold, striking an optimal balance between thermal survival and mission power longevity.',
    },
    {
      title: 'Hypobaric Environmental & Condensation Analysis',
      icon: Droplets,
      desc: 'Applies Magnus-Tetens formula to compute dew point margin in real time. Analyzes BME280 barometric pressure (60–70 kPa Ladakh standard) to adjust for reduced convective cooling in thin air.',
    },
    {
      title: 'System Health Score Composite (0–100%)',
      icon: HeartPulse,
      desc: 'Weighted multi-pillar algorithm scoring temperature safety, battery integrity, sensor consistency, environmental pressure, and heater response into a single real-time health indicator.',
    },
    {
      title: 'ESP32 Hardware & Wi-Fi/BLE Ready',
      icon: Radio,
      desc: 'Decoupled API contracts for BME280, DS18B20 1-Wire, and INA219 I2C sensors over Web Bluetooth and Wi-Fi REST/WebSocket protocols without altering UI rendering logic.',
    },
  ];

  const pipelineSteps = [
    { title: '1. SENSE', desc: 'BME280, DS18B20, INA219 acquisition' },
    { title: '2. FILTER', desc: 'Digital smoothing & hysteresis bounds' },
    { title: '3. ANALYSE', desc: 'Dew point, thin air factor, battery SOC' },
    { title: '4. PREDICT', desc: 'dT/dt extrapolation & 5m horizon' },
    { title: '5. DIAGNOSE', desc: 'Heuristic failure & stall detection' },
    { title: '6. ADAPT', desc: 'Software PWM duty cycle calculation' },
    { title: '7. PROTECT', desc: 'Hardware interlocks & LVD cutoff' },
    { title: '8. LOG & CLOUD', desc: 'Firestore persistence & local ring buffer' },
    { title: '9. VISUALIZE', desc: 'High-res engineering telemetry dashboard' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Mission Card */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                SIH 26049 PROTOTYPE SPECIFICATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                Defence &amp; High-Altitude Electronic Testbed (Ladakh, 4,500m+)
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
              MAHAPS: Modular Adaptive High-Altitude Protection System
            </h2>

            <div className="bg-slate-950/80 border-l-4 border-cyan-500 p-4 rounded-r-lg max-w-3xl">
              <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
                MAHAPS is an advanced adaptive thermal and power protection module engineered for high-altitude electronic equipment.
                Rather than reacting only after freezing occurs, MAHAPS predicts thermal deterioration and adaptively controls heating, cooling, and power allocation based on environmental trends and equipment condition.
              </p>
            </div>
          </div>

          <div className="shrink-0 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center font-mono">
            <Award className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300 font-bold">MAHAPS v3.0</div>
            <div className="text-[10px] text-cyan-400">SIH 26049 Ready</div>
          </div>
        </div>
      </div>

      {/* Novelty Architecture Pipeline Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-mono">
            MAHAPS INTELLIGENT PROTECTION PIPELINE (9 STAGES)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Deterministic closed-loop telemetry pipeline executing at 1.5-second clock cycles:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 pt-2">
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center flex flex-col justify-between hover:border-cyan-500/50 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center mx-auto mb-1">
                {idx + 1}
              </div>
              <div className="text-[11px] font-bold text-slate-200 font-mono leading-tight">
                {step.title}
              </div>
              <div className="text-[9px] text-slate-500 mt-1 line-clamp-2">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core MAHAPS Features Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-mono">
            ADVANCED ARCHITECTURAL CAPABILITIES
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mahapsFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center gap-2.5 text-cyan-400 mb-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 font-mono">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extreme High-Altitude Ladakh Engineering Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why High Altitude & Ladakh */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono">
            <MapPin className="w-5 h-5" />
            <h4 className="text-sm font-bold text-white uppercase">
              The Ladakh High-Altitude Challenge
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Ladakh passes (Khardung La, Nyoma, Daulat Beg Oldi) at altitudes exceeding 4,500m to 5,300m AMSL, electronics confront harsh simultaneous stress:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 font-mono list-disc pl-4">
            <li>
              <strong className="text-slate-100">Thin Air Convection Penalty:</strong> Atmospheric pressure drops to 500–650 hPa (~60 kPa). Air density reduction cuts convective heat transfer by ~40%, causing uneven hot-spots and rapid radiative freeze.
            </li>
            <li>
              <strong className="text-slate-100">Severe Sub-Zero Freeze:</strong> Winter temperatures plunge below -35°C, causing lithium electrolyte crystallization, internal resistance spikes, and crystal oscillator drift.
            </li>
            <li>
              <strong className="text-slate-100">Dielectric Breakdown (Paschen Law):</strong> Hypobaric air exhibits lowered breakdown voltage, accelerating corona discharge and arc risk in high-voltage avionics.
            </li>
            <li>
              <strong className="text-slate-100">Condensation Inversion:</strong> Dawn/dusk thermal inversions cause internal moisture sublimation, frosting bare copper traces.
            </li>
          </ul>
        </div>

        {/* How to Connect ESP32 Hardware */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono">
            <Radio className="w-5 h-5" />
            <h4 className="text-sm font-bold text-white uppercase">
              ESP32 Hardware Integration Guide
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The MAHAPS web interface includes a production-grade Web Bluetooth Low Energy (BLE) stack and REST/WebSocket API endpoints:
          </p>
          <ol className="text-xs text-slate-300 space-y-2 font-mono list-decimal pl-4">
            <li>
              <strong className="text-cyan-300">Connect Sensors to ESP32:</strong>
              <div className="text-[11px] text-slate-400 mt-0.5">
                • DS18B20 / PT100 Core Probe: GPIO 4 (OneWire)<br />
                • BME280 (Temp, Humidity, Pressure): I2C SDA (GPIO 21), SCL (GPIO 22)<br />
                • INA219 (Voltage, Current): I2C (Address 0x40)<br />
                • PTC Heating Element: GPIO 25 via MOSFET / PWM Driver<br />
                • Ventilation Fan: GPIO 26 via PWM Driver
              </div>
            </li>
            <li>
              <strong className="text-cyan-300">Pair via Bluetooth:</strong> Click the "ESP32 BLE" button in the header or sidebar to pair your microcontroller directly with this dashboard using standard Web Bluetooth.
            </li>
            <li>
              <strong className="text-cyan-300">Wi-Fi / Cloud Proxy:</strong> Firmware can also POST JSON telemetry packets to <code className="text-cyan-400">/api/telemetry</code> for remote telemetry over Satellite or 4G LTE.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
