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
} from 'lucide-react';

export const AboutSystemView: React.FC = () => {
  const pipelineSteps = [
    { title: 'Sensor Data', desc: 'PT100, BME280, INA219 acquisition' },
    { title: 'Data Processing', desc: 'Digital filtering & calibration offset' },
    { title: 'Threshold Analysis', desc: 'Comparison against user limits' },
    { title: 'Risk Detection', desc: 'Identify Low/High Temp, Volt, Curr' },
    { title: 'Protection Decision', desc: 'Autonomous safety loop evaluation' },
    { title: 'Heater Control', desc: 'Actuate PTC ceramic heating pads' },
    { title: 'Alert Generation', desc: 'Severity triage & audio dispatch' },
    { title: 'Data Logging', desc: 'Local storage timestamped records' },
    { title: 'Dashboard Display', desc: 'Real-time engineering visualization' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Mission Card */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                PROTOTYPE TELEMETRY SPECIFICATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                Smart India Hackathon / Defence Testbed
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              SMCE: Smart Monitoring &amp; Control Equipment
            </h2>

            <div className="bg-slate-950/80 border-l-4 border-cyan-500 p-4 rounded-r-lg max-w-3xl">
              <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
                SMCE is a smart monitoring and protection system designed to continuously
                monitor environmental and equipment parameters and provide automatic protection
                during extreme high-altitude conditions.
              </p>
            </div>
          </div>

          <div className="shrink-0 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center font-mono">
            <Award className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300 font-bold">SMCE v2.4</div>
            <div className="text-[10px] text-slate-500">Autonomous Testbed</div>
          </div>
        </div>
      </div>

      {/* Logical Architecture Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-mono">
            SYSTEM ARCHITECTURAL PIPELINE
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Deterministic 9-stage telemetry pipeline executing at 1.5-second clock cycles:
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

      {/* Extreme High-Altitude Ladakh Engineering Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why High Altitude & Ladakh */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white font-mono">
              THE LADAKH HIGH-ALTITUDE CHALLENGE
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              In extreme high-altitude regions such as <strong className="text-white">Ladakh, Siachen, and Khardung La (3,500m to 5,500m AMSL)</strong>,
              electronic and electro-mechanical equipment operates under harsh climatic stressors:
            </p>

            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>
                <strong className="text-slate-200">Sub-Zero Temperatures (-30°C to -10°C):</strong> Causes electrolyte crystallization in lithium batteries, spiking internal impedance and triggering severe terminal voltage drop under load.
              </li>
              <li>
                <strong className="text-slate-200">Hypobaric Atmosphere (500–600 hPa):</strong> Low air density reduces convective heat transfer efficiency by ~40%, impairing passive heatsink cooling.
              </li>
              <li>
                <strong className="text-slate-200">Rapid Diurnal Temperature Swings:</strong> Severe day-to-night temperature swings induce frost formation and internal condensation on PCB traces.
              </li>
              <li>
                <strong className="text-slate-200">Autonomous Operation:</strong> Remote border outposts and weather observatories require local automated protection without dependence on external internet connectivity.
              </li>
            </ul>
          </div>
        </div>

        {/* Protection Mechanics */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-mono">
              AUTOMATIC THERMAL &amp; ELECTRICAL DEFENSE
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              The SMCE protection controller maintains the operational thermal envelope through closed-loop hysteresis control:
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5 text-cyan-300">
              <div>IF (Equipment_Temp &lt; Min_Threshold):</div>
              <div className="pl-4 text-rose-300">↳ Actuate PTC Heater Relay = ON</div>
              <div className="pl-4 text-amber-300">↳ Assert Protection Mode = ACTIVE</div>
              <div className="pl-4 text-slate-300">↳ Emit Critical Alert to Event Log</div>
              <div className="mt-2">IF (Equipment_Temp &gt;= Min_Threshold + Hysteresis):</div>
              <div className="pl-4 text-emerald-300">↳ De-energize PTC Heater Relay = OFF</div>
              <div className="pl-4 text-cyan-300">↳ Restore Protection Mode = NORMAL</div>
            </div>

            <p className="text-slate-400">
              Built-in Low Voltage Disconnect (LVD) and current surge trip logic safeguard the battery bank against deep discharge and short-circuit faults.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware Interface Specifications */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white font-mono">
            HARDWARE SPECIFICATIONS &amp; SENSOR CHANNELS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-cyan-400 font-bold">CH-1: PT100 RTD</div>
            <div className="text-slate-400 mt-1">Class A 4-wire platinum resistance probe for -50°C to +150°C equipment thermal sensing.</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-sky-400 font-bold">CH-2: NTC Thermistor</div>
            <div className="text-slate-400 mt-1">10kΩ 3950 beta probe embedded in LiFePO4 / Li-ion battery core to guard against freezing damage.</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-emerald-400 font-bold">CH-3 &amp; 4: BME280</div>
            <div className="text-slate-400 mt-1">Digital humidity (% RH) &amp; barometric pressure (300 to 1100 hPa) with high-altitude altitude compensation.</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-amber-400 font-bold">CH-5 &amp; 6: INA219</div>
            <div className="text-slate-400 mt-1">0.1Ω shunt precision high-side voltage (0-26V) and current (0-3.2A) monitor with 12-bit ADC.</div>
          </div>
        </div>
      </div>

      {/* Demonstration Instructions for SIH / Exhibition */}
      <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-5 space-y-3 font-mono text-xs">
        <div className="text-cyan-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          PROTOTYPE DEMONSTRATION INSTRUCTIONS (EXHIBITION / EVALUATION):
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li><strong>Autonomous Heater Trigger:</strong> Click the preset <em>"Ladakh Blizzard (-26°C)"</em> in the simulation bar. Observe equipment temperature dropping below the auto threshold (-15°C), the Heater status immediately turning ON, the system status becoming PROTECTION ACTIVE, and a critical alert firing.</li>
          <li><strong>Thermal Recovery:</strong> Watch as the simulated heater slowly warms the equipment back above -12°C. The heater will automatically shut OFF, returning to NORMAL status.</li>
          <li><strong>Threshold Customization:</strong> Navigate to <em>Settings</em>, change the Minimum Temperature or Heater Auto Threshold, save, and witness the risk engine re-evaluating in real-time.</li>
          <li><strong>Data Logging &amp; CSV:</strong> Go to <em>Data Logs</em> to search live recorded telemetry packets and click <em>Export CSV</em> to verify full local telemetry storage.</li>
        </ol>
      </div>
    </div>
  );
};
