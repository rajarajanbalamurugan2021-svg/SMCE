import React, { useState } from 'react';
import { AlertItem } from '../types/smce';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Info,
  Trash2,
  Check,
  Search,
  Filter,
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: string) => void;
  onClearAlerts: () => void;
  onAcknowledgeAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledgeAlert,
  onClearAlerts,
  onAcknowledgeAll,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'PROTECTION' | 'INFO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = alerts.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return (
        item.message.toLowerCase().includes(term) ||
        item.sensor.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getAlertBadge = (type: AlertItem['type']) => {
    switch (type) {
      case 'CRITICAL':
        return {
          icon: AlertOctagon,
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
          dot: 'bg-rose-500',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          dot: 'bg-amber-400',
        };
      case 'PROTECTION':
        return {
          icon: Flame,
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
          dot: 'bg-cyan-400',
        };
      case 'INFO':
      default:
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              REAL-TIME ALERT PANEL
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {alerts.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-altitude anomaly dispatch &amp; safeguard actuation logs
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAcknowledgeAll}
            disabled={alerts.length === 0}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            Ack All
          </button>
          <button
            onClick={onClearAlerts}
            disabled={alerts.length === 0}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 rounded border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'CRITICAL', 'WARNING', 'PROTECTION', 'INFO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2 py-1 rounded text-[11px] whitespace-nowrap transition-all ${
                filterType === cat
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          />
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">
              No alerts match the active filter criteria. System running nominally.
            </p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const badge = getAlertBadge(item.type);
            const Icon = badge.icon;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  item.acknowledged
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left Section: Time, Severity Badge, Message */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded border ${badge.bg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.displayTime}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${badge.bg}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        [{item.sensor}]
                      </span>
                      <span className="text-[11px] font-mono font-bold text-white bg-slate-900 px-1.5 rounded border border-slate-800">
                        Val: {item.value}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1 font-sans">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right: Acknowledge button */}
                {!item.acknowledged && (
                  <button
                    onClick={() => onAcknowledgeAlert(item.id)}
                    className="shrink-0 px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
