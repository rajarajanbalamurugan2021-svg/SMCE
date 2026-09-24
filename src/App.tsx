import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SensorReading,
  ThresholdSettings,
  SystemStatus,
  HeaterMode,
  ProtectionControlState,
  AlertItem,
  LogEntry,
  RiskAssessment,
} from './types/smce';
import {
  DEFAULT_THRESHOLDS,
  loadThresholdSettings,
  saveThresholdSettings,
  loadStoredLogs,
  saveStoredLogs,
  loadStoredAlerts,
  saveStoredAlerts,
} from './services/storage';
import { evaluateRisks, evaluateProtectionLogic } from './services/riskEngine';
import {
  SimulationState,
  INITIAL_SIM_STATE,
  stepSimulation,
  generateSeedHistory,
  PresetScenario,
} from './services/simulator';

// Components
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { SystemStatusHero } from './components/SystemStatusHero';
import { SensorCards } from './components/SensorCards';
import { ProtectionPanel } from './components/ProtectionPanel';
import { RiskDetectionPanel } from './components/RiskDetectionPanel';
import { TelemetryChartsSection } from './components/TelemetryChartsSection';
import { AlertsPanel } from './components/AlertsPanel';
import { DataLogView } from './components/DataLogView';
import { SimulationControls } from './components/SimulationControls';
import { SettingsView } from './components/SettingsView';
import { AboutSystemView } from './components/AboutSystemView';
import { ESP32HardwareView } from './components/ESP32HardwareView';
import { ESP32ConnectModal } from './components/ESP32ConnectModal';
import { bleManager, BluetoothConnectionStatus, ESP32TelemetryPacket } from './services/bluetoothManager';
import { Menu, Activity, ShieldCheck, Flame, Radio, Bluetooth } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Configuration Settings State
  const [settings, setSettings] = useState<ThresholdSettings>(() => loadThresholdSettings());

  // Connection State
  const [isOnline, setIsOnline] = useState(true);
  const [packetCount, setPacketCount] = useState(1420);
  const [uptimeSeconds, setUptimeSeconds] = useState(3840);

  // Simulation State
  const [simState, setSimState] = useState<SimulationState>(INITIAL_SIM_STATE);

  // Bluetooth ESP32 Hardware State
  const [bleStatus, setBleStatus] = useState<BluetoothConnectionStatus>('DISCONNECTED');
  const [bleErrorMessage, setBleErrorMessage] = useState<string | undefined>(undefined);
  const [bleDeviceName, setBleDeviceName] = useState<string | undefined>(undefined);
  const [isBleModalOpen, setIsBleModalOpen] = useState(false);
  const [lastBlePacket, setLastBlePacket] = useState<ESP32TelemetryPacket | null>(null);

  // Protection Controller State
  const [protection, setProtection] = useState<ProtectionControlState>({
    heaterMode: 'AUTO',
    heaterStatus: 'OFF',
    tempProtection: 'INACTIVE',
    batteryProtection: 'INACTIVE',
    systemProtection: 'INACTIVE',
    lastTriggerReason: 'System operating within safe thermal envelope.',
    heaterPowerWatts: 0,
  });

  // Telemetry History (Last ~300 readings for live charts)
  const [history, setHistory] = useState<SensorReading[]>(() => {
    const seed = generateSeedHistory(45, INITIAL_SIM_STATE);
    return seed.map((s) => ({
      ...s,
      systemStatus: 'NORMAL',
    }));
  });

  // Persistent Logs State
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const stored = loadStoredLogs();
    if (stored && stored.length > 0) return stored;
    // Fallback seed logs from history
    return generateSeedHistory(25, INITIAL_SIM_STATE).map((s, idx) => ({
      id: `seed-log-${idx}`,
      timestamp: s.timestamp,
      displayTime: s.displayTime,
      temperature: s.equipmentTemp,
      batteryTemp: s.batteryTemp,
      humidity: s.humidity,
      pressure: s.pressure,
      voltage: s.batteryVoltage,
      current: s.batteryCurrent,
      heater: s.heaterState,
      status: 'NORMAL' as SystemStatus,
    }));
  });

  // Persistent Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const stored = loadStoredAlerts();
    if (stored && stored.length > 0) return stored;
    return [
      {
        id: 'seed-alert-1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        displayTime: new Date(Date.now() - 300000).toTimeString().split(' ')[0],
        type: 'INFO',
        sensor: 'System Bus',
        value: '3.82 V',
        status: 'NORMAL',
        message: 'SMCE autonomous telemetry stream initialized. High-altitude sensors calibrated.',
        acknowledged: true,
      },
    ];
  });

  // Previous reading for delta calculations
  const [previousReading, setPreviousReading] = useState<SensorReading | undefined>(undefined);

  // Synthesize audio beep for critical alerts if sound enabled
  const playAlertTone = (type: 'CRITICAL' | 'WARNING' | 'PROTECTION') => {
    if (!settings.soundAlertsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'CRITICAL') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'PROTECTION') {
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      // AudioContext may be restricted by browser gesture policies
    }
  };

  // Uptime tick loop
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Register Web Bluetooth callbacks
  useEffect(() => {
    bleManager.setCallbacks(
      (packet: ESP32TelemetryPacket) => {
        setLastBlePacket(packet);
        const now = new Date();
        const displayTime = now.toTimeString().split(' ')[0];
        const isoStr = now.toISOString();

        // Update sim state with real sensor values from ESP32
        setSimState((prev) => ({
          ...prev,
          equipmentTemp: packet.eqTemp,
          batteryTemp: packet.batTemp,
          humidity: packet.humidity,
          pressure: packet.pressure,
          batteryVoltage: packet.voltage,
          batteryCurrent: packet.current,
        }));

        const rawReading = {
          timestamp: isoStr,
          displayTime,
          equipmentTemp: packet.eqTemp,
          batteryTemp: packet.batTemp,
          humidity: packet.humidity,
          pressure: packet.pressure,
          batteryVoltage: packet.voltage,
          batteryCurrent: packet.current,
        };

        // Run through autonomous protection logic
        const { newHeaterState, protectionState, newAlerts: protAlerts } = evaluateProtectionLogic(
          rawReading,
          settings,
          {
            ...protection,
            heaterStatus: packet.heater,
          }
        );
        setProtection(protectionState);

        const assessment = evaluateRisks(rawReading, settings, packet.heater);

        const currentReading: SensorReading = {
          ...rawReading,
          heaterState: packet.heater,
          systemStatus: assessment.overallStatus,
        };

        setHistory((prev) => {
          if (prev.length > 0) setPreviousReading(prev[prev.length - 1]);
          return [...prev, currentReading].slice(-250);
        });

        const newLog: LogEntry = {
          id: `log-ble-${Date.now()}`,
          timestamp: isoStr,
          displayTime,
          temperature: packet.eqTemp,
          batteryTemp: packet.batTemp,
          humidity: packet.humidity,
          pressure: packet.pressure,
          voltage: packet.voltage,
          current: packet.current,
          heater: packet.heater,
          status: assessment.overallStatus,
        };

        setLogs((prev) => {
          const next = [newLog, ...prev.slice(0, 299)];
          saveStoredLogs(next);
          return next;
        });

        if (protAlerts.length > 0) {
          setAlerts((prev) => {
            const next = [...protAlerts, ...prev].slice(0, 100);
            saveStoredAlerts(next);
            return next;
          });
        }

        setPacketCount((p) => p + 1);
      },
      (status: BluetoothConnectionStatus, errorMsg?: string) => {
        setBleStatus(status);
        setBleErrorMessage(errorMsg);
        if (status === 'CONNECTED') {
          setBleDeviceName(bleManager.getConnectedDeviceName());
          // Pause software simulation so hardware sensor values take over directly
          setSimState((prev) => ({ ...prev, enabled: false }));
        } else if (status === 'DISCONNECTED') {
          setBleDeviceName(undefined);
          // Resume simulated stream when hardware is disconnected
          setSimState((prev) => ({ ...prev, enabled: true }));
        } else if (status === 'RECONNECTING') {
          setBleDeviceName(bleManager.getLastDeviceName() || 'ESP32 (Reconnecting)');
        }
      }
    );
  }, [settings, protection]);

  // Main Telemetry & Protection Engine Loop (Software Simulator fallback when not on BLE)
  useEffect(() => {
    if (!isOnline || !simState.enabled || bleStatus === 'CONNECTED') return;

    const timer = setInterval(() => {
      const now = new Date();
      const displayTime = now.toTimeString().split(' ')[0];
      const isoStr = now.toISOString();

      // 1. Step simulation physics forward (taking current heater status into account)
      const nextSim = stepSimulation(simState, protection.heaterStatus === 'ON', settings);
      setSimState(nextSim);

      const rawReading = {
        timestamp: isoStr,
        displayTime,
        equipmentTemp: nextSim.equipmentTemp,
        batteryTemp: nextSim.batteryTemp,
        humidity: nextSim.humidity,
        pressure: nextSim.pressure,
        batteryVoltage: nextSim.batteryVoltage,
        batteryCurrent: nextSim.batteryCurrent,
      };

      // 2. Evaluate Protection Control Decision (Heater ON/OFF, thermal loop)
      const { newHeaterState, protectionState, newAlerts: protAlerts } = evaluateProtectionLogic(
        rawReading,
        settings,
        protection
      );
      setProtection(protectionState);

      // 3. Evaluate Environmental & Equipment Risks
      const assessment = evaluateRisks(rawReading, settings, newHeaterState);

      // 4. Assemble complete sensor reading
      const currentReading: SensorReading = {
        ...rawReading,
        heaterState: newHeaterState,
        systemStatus: assessment.overallStatus,
      };

      // Update previous reading
      setHistory((prev) => {
        if (prev.length > 0) {
          setPreviousReading(prev[prev.length - 1]);
        }
        const updated = [...prev, currentReading];
        return updated.slice(-250); // Keep buffer
      });

      // 5. Append to persistent logs (every 2-3 ticks or on status change)
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: isoStr,
        displayTime,
        temperature: currentReading.equipmentTemp,
        batteryTemp: currentReading.batteryTemp,
        humidity: currentReading.humidity,
        pressure: currentReading.pressure,
        voltage: currentReading.batteryVoltage,
        current: currentReading.batteryCurrent,
        heater: currentReading.heaterState,
        status: currentReading.systemStatus,
      };

      setLogs((prev) => {
        const nextLogs = [newLog, ...prev.slice(0, 299)];
        saveStoredLogs(nextLogs);
        return nextLogs;
      });

      // 6. Check for condition transition alerts
      const incomingAlerts: AlertItem[] = [...protAlerts];

      assessment.conditions.forEach((cond) => {
        if (cond.status === 'CRITICAL') {
          // Check if already recently alerted in last 5 alerts
          const exists = alerts.slice(0, 3).some((a) => a.sensor.includes(cond.name) && a.type === 'CRITICAL');
          if (!exists) {
            incomingAlerts.push({
              id: `crit-${Date.now()}-${cond.id}`,
              timestamp: isoStr,
              displayTime,
              type: 'CRITICAL',
              sensor: cond.name,
              value: `${cond.currentValue.toFixed(1)} ${cond.unit}`,
              status: 'CRITICAL',
              message: cond.description,
              acknowledged: false,
            });
            playAlertTone('CRITICAL');
          }
        }
      });

      if (incomingAlerts.length > 0) {
        setAlerts((prev) => {
          const nextAlerts = [...incomingAlerts, ...prev].slice(0, 100);
          saveStoredAlerts(nextAlerts);
          return nextAlerts;
        });
      }

      setPacketCount((p) => p + 1);
    }, simState.intervalMs);

    return () => clearInterval(timer);
  }, [isOnline, simState, protection, settings, alerts]);

  // Active current reading
  const currentReading: SensorReading = useMemo(() => {
    if (history.length > 0) {
      return history[history.length - 1];
    }
    return {
      timestamp: new Date().toISOString(),
      displayTime: new Date().toTimeString().split(' ')[0],
      equipmentTemp: simState.equipmentTemp,
      batteryTemp: simState.batteryTemp,
      humidity: simState.humidity,
      pressure: simState.pressure,
      batteryVoltage: simState.batteryVoltage,
      batteryCurrent: simState.batteryCurrent,
      heaterState: protection.heaterStatus,
      systemStatus: 'NORMAL',
    };
  }, [history, simState, protection]);

  // Active risk assessment computed against current reading
  const assessment: RiskAssessment = useMemo(() => {
    return evaluateRisks(currentReading, settings, protection.heaterStatus);
  }, [currentReading, settings, protection.heaterStatus]);

  // Overall system status
  const currentSystemStatus: SystemStatus = assessment.overallStatus;

  // Handlers
  const handleSetHeaterMode = (mode: HeaterMode) => {
    let nextStatus: 'ON' | 'OFF' = protection.heaterStatus;
    let reason = protection.lastTriggerReason;

    if (mode === 'ON') {
      nextStatus = 'ON';
      reason = 'Manual Override: Heater forced ON';
      if (bleStatus === 'CONNECTED') {
        bleManager.sendCommand('HEATER_ON');
      }
    } else if (mode === 'OFF') {
      nextStatus = 'OFF';
      reason = 'Manual Override: Heater forced OFF';
      if (bleStatus === 'CONNECTED') {
        bleManager.sendCommand('HEATER_OFF');
      }
    } else {
      reason = 'Autonomous closed-loop mode restored.';
      if (bleStatus === 'CONNECTED') {
        bleManager.sendCommand('HEATER_AUTO');
      }
      if (currentReading.equipmentTemp < settings.heaterAutoThreshold) {
        nextStatus = 'ON';
      } else {
        nextStatus = 'OFF';
      }
    }

    setProtection((prev) => ({
      ...prev,
      heaterMode: mode,
      heaterStatus: nextStatus,
      tempProtection: nextStatus === 'ON' ? 'ACTIVE' : 'INACTIVE',
      lastTriggerReason: reason,
      heaterPowerWatts: nextStatus === 'ON' ? 24.5 : 0.0,
    }));
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    setSimState((prev) => ({
      ...prev,
      equipmentTemp: preset.equipmentTemp,
      batteryTemp: preset.batteryTemp,
      humidity: preset.humidity,
      pressure: preset.pressure,
      batteryVoltage: preset.batteryVoltage,
      batteryCurrent: preset.batteryCurrent,
      ambientColdTemp: preset.ambientColdTemp,
      manualOverrideActive: true,
    }));
  };

  const handleSaveSettings = (newSettings: ThresholdSettings) => {
    setSettings(newSettings);
    saveThresholdSettings(newSettings);
  };

  const handleClearLogs = () => {
    setLogs([]);
    saveStoredLogs([]);
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    saveStoredAlerts([]);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) => {
      const nextAlerts = prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
      saveStoredAlerts(nextAlerts);
      return nextAlerts;
    });
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) => {
      const nextAlerts = prev.map((a) => ({ ...a, acknowledged: true }));
      saveStoredAlerts(nextAlerts);
      return nextAlerts;
    });
  };

  const handleConnectBle = async () => {
    await bleManager.connect();
  };

  const handleConnectSimulatedBle = () => {
    bleManager.connectSimulatedHardware();
  };

  const handleDisconnectBle = async () => {
    await bleManager.disconnect();
  };

  const handleSendHeaterBleCommand = (cmd: 'HEATER_ON' | 'HEATER_OFF' | 'HEATER_AUTO') => {
    if (cmd === 'HEATER_ON') handleSetHeaterMode('ON');
    else if (cmd === 'HEATER_OFF') handleSetHeaterMode('OFF');
    else handleSetHeaterMode('AUTO');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
        simulationEnabled={simState.enabled}
        onToggleSimulation={() => setSimState((prev) => ({ ...prev, enabled: !prev.enabled }))}
        settings={settings}
        onUpdateSettings={handleSaveSettings}
        packetCount={packetCount}
        bleStatus={bleStatus}
        onOpenBleModal={() => setIsBleModalOpen(true)}
        bleDeviceName={bleDeviceName}
      />

      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          systemStatus={currentSystemStatus}
          alertCount={alerts.filter((a) => !a.acknowledged).length}
          isOpenMobile={isMobileMenuOpen}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {/* Mobile Tab Header & Menu Toggle */}
          <div className="flex md:hidden items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-mono"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span>NAVIGATION MENU</span>
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
              {currentTab}
            </span>
          </div>

          {/* Interactive Sensor Simulation & Demonstration Bar (Always Accessible for quick demo) */}
          <SimulationControls
            simState={simState}
            onUpdateSimState={setSimState}
            settings={settings}
            isHeaterOn={protection.heaterStatus === 'ON'}
            onApplyPreset={handleApplyPreset}
          />

          {/* 1. DASHBOARD VIEW (Default: Full Overview) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Central System Status Hero */}
              <SystemStatusHero
                status={currentSystemStatus}
                protection={protection}
                assessment={assessment}
                heaterStatus={protection.heaterStatus}
                uptimeSeconds={uptimeSeconds}
              />

              {/* Sensor Cards (6 Cards) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    PRIMARY TELEMETRY SENSORS
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    Auto-Sampling: 1.5s interval
                  </span>
                </div>
                <SensorCards
                  reading={currentReading}
                  previousReading={previousReading}
                  settings={settings}
                  history={history}
                />
              </div>

              {/* Automatic Protection Control & Risk Detection Side-by-Side or Stacked */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ProtectionPanel
                  protection={protection}
                  onSetHeaterMode={handleSetHeaterMode}
                  settings={settings}
                  reading={currentReading}
                />

                <RiskDetectionPanel
                  assessment={assessment}
                  settings={settings}
                />
              </div>

              {/* Real-time Graphs Section */}
              <TelemetryChartsSection
                history={history}
                settings={settings}
              />

              {/* Real-Time Alert Panel */}
              <AlertsPanel
                alerts={alerts}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onClearAlerts={handleClearAlerts}
                onAcknowledgeAll={handleAcknowledgeAll}
              />
            </div>
          )}

          {/* 2. LIVE MONITORING VIEW (Deep Multi-Sensor Charts & Full Gauges) */}
          {currentTab === 'monitoring' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    HIGH-RESOLUTION LIVE MONITORING
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive multi-channel telemetry with configurable trend windows and threshold bounds
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  Streaming Live Telemetry
                </div>
              </div>

              <SensorCards
                reading={currentReading}
                previousReading={previousReading}
                settings={settings}
                history={history}
              />

              <TelemetryChartsSection
                history={history}
                settings={settings}
              />
            </div>
          )}

          {/* 3. RISK ANALYSIS VIEW */}
          {currentTab === 'risk' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <RiskDetectionPanel
                assessment={assessment}
                settings={settings}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProtectionPanel
                  protection={protection}
                  onSetHeaterMode={handleSetHeaterMode}
                  settings={settings}
                  reading={currentReading}
                />

                <AlertsPanel
                  alerts={alerts}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onClearAlerts={handleClearAlerts}
                  onAcknowledgeAll={handleAcknowledgeAll}
                />
              </div>
            </div>
          )}

          {/* 4. PROTECTION CONTROL VIEW */}
          {currentTab === 'protection' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ProtectionPanel
                protection={protection}
                onSetHeaterMode={handleSetHeaterMode}
                settings={settings}
                reading={currentReading}
              />

              <SystemStatusHero
                status={currentSystemStatus}
                protection={protection}
                assessment={assessment}
                heaterStatus={protection.heaterStatus}
                uptimeSeconds={uptimeSeconds}
              />

              <TelemetryChartsSection
                history={history}
                settings={settings}
              />
            </div>
          )}

          {/* 5. DATA LOGS VIEW */}
          {currentTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <DataLogView
                logs={logs}
                onClearLogs={handleClearLogs}
              />
            </div>
          )}

          {/* ESP32 BLUETOOTH HARDWARE VIEW */}
          {currentTab === 'esp32' && (
            <ESP32HardwareView
              status={bleStatus}
              errorMessage={bleErrorMessage}
              deviceName={bleDeviceName}
              onConnect={handleConnectBle}
              onDisconnect={handleDisconnectBle}
              onConnectSimulated={handleConnectSimulatedBle}
              lastPacket={lastBlePacket}
              onSendHeaterCommand={handleSendHeaterBleCommand}
            />
          )}

          {/* 6. SETTINGS VIEW */}
          {currentTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            </div>
          )}

          {/* 7. ABOUT SYSTEM VIEW */}
          {currentTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <AboutSystemView />
            </div>
          )}
        </main>
      </div>

      {/* Global ESP32 Bluetooth Pairing Modal */}
      <ESP32ConnectModal
        isOpen={isBleModalOpen}
        onClose={() => setIsBleModalOpen(false)}
        status={bleStatus}
        errorMessage={bleErrorMessage}
        deviceName={bleDeviceName}
        onConnect={handleConnectBle}
        onDisconnect={handleDisconnectBle}
        onConnectSimulated={handleConnectSimulatedBle}
        lastPacket={lastBlePacket}
      />
    </div>
  );
}
