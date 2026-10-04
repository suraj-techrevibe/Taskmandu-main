import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowRight, MapPin, Play, X, Home, Building } from 'lucide-react';
import { Attendance } from '../../../types';
import { getTodaySessions } from '../../../services/attendance';

interface QuickAttendanceProps {
  onCheckIn?: (locationType: 'Onsite' | 'WFH') => void;
  onCheckOut?: () => void;
}

export default function QuickAttendance({
  onCheckIn,
  onCheckOut
}: QuickAttendanceProps) {
  const [quickNotes, setQuickNotes] = useState('');
  const [quickLocation, setQuickLocation] = useState<'onsite' | 'remote'>('onsite');
  const [myTodaySessions, setMyTodaySessions] = useState<Attendance[]>([]);
  const [myTodayTotalHours, setMyTodayTotalHours] = useState(0);
  const [myTodayActiveSession, setMyTodayActiveSession] = useState<Attendance | null>(null);
  const [myTodayLoading, setMyTodayLoading] = useState(true);
  const [myTodayError, setMyTodayError] = useState(false);
  const [quickBusy, setQuickBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | null>(null);
  const loadedOnceRef = useRef(false);

  const refreshMyToday = async () => {
    if (!loadedOnceRef.current) setMyTodayLoading(true);
    try {
      const result = await getTodaySessions();
      setMyTodaySessions(result.sessions);
      setMyTodayTotalHours(result.totalWorkingHours);
      setMyTodayActiveSession(result.activeSession);
      setMyTodayError(false);
    } catch {
      setMyTodayError(true);
    } finally {
      loadedOnceRef.current = true;
      setMyTodayLoading(false);
    }
  };

  useEffect(() => {
    void refreshMyToday();
  }, []);

  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!myTodayActiveSession?.checkInTime) {
      setElapsedMinutes(0);
      return;
    }

    const calcElapsed = () => {
      const checkIn = new Date(myTodayActiveSession.checkInTime);
      const now = new Date();
      const diffMs = now.getTime() - checkIn.getTime();
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 60000);
    return () => clearInterval(interval);
  }, [myTodayActiveSession?.checkInTime]);

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  const elapsedDisplay = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins}m` : `${elapsedMins}m`;

  const totalAccumulatedMinutes = myTodayTotalHours * 60 + (myTodayActiveSession ? elapsedMinutes : 0);
  const totalAccumulatedHours = Math.floor(totalAccumulatedMinutes / 60);
  const totalAccumulatedMins = Math.round(totalAccumulatedMinutes % 60);
  const totalAccumulatedDisplay = totalAccumulatedHours > 0
    ? `${totalAccumulatedHours}h ${totalAccumulatedMins}m`
    : `${totalAccumulatedMins}m`;

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setQuickBusy(true);
    try {
      if (pendingAction === 'checkin') {
        await onCheckIn?.(quickLocation === 'onsite' ? 'Onsite' : 'WFH');
      } else {
        await onCheckOut?.();
      }
      setQuickNotes('');
      await refreshMyToday();
    } finally {
      setQuickBusy(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs transition hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Quick Attendance</span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
        </div>

        {myTodayLoading ? (
          <div className="space-y-3.5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shift Status</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Checking your attendance status...</p>
            </div>
            <div className="h-10 bg-slate-100 animate-pulse rounded-xl"></div>
          </div>
        ) : myTodayError ? (
          <div className="space-y-3.5">
            <div className="bg-rose-50/40 border border-rose-100/60 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Status Unavailable</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Could not load your attendance status.</p>
            </div>
            <button
              onClick={() => void refreshMyToday()}
              disabled={quickBusy}
              className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        ) : myTodaySessions.length === 0 ? (
          <div className="space-y-3.5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shift Status</p>
              <p className="text-xs font-bold text-slate-600 mt-0.5">Awaiting check-in for today</p>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder="Quick note (e.g. Starting shifts...)"
                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 placeholder-slate-400 font-medium"
              />

              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuickLocation('onsite')}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    quickLocation === 'onsite'
                      ? 'bg-white text-slate-800 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${quickLocation === 'onsite' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>🏢 Onsite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickLocation('remote')}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    quickLocation === 'remote'
                      ? 'bg-white text-slate-800 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${quickLocation === 'remote' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>🏠 Remote</span>
                </button>
              </div>

              <button
                onClick={() => setPendingAction('checkin')}
                disabled={quickBusy}
                className="w-full bg-teal-800 hover:bg-teal-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-teal-950/10 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <span>{quickBusy ? 'Checking In...' : 'Check In Now'}</span>
                {!quickBusy && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : myTodayActiveSession ? (
          <div className="space-y-3.5">
            <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Active Shift</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Checked In at {new Date(myTodayActiveSession.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="inline-block text-[9px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold animate-pulse">On-Shift</span>
                <span className="text-[10px] font-extrabold text-emerald-700">{elapsedDisplay} elapsed</span>
              </div>
            </div>

            {myTodaySessions.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 max-h-32 overflow-y-auto">
                <div className="space-y-1.5">
                  {myTodaySessions.map((session, idx) => (
                    <div key={session.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-400 w-4">#{idx + 1}</span>
                        <span className="font-bold text-slate-700">
                          {new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {session.checkOutTime
                            ? new Date(session.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : <span className="text-teal-600 animate-pulse">now</span>
                          }
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-600">
                        {session.workingHours ? `${session.workingHours.toFixed(1)}h` : elapsedDisplay}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-2.5 text-center">
              <p className="text-[9px] font-black text-teal-500 uppercase tracking-wider">Total Time Today</p>
              <p className="text-lg font-extrabold text-teal-800">{totalAccumulatedDisplay}</p>
            </div>

            <div className="space-y-2">
              <textarea
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder="Handoff notes or tasks completed..."
                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 placeholder-slate-400 resize-none h-14 font-medium"
              />

              <button
                onClick={() => setPendingAction('checkout')}
                disabled={quickBusy}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-orange-900/10 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Clock className={`w-3.5 h-3.5 ${quickBusy ? 'animate-spin' : ''}`} />
                <span>{quickBusy ? 'Checking Out...' : 'Instant Check-Out'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shift Status</p>
              <p className="text-xs font-bold text-slate-700 mt-1">All Shifts Completed Today</p>
              <div className="mt-2 text-[10px] font-semibold text-slate-500 border-t border-slate-100/60 pt-2">
                <span className="text-teal-700 font-extrabold">{myTodaySessions.length} session{myTodaySessions.length > 1 ? 's' : ''}</span>
                <span className="mx-1.5">•</span>
                <span className="text-slate-700 font-extrabold">{totalAccumulatedDisplay}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 max-h-32 overflow-y-auto">
              <div className="space-y-1.5">
                {myTodaySessions.map((session, idx) => (
                  <div key={session.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-400 w-4">#{idx + 1}</span>
                      <span className="font-bold text-slate-700">
                        {new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {session.checkOutTime
                          ? new Date(session.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--'
                        }
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-600">
                      {session.workingHours ? `${session.workingHours.toFixed(1)}h` : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPendingAction('checkin')}
              disabled={quickBusy}
              className="w-full bg-teal-800 hover:bg-teal-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-teal-950/10 hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Check In Again</span>
            </button>
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-sm w-full overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {pendingAction === 'checkin' ? (
                  <Play className="w-4 h-4 text-teal-600" />
                ) : (
                  <Clock className="w-4 h-4 text-orange-600" />
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
                onClick={() => void handleConfirmAction()}
                disabled={quickBusy}
                className={`px-4 py-2 rounded-xl text-xs font-black text-white transition cursor-pointer shadow-sm disabled:opacity-60 ${
                  pendingAction === 'checkin' ? 'bg-teal-700 hover:bg-teal-800' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {quickBusy ? 'Processing...' : pendingAction === 'checkin' ? 'Confirm Check-In' : 'Confirm Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
