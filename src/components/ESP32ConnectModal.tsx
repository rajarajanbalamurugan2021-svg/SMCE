import React, { useState } from 'react';
import { BluetoothConnectionStatus } from '../services/bluetoothManager';
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
  Layers,
  Sparkles,
  Terminal,
  FileCode,
  Zap,
} from 'lucide-react';

interface ESP32ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BluetoothConnectionStatus;
  errorMessage?: string;
  deviceName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectSimulated?: () => void;
  lastPacket?: any;
}

export const ESP32ConnectModal: React.FC<ESP32ConnectModalProps> = ({
  isOpen,
  onClose,
  status,
  errorMessage,
  deviceName,
  onConnect,
  onDisconnect,
  onConnectSimulated,
  lastPacket,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'code' | 'wiring'>('connect');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWiring, setCopiedWiring] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bluetooth className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                ESP32 BLUETOOTH HARDWARE LINK
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  Web BLE API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect physical ESP32 microcontroller with real sensors to SMCE dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'connect'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live BLE Connection
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Arduino ESP32 Code (.ino)
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'wiring'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Circuit &amp; Sensor Pinout
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Live Connection */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      status === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                        : status === 'CONNECTING'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {status === 'CONNECTED' ? (
                      <BluetoothConnected className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Bluetooth className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono text-slate-400">Link Status:</span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          status === 'CONNECTED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : status === 'CONNECTING'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white font-mono mt-0.5">
                      {status === 'CONNECTED'
                        ? `Connected: ${deviceName || 'SMCE_LADAKH_ESP32'}`
                        : 'No Hardware Paired via Bluetooth'}
                    </div>
                  </div>
                </div>

                {/* Connect / Disconnect Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {status === 'CONNECTED' ? (
                    <button
                      onClick={onDisconnect}
                      className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-rose-600/80 hover:bg-rose-600 text-white shadow-md transition-all flex items-center gap-2"
                    >
                      <BluetoothOff className="w-4 h-4" />
                      Disconnect ESP32
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onConnect}
                        disabled={status === 'CONNECTING'}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Search for physical ESP32 via browser Web Bluetooth"
                      >
                        <Bluetooth className="w-4 h-4" />
                        {status === 'CONNECTING' ? 'Pairing ESP32...' : 'Pair & Connect ESP32'}
                      </button>

                      {onConnectSimulated && (
                        <button
                          onClick={onConnectSimulated}
                          className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
                          title="Simulates live ESP32 serial packet protocol when in an iframe or testing without hardware"
                        >
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          Virtual ESP32 Link
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs font-mono space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-300">Connection Notice: </span>
                      {errorMessage}
                    </div>
                  </div>
                  {errorMessage.toLowerCase().includes('permissions policy') && onConnectSimulated && (
                    <div className="pt-2 border-t border-rose-900/50 flex items-center justify-between gap-2">
                      <span className="text-slate-300 text-[11px]">
                        💡 Preview iframes block browser Web Bluetooth. You can run full live ESP32 telemetry with the Virtual Hardware Link:
                      </span>
                      <button
                        onClick={onConnectSimulated}
                        className="shrink-0 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all"
                      >
                        Start Virtual ESP32 Stream
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* How it works instructions */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="text-blue-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  HOW TO CONNECT YOUR PHYSICAL HARDWARE:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>
                    Flash the provided Arduino code to your <strong className="text-white">ESP32 Development Board</strong>.
                  </li>
                  <li>
                    Wire the <strong className="text-slate-200">BME280</strong> (I2C 21/22), <strong className="text-slate-200">INA219</strong>, <strong className="text-slate-200">PT100/NTC</strong>, and <strong className="text-slate-200">Relay</strong> (GPIO 25).
                  </li>
                  <li>
                    Click <strong className="text-blue-400">"Pair &amp; Connect ESP32"</strong> above.
                  </li>
                  <li>
                    Your browser will open the native Bluetooth device selector. Select <strong className="text-white">"SMCE_LADAKH_ESP32"</strong> and click <em>Pair</em>.
                  </li>
                  <li>
                    The dashboard will switch seamlessly from software simulation to live sensor streams from your real hardware!
                  </li>
                </ol>
              </div>

              {/* Live Packet Diagnostic */}
              {lastPacket && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase">Latest Real-Time BLE Packet Decoded:</div>
                  <div className="text-emerald-400">
                    EqTemp: {lastPacket.eqTemp}°C | BatTemp: {lastPacket.batTemp}°C | Hum: {lastPacket.humidity}% | Press: {lastPacket.pressure} hPa | Volt: {lastPacket.voltage}V | Curr: {lastPacket.current}A | Heater: {lastPacket.heater}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Arduino Code */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Ready-to-upload Arduino C++ sketch with BLE GATT server and JSON serializer
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadIno}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .ino
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 selection:bg-blue-500 selection:text-white">
                <pre>{ESP32_ARDUINO_CODE}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: Wiring Pinout */}
          {activeTab === 'wiring' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Comprehensive ESP32 high-altitude sensor interface pinout
                </span>
                <button
                  onClick={handleCopyWiring}
                  className="px-2.5 py-1 text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1"
                >
                  {copiedWiring ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWiring ? 'Copied!' : 'Copy Wiring Guide'}
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 max-h-96 overflow-y-auto font-mono text-xs text-cyan-300 leading-relaxed">
                <pre>{ESP32_CIRCUIT_DIAGRAM_TEXT}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-500">
          <div>Supports standard ESP32 (WROOM-32, ESP32-S3) via Web Bluetooth</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
