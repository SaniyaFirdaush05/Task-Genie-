import React from 'react';
import { ReminderAlert } from '../types/task';
import { D1TaskStoreService } from '../store/taskStore';
import { Bell, Check, Trash2, X, Clock, AlertCircle } from 'lucide-react';

interface NotificationAlertsProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ReminderAlert[];
  onSelectTaskId: (taskId: string) => void;
}

export const NotificationAlerts: React.FC<NotificationAlertsProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectTaskId,
}) => {
  if (!isOpen) return null;

  const handleMarkRead = (id: string) => {
    D1TaskStoreService.markAlertRead(id);
  };

  const handleClearAll = () => {
    D1TaskStoreService.clearAlerts();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh] z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Reminder Alerts
              </h2>
              <p className="text-[10px] text-slate-400">Level 1 DFD: Generate Reminder Alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  handleMarkRead(alert.id);
                  onSelectTaskId(alert.taskId);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  alert.read
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-70'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {alert.taskTitle}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {alert.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{alert.dueTime}</span>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(alert.id);
                      }}
                      className="hover:underline flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No active reminder alerts. You're completely up to date!
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Alerts</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
