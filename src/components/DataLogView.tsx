import React, { useState, useMemo } from 'react';
import { LogEntry, SystemStatus } from '../types/smce';
import {
  Download,
  Trash2,
  Search,
  Filter,
  Flame,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { exportLogsToCSV } from '../services/storage';

interface DataLogViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const DataLogView: React.FC<DataLogViewProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SystemStatus>('ALL');
  const [heaterFilter, setHeaterFilter] = useState<'ALL' | 'ON' | 'OFF'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (heaterFilter !== 'ALL' && log.heater !== heaterFilter) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        return (
          log.displayTime.toLowerCase().includes(q) ||
          log.temperature.toFixed(1).includes(q) ||
          log.pressure.toFixed(1).includes(q) ||
          log.voltage.toFixed(2).includes(q) ||
          log.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, statusFilter, heaterFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleExport = () => {
    exportLogsToCSV(filteredLogs.length > 0 ? filteredLogs : logs);
  };

  const getStatusBadge = (status: SystemStatus) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PROTECTION ACTIVE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'NORMAL':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              SYSTEM DATA LOG
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {logs.length} Total Records (Local Storage)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              High-altitude timestamped environmental and electrical telemetry log
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all stored telemetry logs?')) {
                onClearLogs();
              }
            }}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search telemetry records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">NORMAL</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="PROTECTION ACTIVE">PROTECTION ACTIVE</option>
          </select>
        </div>

        {/* Heater Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Heater:</span>
          <select
            value={heaterFilter}
            onChange={(e) => {
              setHeaterFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
          </select>
        </div>
      </div>

      {/* Telemetry Log Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Temperature</th>
              <th className="py-2.5 px-3">Humidity</th>
              <th className="py-2.5 px-3">Pressure</th>
              <th className="py-2.5 px-3">Voltage</th>
              <th className="py-2.5 px-3">Current</th>
              <th className="py-2.5 px-3 text-center">Heater</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  No telemetry records available.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((entry, idx) => (
                <tr
                  key={entry.id || idx}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    idx === 0 && currentPage === 1 ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-300 font-medium whitespace-nowrap">
                    {entry.displayTime}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={
                        entry.temperature < -15
                          ? 'text-rose-400 font-semibold'
                          : entry.temperature < 0
                          ? 'text-cyan-300'
                          : 'text-emerald-400'
                      }
                    >
                      {entry.temperature.toFixed(1)} °C
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                    {entry.humidity.toFixed(1)} %
                  </td>
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                    {entry.pressure.toFixed(1)} hPa
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={
                        entry.voltage < 3.3
                          ? 'text-rose-400 font-bold'
                          : entry.voltage < 3.5
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }
                    >
                      {entry.voltage.toFixed(2)} V
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                    {entry.current.toFixed(2)} A
                  </td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        entry.heater === 'ON'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {entry.heater === 'ON' && <Flame className="w-3 h-3 text-rose-400" />}
                      {entry.heater}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                        entry.status
                      )}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono text-slate-400">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} matching
          entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
