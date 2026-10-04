import React, { useState } from 'react';
import { OffboardingProfile, Employee, Role } from '../../types';
import { FileText, ShieldAlert, CheckSquare, RefreshCw, Power, Plus, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface OffboardingModuleProps {
  offboardings: OffboardingProfile[];
  employees: Employee[];
  currentRole: Role;
  currentEmployeeId?: string | null;
  onUpdateOffboarding: (id: string, updated: Partial<OffboardingProfile>) => void;
  onAddOffboarding: (profile: Omit<OffboardingProfile, 'id' | 'currentStep' | 'isCompleted'>) => void;
  onArchiveEmployee: (id: string) => void;
}

export default function OffboardingModule({
  offboardings,
  employees,
  currentRole,
  currentEmployeeId,
  onUpdateOffboarding,
  onAddOffboarding,
  onArchiveEmployee
}: OffboardingModuleProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(offboardings[0]?.id || null);
  
  // Submit resignation form (Employee)
  const [showResignForm, setShowResignForm] = useState(false);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const defaultLastDay = `${in30Days.getFullYear()}-${String(in30Days.getMonth() + 1).padStart(2, '0')}-${String(in30Days.getDate()).padStart(2, '0')}`;
  const [lastDay, setLastDay] = useState(defaultLastDay);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState(14);
  const [feedback, setFeedback] = useState('');

  // Access rights
  const hasHRRight = currentRole === 'Super Admin' || currentRole === 'HR';

  const activeProfile = offboardings.find((p) => p.id === selectedProfileId);
  const activeEmployee = activeProfile ? employees.find((e) => e.id === activeProfile.employeeId) : null;

  const handleResignationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddOnboardingExit();
  };

  const onAddOnboardingExit = () => {
    onAddOffboarding({
      employeeId: currentEmployeeId ?? '',
      lastWorkingDay: lastDay,
      reason,
      noticePeriod: notice,
      feedback,
      clearanceStatus: {
        hr: 'Pending',
        finance: 'Pending',
        it: 'Pending',
        operations: 'Pending'
      },
      assetsReturned: {
        laptop: false,
        monitor: false,
        accessCard: false,
        simCard: false
      },
      exitInterview: {
        companyFeedback: '',
        suggestions: '',
        rehireEligibility: 'Conditional'
      }
    });
    setShowResignForm(false);
  };

  const handleToggleClearance = (deptKey: keyof OffboardingProfile['clearanceStatus']) => {
    if (!activeProfile) return;
    const currentStatus = { ...activeProfile.clearanceStatus };
    const currentVal = currentStatus[deptKey];
    
    // Cycle: Pending -> Approved -> Rejected -> Pending
    const nextVal: Record<string, 'Pending' | 'Approved' | 'Rejected'> = {
      Pending: 'Approved',
      Approved: 'Rejected',
      Rejected: 'Pending'
    };
    currentStatus[deptKey] = nextVal[currentVal];

    onUpdateOffboarding(activeProfile.id, { clearanceStatus: currentStatus });
  };

  const handleToggleAsset = (assetKey: keyof OffboardingProfile['assetsReturned']) => {
    if (!activeProfile) return;
    const currentAssets = { ...activeProfile.assetsReturned };
    currentAssets[assetKey] = !currentAssets[assetKey];
    onUpdateOffboarding(activeProfile.id, { assetsReturned: currentAssets });
  };

  const handleSaveInterview = (companyFeedback: string, suggestions: string, rehire: 'Yes' | 'No' | 'Conditional') => {
    if (!activeProfile) return;
    onUpdateOffboarding(activeProfile.id, {
      exitInterview: { companyFeedback, suggestions, rehireEligibility: rehire }
    });
  };

  const handleNextStep = () => {
    if (!activeProfile) return;
    if (activeProfile.currentStep < 4) {
      onUpdateOffboarding(activeProfile.id, { currentStep: activeProfile.currentStep + 1 });
    }
  };

  const handlePrevStep = () => {
    if (!activeProfile) return;
    if (activeProfile.currentStep > 0) {
      onUpdateOffboarding(activeProfile.id, { currentStep: activeProfile.currentStep - 1 });
    }
  };

  // If Employee, show personal exit portal
  if (currentRole === 'Employee') {
    // Check if employee has pending exit requests
    const myExitRequest = offboardings.find(o => o.employeeId === currentEmployeeId);

    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-md font-bold text-gray-900">Your Resignation & Separation Portal</h3>
              <p className="text-xs text-gray-500">Initiate separation processes, review clearance checklists, or complete exit interviews.</p>
            </div>
            
            {!myExitRequest && !showResignForm && (
              <button
                id="init-exit-btn"
                onClick={() => setShowResignForm(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Submit Resignation
              </button>
            )}
          </div>

          {showResignForm && (
            <form onSubmit={handleResignationSubmit} className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-red-600">Offboarding Request Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-700">Last Working Day</label>
                  <input
                    type="date"
                    value={lastDay}
                    onChange={(e) => setLastDay(e.target.value)}
                    className="w-full text-xs border border-gray-200 p-2 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-700">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={notice}
                    onChange={(e) => setNotice(Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 p-2 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[10px] font-bold text-gray-700">Reason for Leaving</label>
                  <input
                    type="text"
                    value={reason}
                    required
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Pursuing opportunities elsewhere..."
                    className="w-full text-xs border border-gray-200 p-2 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[10px] font-bold text-gray-700">General Exit Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share comments about your time with the team..."
                    className="w-full text-xs border border-gray-200 p-2 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowResignForm(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                >
                  Confirm Separation Request
                </button>
              </div>
            </form>
          )}

          {myExitRequest && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-800 space-y-1.5">
                <p className="font-bold">Separation Status: Active Offboarding</p>
                <p>Requested Last Working Day: <span className="font-semibold">{myExitRequest.lastWorkingDay}</span> ({myExitRequest.noticePeriod} days notice)</p>
                <p>Primary Reason: {myExitRequest.reason}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clearance Progress */}
                <div className="border border-gray-200 p-4 rounded-xl space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Department Exit Clearance</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(myExitRequest.clearanceStatus).map(([dept, status]) => (
                      <div key={dept} className="flex items-center justify-between border-b border-gray-50 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-medium uppercase text-[10px] text-gray-500">{dept} Clearance</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets returns */}
                <div className="border border-gray-200 p-4 rounded-xl space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Asset Handover Checklist</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(myExitRequest.assetsReturned).map(([asset, returned]) => (
                      <div key={asset} className="flex items-center justify-between border-b border-gray-50 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-medium capitalize text-gray-700">{asset}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          returned ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {returned ? 'Returned' : 'Awaiting Handover'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If Manager / Admin, show exit dashboards
  if (!hasHRRight) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-md font-bold text-red-900">Access Restricted</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">
          Employee offboarding features are restricted to **Super Admins** and **HR Administrators** as per systems policy. Swap your role above to inspect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Separation cases list */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Active Offboardings ({offboardings.length})</h3>
          
          <div className="space-y-2">
            {offboardings.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No active exits in progress.</p>
            ) : (
              offboardings.map((p) => {
                const isSelected = p.id === selectedProfileId;
                const emp = employees.find((e) => e.id === p.employeeId);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer block ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                        : 'border-gray-150 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-xs text-gray-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : 'Candidate'}
                      </p>
                      <span className="text-[10px] text-gray-400 font-semibold">LWD: {p.lastWorkingDay}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{emp?.designation} • {emp?.department}</p>
                    
                    {/* Stepper Progress bar inside side rail */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-600 h-1.5 transition-all"
                          style={{ width: `${(p.currentStep + 1) * 20}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Stepper Detail View */}
        <div className="lg:col-span-2">
          {!activeProfile ? (
            <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-gray-400 h-full flex flex-col justify-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700">No Separation Selected</h3>
              <p className="text-xs max-w-xs mx-auto mt-1">Select an active offboarding profile from the left panel.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
              
              {/* Profile Card Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {activeEmployee ? `${activeEmployee.firstName} ${activeEmployee.lastName}` : 'Daniel Craig'}
                  </h3>
                  <p className="text-xs text-gray-500">Proposed Last Working Day: {activeProfile.lastWorkingDay} • {activeProfile.noticePeriod} Days Notice</p>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md">
                    {activeEmployee?.department || 'Engineering'}
                  </span>
                </div>
              </div>

              {/* Stepper Wizard Bar */}
              <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-5 text-center gap-1">
                {[
                  { step: 0, label: 'Details' },
                  { step: 1, label: 'Clearances' },
                  { step: 2, label: 'Asset Return' },
                  { step: 3, label: 'Interview' },
                  { step: 4, label: 'Archive' }
                ].map((s) => {
                  const isActive = s.step === activeProfile.currentStep;
                  const isPassed = s.step < activeProfile.currentStep;

                  return (
                    <div
                      key={s.step}
                      className={`text-center space-y-1 py-1.5 rounded-lg border transition-all ${
                        isActive
                          ? 'border-red-600 bg-red-50/30 text-red-700 font-bold'
                          : isPassed
                          ? 'border-emerald-100 bg-emerald-50/10 text-emerald-700'
                          : 'border-transparent text-gray-400'
                      }`}
                    >
                      <span className="text-[10px]">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              <div className="p-6 flex-1 space-y-4 text-xs">
                
                {/* STEP 0: DETAILS VIEW */}
                {activeProfile.currentStep === 0 && (
                  <div className="space-y-4 text-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-600">Review Exit Petition & Notice Period</h4>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2.5">
                      <p><span className="font-bold text-gray-700">Reason for leaving:</span> {activeProfile.reason}</p>
                      <p><span className="font-bold text-gray-700">Notice Period Provided:</span> {activeProfile.noticePeriod} days</p>
                      <p><span className="font-bold text-gray-700">Proposed Last Working Day:</span> {activeProfile.lastWorkingDay}</p>
                      <p><span className="font-bold text-gray-700">Initial Feedback comments:</span> {activeProfile.feedback || 'None'}</p>
                    </div>
                  </div>
                )}

                {/* STEP 1: CLEARANCES */}
                {activeProfile.currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-600">Department clearances checklist</h4>
                      <span className="text-[10px] text-gray-400 italic">Click to cycle: Approved / Rejected / Pending</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(activeProfile.clearanceStatus).map(([dept, status]) => {
                        return (
                          <button
                            type="button"
                            key={dept}
                            onClick={() => handleToggleClearance(dept as any)}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition cursor-pointer ${
                              status === 'Approved'
                                ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                                : status === 'Rejected'
                                ? 'border-red-200 bg-red-50/20 text-red-800'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-semibold uppercase">{dept} Clearance</span>
                            <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full bg-white">
                              {status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: ASSETS RETURNS */}
                {activeProfile.currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-600">Corporate Assets Handback Checklist</h4>
                      <span className="text-[10px] text-gray-400 italic">Toggle handback compliance</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'laptop', label: 'Laptop Handed over & Wiped' },
                        { key: 'monitor', label: 'Desk Monitor Returned' },
                        { key: 'accessCard', label: 'Office NFC Access Card Returned' },
                        { key: 'simCard', label: 'Corporate Sim Card Returned' }
                      ].map((asset) => {
                        const returned = activeProfile.assetsReturned[asset.key as keyof OffboardingProfile['assetsReturned']];
                        return (
                          <button
                            type="button"
                            key={asset.key}
                            onClick={() => handleToggleAsset(asset.key as any)}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition cursor-pointer ${
                              returned
                                ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-medium">{asset.label}</span>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition ${
                              returned ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                            }`}>
                              {returned && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: EXIT INTERVIEW */}
                {activeProfile.currentStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-600">Secure Exit Interview Questionnaire</h4>
                    
                    <ExitInterviewForm
                      initialFeedback={activeProfile.exitInterview.companyFeedback}
                      initialSuggestions={activeProfile.exitInterview.suggestions}
                      initialRehire={activeProfile.exitInterview.rehireEligibility}
                      onSave={handleSaveInterview}
                    />
                  </div>
                )}

                {/* STEP 4: ARCHIVE & ACTIVATE */}
                {activeProfile.currentStep === 4 && (
                  <div className="space-y-6 text-center py-6">
                    <div className="inline-flex p-4 bg-red-50 rounded-full border border-red-100 text-red-600 animate-pulse">
                      <Power className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Final Clearance Complete!</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Ready to archive employee. Once archived, the employee account is deactivated, and they are marked as **Archived** in database histories.
                      </p>
                    </div>

                    <div>
                      <button
                        id="archive-employee-action-btn"
                        onClick={() => onArchiveEmployee(activeProfile.id)}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <Power className="w-4 h-4" />
                        <span>DEACTIVATE & ARCHIVE ACCOUNT</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Stepper Footer actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={activeProfile.currentStep === 0}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {activeProfile.currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-1"></div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Inner helper component for exit interview to handle local changes before saving
interface ExitInterviewProps {
  initialFeedback: string;
  initialSuggestions: string;
  initialRehire: 'Yes' | 'No' | 'Conditional';
  onSave: (feedback: string, suggestions: string, rehire: 'Yes' | 'No' | 'Conditional') => void;
}

function ExitInterviewForm({ initialFeedback, initialSuggestions, initialRehire, onSave }: ExitInterviewProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [rehire, setRehire] = useState<'Yes' | 'No' | 'Conditional'>(initialRehire);

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-700">Company Feedback Comments</label>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share overall experience details..."
          className="w-full text-xs border border-gray-200 p-2.5 rounded-lg bg-white"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-700">Suggestions for Improvement</label>
        <textarea
          rows={2}
          value={suggestions}
          onChange={(e) => setSuggestions(e.target.value)}
          placeholder="What can we improve to raise retention?"
          className="w-full text-xs border border-gray-200 p-2.5 rounded-lg bg-white"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-700">Rehire Eligibility</label>
        <select
          value={rehire}
          onChange={(e) => setRehire(e.target.value as any)}
          className="w-full text-xs border border-gray-200 p-2 rounded-lg bg-white"
        >
          <option value="Yes">Yes (Eligible for rehiring)</option>
          <option value="No">No (Ineligible / Do Not Rehire)</option>
          <option value="Conditional">Conditional (HR / Manager Review Required)</option>
        </select>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onSave(feedback, suggestions, rehire)}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Save Exit Questionnaire
        </button>
      </div>
    </div>
  );
}
