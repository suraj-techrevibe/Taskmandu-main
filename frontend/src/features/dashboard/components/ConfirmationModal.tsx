import React from 'react';
import { X, Play, Power, Home, Building } from 'lucide-react';
import { Attendance } from '../../../types';

interface ConfirmationModalProps {
  pendingAction: 'checkin' | 'checkout';
  setPendingAction: (action: null) => void;
  myTodaySessions: Attendance[];
  myTodayActiveSession: Attendance | null;
  quickLocation: 'onsite' | 'remote';
  elapsedDisplay: string;
  totalAccumulatedDisplay: string;
  onConfirm: () => void;
}

export default function ConfirmationModal({
  pendingAction,
  setPendingAction,
  myTodaySessions,
  myTodayActiveSession,
  quickLocation,
  elapsedDisplay,
  totalAccumulatedDisplay,
  onConfirm
}: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden text-left">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            {pendingAction === 'checkin' ? (
              <Play className="w-4 h-4 text-teal-600" />
            ) : (
              <Power className="w-4 h-4 text-orange-600" />
            )}
            <span>{pendingAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}</span>
          </h3>
          <button
            onClick={() => setPendingAction(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {pendingAction === 'checkin' ? (
            <>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {myTodaySessions.length > 0
                  ? 'You are about to start a new check-in session. This will add to your total work hours for today.'
                  : 'You are about to check in for today\'s shift. This will start tracking your work hours.'
                }
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Location:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                    quickLocation === 'remote' ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {quickLocation === 'remote' ? <Home className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                  {quickLocation === 'remote' ? 'Remote' : 'Onsite'}
                </span>
              </div>
              {myTodaySessions.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700">
                  <p className="font-bold">Previous sessions today: <span className="text-teal-700">{totalAccumulatedDisplay}</span></p>
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-semibold">
                Confirm to proceed with check-in.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                You are about to check out. This will end your current shift and calculate your working hours.
              </p>
              {myTodayActiveSession?.checkInTime && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                  <p className="font-bold">Shift Started At:</p>
                  <p>{new Date(myTodayActiveSession.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="font-bold mt-1">Elapsed: <span className="text-teal-700">{elapsedDisplay}</span></p>
                  {myTodaySessions.length > 1 && (
                    <p className="font-bold mt-1">Total Today: <span className="text-teal-700">{totalAccumulatedDisplay}</span></p>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-semibold">
                This action cannot be undone.
              </p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 p-5">
          <button
            onClick={() => setPendingAction(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-black text-white transition cursor-pointer shadow-sm ${
              pendingAction === 'checkin' ? 'bg-teal-700 hover:bg-teal-800' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {pendingAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
