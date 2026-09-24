import React, { useState } from 'react';
import { BluetoothConnectionStatus, bleManager } from '../services/bluetoothManager';
import { ESP32_ARDUINO_CODE, ESP32_CIRCUIT_DIAGRAM_TEXT } from '../services/esp32Firmware';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Cpu,
  Copy,
  Check,
  Download,
  AlertCircle,
  Radio,
  Zap,
  Code,
  FileCode,
  Sparkles,
  Layers,
  Thermometer,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface ESP32HardwareViewProps {
  status: BluetoothConnectionStatus;
  errorMessage?: string;
  deviceName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectSimulated?: () => void;
  lastPacket?: any;
  onSendHeaterCommand: (cmd: 'HEATER_ON' | 'HEATER_OFF' | 'HEATER_AUTO') => void;
}

export const ESP32HardwareView: React.FC<ESP32HardwareViewProps> = ({
  status,
  errorMessage,
  deviceName,
  onConnect,
  onDisconnect,
  onConnectSimulated,
  lastPacket,
  onSendHeaterCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'wiring'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWiring, setCopiedWiring] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ESP32_ARDUINO_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyWiring = () => {
    navigator.clipboard.writeText(ESP32_CIRCUIT_DIAGRAM_TEXT);
    setCopiedWiring(true);
    setTimeout(() => setCopiedWiring(false), 2500);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([ESP32_ARDUINO_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SMCE_ESP32_BLE_Firmware.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Bluetooth className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white font-mono">
                ESP32 BLUETOOTH HARDWARE BRIDGE
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-950 text-blue-300 border border-blue-800">
                Web BLE 5.0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Wirelessly link your physical ESP32 microcontroller and high-altitude sensor bank
              (BME280, INA219, PT100 RTD, NTC Thermistor, and Relay) directly into this monitoring dashboard.
            </p>
          </div>
        </div>

        {/* Big Connection Action */}
        <div className="shrink-0 flex flex-wrap items-center gap-3">
          {status === 'CONNECTED' ? (
            <button
              onClick={onDisconnect}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white shadow-lg transition-all flex items-center gap-2"
            >
              <BluetoothOff className="w-4 h-4" />
              Disconnect ESP32
            </button>
          ) : status === 'RECONNECTING' ? (
            <>
              <button
                onClick={() => bleManager.retryReconnectNow()}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
              >
                <Bluetooth className="w-4 h-4 animate-spin" />
                Retry Reconnect Now
              </button>
              <button
                onClick={() => bleManager.cancelReconnect()}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              >
                Cancel Reconnect
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onConnect}
                disabled={status === 'CONNECTING'}
                className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Bluetooth className="w-4 h-4" />
                {status === 'CONNECTING' ? 'Pairing ESP32...' : 'Pair Real ESP32'}
              </button>

              {onConnectSimulated && (
                <button
                  onClick={onConnectSimulated}
                  className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Virtual ESP32 Link
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          Hardware Link &amp; Remote Control
        </button>

        <button
          onClick={() => setActiveTab('wiring')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'wiring'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Sensor Circuit &amp; Pinout
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`pb-3 px-4 border-b-2 font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          ESP32 Arduino Firmware (.ino)
        </button>
      </div>

      {/* TAB 1: Overview & Controls */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  status === 'CONNECTED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : status === 'RECONNECTING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {status === 'CONNECTED' ? (
                  <BluetoothConnected className="w-5 h-5 text-emerald-400" />
                ) : status === 'RECONNECTING' ? (
                  <Bluetooth className="w-5 h-5 text-amber-400 animate-spin" />
                ) : (
                  <Bluetooth className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Bluetooth GATT Link</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  {status === 'CONNECTED'
                    ? 'ACTIVE & STREAMING'
                    : status === 'RECONNECTING'
                    ? 'AUTO-RECONNECTING'
                    : status}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Paired Device ID</div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  {status === 'CONNECTED' ? deviceName || 'SMCE_LADAKH_ESP32' : 'None (Ready to Pair)'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Telemetry Transport</div>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {status === 'CONNECTED' ? 'Live Physical Sensors' : 'Simulated Testbed'}
                </div>
              </div>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-200">Bluetooth Operation Notice:</strong>
                  {errorMessage}
                </div>
              </div>
              {errorMessage.toLowerCase().includes('permissions policy') && onConnectSimulated && (
                <div className="pt-2 border-t border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-slate-300 text-[11px]">
                    Note: Embedded iframes restrict native Web Bluetooth device popups. Click below to launch the ESP32 hardware protocol streamer:
                  </span>
                  <button
                    onClick={onConnectSimulated}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shrink-0"
                  >
                    Activate Virtual ESP32 Hardware Stream
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hardware Remote Control for Heater Relay */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  ESP32 RELAY &amp; HEATER REMOTE DISPATCH
                </h3>
                <p className="text-xs text-slate-400">
                  Send wireless Bluetooth UART commands to GPIO 25 on the ESP32 board
                </p>
              </div>

              {/* 3 Buttons */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => onSendHeaterCommand('HEATER_ON')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow"
                >
                  Force Relay ON
                </button>
                <button
                  onClick={() => onSendHeaterCommand('HEATER_OFF')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all"
                >
                  Force Relay OFF
                </button>
                <button
                  onClick={() => onSendHeaterCommand('HEATER_AUTO')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow"
                >
                  Resume AUTO Mode
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Hardware Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="text-blue-400 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                HOW TO CONNECT ESP32 IN 4 STEPS:
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>
                  <strong>Open Arduino IDE</strong> and install libraries:
                  <code className="block bg-slate-950 p-1.5 rounded text-cyan-300 text-[11px] my-1">
                    Adafruit BME280, Adafruit INA219, ArduinoJson
                  </code>
                </li>
                <li>
                  <strong>Copy the Firmware</strong> from the <em>"ESP32 Arduino Firmware"</em> tab and upload it to your board.
                </li>
                <li>
                  Open the Serial Monitor at <strong>115200 baud</strong>. The ESP32 will display:
                  <code className="block bg-slate-950 p-1.5 rounded text-emerald-400 text-[11px] my-1">
                    [BLE] Device Ready &amp; Advertising as 'SMCE_LADAKH_ESP32'
                  </code>
                </li>
                <li>
                  Click the blue <strong>"Pair &amp; Connect ESP32"</strong> button above. Select <em>SMCE_LADAKH_ESP32</em> in the browser prompt.
                </li>
              </ol>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                WHAT SENSORS CONNECT TO ESP32?
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">●</span>
                  <span><strong>BME280 (I2C 21/22):</strong> Atmospheric pressure (altitude test) and relative humidity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">●</span>
                  <span><strong>INA219 (I2C 21/22):</strong> Real battery bank voltage and PTC heater current draw.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">●</span>
                  <span><strong>PT100 RTD Probe:</strong> Measures extreme sub-zero equipment case temperatures down to -50°C.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">●</span>
                  <span><strong>Relay Module (GPIO 25):</strong> Solid-state switch powering the ceramic heating pad.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Diagnostic Raw Stream */}
          {lastPacket && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span>LIVE TELEMETRY PACKET DECODED OVER BLUETOOTH</span>
                <span className="text-emerald-400">✓ Checksum OK</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-slate-200">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Eq Temp</span>
                  <span className="font-bold text-rose-400">{lastPacket.eqTemp} °C</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Bat Temp</span>
                  <span className="font-bold text-sky-400">{lastPacket.batTemp} °C</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Humidity</span>
                  <span className="font-bold text-cyan-400">{lastPacket.humidity} %</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Pressure</span>
                  <span className="font-bold text-purple-400">{lastPacket.pressure} hPa</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Voltage</span>
                  <span className="font-bold text-emerald-400">{lastPacket.voltage} V</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Current</span>
                  <span className="font-bold text-amber-400">{lastPacket.current} A</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Heater</span>
                  <span className="font-bold text-white">{lastPacket.heater}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Sensor Wiring */}
      {activeTab === 'wiring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Schematic Pinout Diagram for connecting all sensors to ESP32:
            </span>
            <button
              onClick={handleCopyWiring}
              className="px-3 py-1.5 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5"
            >
              {copiedWiring ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWiring ? 'Copied Wiring Guide!' : 'Copy Wiring Guide'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
            <pre>{ESP32_CIRCUIT_DIAGRAM_TEXT}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: Arduino Code */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Complete Arduino C++ sketch with BLE server and sensor acquisition:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadIno}
                className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download .ino File
              </button>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied Code!' : 'Copy Arduino Code'}
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 selection:bg-blue-500 selection:text-white">
            <pre>{ESP32_ARDUINO_CODE}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
