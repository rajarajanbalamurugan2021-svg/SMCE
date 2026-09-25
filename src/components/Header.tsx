import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Clock,
  MapPin,
  Play,
  Pause,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Volume2,
  VolumeX,
  Layers,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { ThresholdSettings } from '../types/smce';
import { BluetoothConnectionStatus } from '../services/bluetoothManager';
import type { User } from 'firebase/auth';

interface HeaderProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  simulationEnabled: boolean;
  onToggleSimulation: () => void;
  settings: ThresholdSettings;
  onUpdateSettings: (s: ThresholdSettings) => void;
  packetCount: number;
  bleStatus: BluetoothConnectionStatus;
  onOpenBleModal: () => void;
  bleDeviceName?: string;
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  isCloudSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  onToggleOnline,
  simulationEnabled,
  onToggleSimulation,
  settings,
  onUpdateSettings,
  packetCount,
  bleStatus,
  onOpenBleModal,
  bleDeviceName,
  user,
  onSignIn,
  onSignOut,
  isCloudSyncing = false,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & High-Altitude Identification */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-wider text-white font-mono flex items-center gap-2">
                MAHAPS
                <span className="text-xs bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-sans font-medium border border-slate-700">
                  SIH 26049
                </span>
              </h1>
            </div>
            <h2 className="text-xs text-slate-300 font-medium tracking-wide">
              Modular Adaptive High-Altitude Protection System
            </h2>
          </div>
        </div>

        {/* Center/Right: Ladakh Context & Connection Telemetry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
          {/* Location indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate max-w-[200px]" title={settings.stationName}>
              Ladakh Pass ({settings.altitudeMeters}m)
            </span>
          </div>

          {/* Real-time Clock */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden sm:inline">{formatDate(currentDateTime)}</span>
            <span className="font-bold text-white tracking-wider">{formatTime(currentDateTime)}</span>
            <span className="text-[10px] text-cyan-500 font-sans">IST/LCL</span>
          </div>

          {/* Connection Status & Packets */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'
              } ${isOnline ? 'animate-ping' : ''}`}
            />
            <span className="text-slate-400">Link:</span>
            <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? 'TELEMETRY RS485/LORA' : 'LINK OFFLINE'}
            </span>
            <span className="text-slate-500 text-[10px] hidden xl:inline">
              (Rx: #{packetCount})
            </span>
          </div>

          {/* Online/Offline Toggle */}
          <button
            onClick={onToggleOnline}
            title={isOnline ? 'Simulate Link Disconnect' : 'Reconnect Telemetry Link'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
              isOnline
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                : 'bg-rose-950/80 text-rose-300 border-rose-500 hover:bg-rose-900'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* ESP32 Bluetooth Hardware Connect Button */}
          <button
            onClick={onOpenBleModal}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              bleStatus === 'CONNECTED'
                ? 'bg-blue-950/90 border-blue-500 text-blue-300 shadow-blue-950/50 ring-1 ring-blue-400'
                : bleStatus === 'RECONNECTING'
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse ring-1 ring-amber-400'
                : bleStatus === 'CONNECTING'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-blue-500/60'
            }`}
            title="Connect ESP32 Microcontroller via Bluetooth"
          >
            {bleStatus === 'CONNECTED' ? (
              <>
                <BluetoothConnected className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">ESP32:</span>
                <span className="text-emerald-400">BLE ON</span>
              </>
            ) : bleStatus === 'RECONNECTING' ? (
              <>
                <Bluetooth className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="hidden sm:inline">ESP32:</span>
                <span className="text-amber-300">Reconnecting...</span>
              </>
            ) : bleStatus === 'CONNECTING' ? (
              <>
                <Bluetooth className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Pairing...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Connect</span>
                <span>ESP32</span>
              </>
            )}
          </button>

          {/* Simulation Mode Toggle Button */}
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              simulationEnabled
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-cyan-950/50'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {simulationEnabled ? (
              <>
                <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                <span>SIM: ON</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>SIM: OFF</span>
              </>
            )}
          </button>

          {/* Firebase Authentication & Cloud Sync */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono"
                title={`Signed in as ${user.email || user.displayName || 'Operator'}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-4 h-4 rounded-full border border-blue-400/60 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-slate-200 max-w-[90px] sm:max-w-[130px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded font-mono">
                  <Cloud className={`w-2.5 h-2.5 text-emerald-400 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
                  <span className="hidden xl:inline">SYNCED</span>
                </span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out of Firebase"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 transition-all text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              title="Sign in with Google to sync telemetry logs and settings to Firestore"
              className="px-3 py-1.5 rounded-lg border border-blue-500/60 bg-blue-950/70 hover:bg-blue-900/80 text-blue-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-950/50"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="text-[10px] text-blue-300/80 bg-blue-900/60 px-1 py-0.5 rounded">Cloud</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
