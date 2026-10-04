import React, { useState } from 'react';
import { OnboardingProfile, Employee, Role, Department } from '../../types';
import { FileText, UserPlus, Laptop, CheckSquare, Sparkles, UserCheck, ShieldAlert, Plus, Check, Trash2, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

interface OnboardingModuleProps {
  onboardings: OnboardingProfile[];
  employees: Employee[];
  currentRole: Role;
  departments?: Department[];
  onUpdateOnboarding: (id: string, updated: Partial<OnboardingProfile>) => void;
  onAddOnboarding: (profile: Omit<OnboardingProfile, 'id' | 'currentStep' | 'isCompleted'>) => void;
  onActivateEmployee: (id: string) => Promise<void> | void;
}

export default function OnboardingModule({
  onboardings,
  employees,
  currentRole,
  departments = [],
  onUpdateOnboarding,
  onAddOnboarding,
  onActivateEmployee
}: OnboardingModuleProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(onboardings[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Brand New Profile states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1998-10-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [dept, setDept] = useState('Engineering');
  const [designation, setDesignation] = useState('Junior Developer');
  const [empType, setEmpType] = useState('Full-Time');
  const [salary, setSalary] = useState(70000);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [joiningDate, setJoiningDate] = useState(todayStr);
  const [managerId, setManagerId] = useState('');

  // RBAC guard
  const hasHRRight = currentRole === 'Super Admin' || currentRole === 'HR';

  const activeProfile = onboardings.find(p => p.id === selectedProfileId);

  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!activeProfile || activating) return;
    setActivating(true);
    try {
      await onActivateEmployee(activeProfile.id);
    } finally {
      setActivating(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      alert('First Name, Last Name and Email are required.');
      return;
    }

    const proposedEmployeeId = `EMP-${100 + employees.length + onboardings.length + 1}`;

    onAddOnboarding({
      personalDetails: {
        firstName,
        lastName,
        dob,
        gender,
        phone,
        email,
        address,
        emergencyContact
      },
      employmentInfo: {
        employeeId: proposedEmployeeId,
        department: dept,
        designation,
        employmentType: empType,
        joiningDate,
        reportingManagerId: managerId,
        salary
      },
      documents: {
        citizenshipVerified: false,
        passportVerified: false,
        contractSigned: false,
        bankDetailsSubmitted: false
      },
      assetsAllocated: {
        laptop: false,
        idCard: false,
        simCard: false,
        accessCard: false
      },
      checklist: {
        emailCreated: false,
        payrollAdded: false,
        systemAccessGranted: false,
        trainingCompleted: false
      }
    });

    // Reset Form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setEmergencyContact('');
    setShowAddForm(false);
  };

  const toggleDocument = (docKey: keyof OnboardingProfile['documents']) => {
    if (!activeProfile) return;
    const currentDocs = { ...activeProfile.documents };
    currentDocs[docKey] = !currentDocs[docKey];
    onUpdateOnboarding(activeProfile.id, { documents: currentDocs });
  };

  const toggleAsset = (assetKey: keyof OnboardingProfile['assetsAllocated']) => {
    if (!activeProfile) return;
    const currentAssets = { ...activeProfile.assetsAllocated };
    currentAssets[assetKey] = !currentAssets[assetKey];
    onUpdateOnboarding(activeProfile.id, { assetsAllocated: currentAssets });
  };

  const toggleChecklist = (checkKey: keyof OnboardingProfile['checklist']) => {
    if (!activeProfile) return;
    const currentChecklist = { ...activeProfile.checklist };
    currentChecklist[checkKey] = !currentChecklist[checkKey];
    onUpdateOnboarding(activeProfile.id, { checklist: currentChecklist });
  };

  const handleNextStep = () => {
    if (!activeProfile) return;
    if (activeProfile.currentStep < 4) {
      onUpdateOnboarding(activeProfile.id, { currentStep: activeProfile.currentStep + 1 });
    }
  };

  const handlePrevStep = () => {
    if (!activeProfile) return;
    if (activeProfile.currentStep > 0) {
      onUpdateOnboarding(activeProfile.id, { currentStep: activeProfile.currentStep - 1 });
    }
  };

  if (!hasHRRight) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-md font-bold text-red-900">Access Restricted</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">
          Employee onboarding features are restricted to **Super Admins** and **HR Administrators** as per the system's role permissions hierarchy. Please swap your role above to inspect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Onboarding Workflows</h2>
          <p className="text-sm text-gray-500">Track candidates throughout documentation verification, corporate email setups, and equipment allocations.</p>
        </div>

        <button
          id="add-onboarding-candidate-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Joining Profile</span>
        </button>
      </div>

      {/* Add candidate form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <span>Generate Joining Profile & Contract Draft</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Details */}
            <div className="space-y-3 border-r border-gray-100 pr-4">
              <span className="text-[10px] uppercase font-bold text-indigo-600">Personal Information</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Liam"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Miller"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="liam.miller@candidate.com"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 901-2233"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="333 Harrison St, San Francisco, CA"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Emergency Contact Details</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Sarah Miller (Spouse) - +1 (555) 304-4560"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>
            </div>

            {/* Employment Info */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-indigo-600">Employment Assignment</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Target Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    {departments
                      .filter((d) => d.isActive && !['Engineering', 'HR', 'Operations', 'Marketing'].includes(d.name))
                      .map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Systems Engineer"
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Employment Type</label>
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-700">Annual Salary ($)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Reporting Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                >
                  <option value="">Select manager…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">Target Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 border border-gray-250 bg-white text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
            >
              Issue Joining Offer
            </button>
          </div>
        </form>
      )}

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Candidate List Side-rail */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Awaiting Onboarding ({onboardings.length})</h3>
          
          <div className="space-y-2">
            {onboardings.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No candidates in progress.</p>
            ) : (
              onboardings.map((p) => {
                const isSelected = p.id === selectedProfileId;
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
                      <p className="font-bold text-xs text-gray-900">{p.personalDetails.firstName} {p.personalDetails.lastName}</p>
                      <span className="text-[10px] text-gray-400 font-semibold">{p.employmentInfo.employeeId}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{p.employmentInfo.designation} • {p.employmentInfo.department}</p>
                    
                    {/* Stepper Progress bar inside side rail */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-1">
                        <span>Progress Step</span>
                        <span>{p.currentStep + 1} of 5</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 transition-all"
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

        {/* Detailed Workspaces / Stepper */}
        <div className="lg:col-span-2">
          {!activeProfile ? (
            <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-gray-400 h-full flex flex-col justify-center">
              <Sparkles className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700">No Profile Selected</h3>
              <p className="text-xs max-w-xs mx-auto mt-1">Select an active onboarding candidate from the left panel or register a new candidate.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
              
              {/* Profile Card Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{activeProfile.personalDetails.firstName} {activeProfile.personalDetails.lastName}</h3>
                  <p className="text-xs text-gray-500">Proposed ID: {activeProfile.employmentInfo.employeeId} • Joining: {activeProfile.employmentInfo.joiningDate}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="font-semibold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-md">
                    {activeProfile.employmentInfo.department} Department
                  </span>
                </div>
              </div>

              {/* Stepper Wizard Bar */}
              <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-5 text-center gap-1">
                {[
                  { step: 0, label: 'Details', icon: <UserPlus className="w-4 h-4 mx-auto mb-1" /> },
                  { step: 1, label: 'Documents', icon: <FileText className="w-4 h-4 mx-auto mb-1" /> },
                  { step: 2, label: 'Assets', icon: <Laptop className="w-4 h-4 mx-auto mb-1" /> },
                  { step: 3, label: 'Checklist', icon: <CheckSquare className="w-4 h-4 mx-auto mb-1" /> },
                  { step: 4, label: 'Activation', icon: <UserCheck className="w-4 h-4 mx-auto mb-1" /> }
                ].map((s) => {
                  const isActive = s.step === activeProfile.currentStep;
                  const isPassed = s.step < activeProfile.currentStep;

                  return (
                    <div
                      key={s.step}
                      className={`text-center space-y-1 py-1.5 rounded-lg border transition-all ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 font-bold'
                          : isPassed
                          ? 'border-emerald-100 bg-emerald-50/10 text-emerald-700'
                          : 'border-transparent text-gray-400'
                      }`}
                    >
                      {s.icon}
                      <span className="text-[10px] hidden md:block">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              <div className="p-6 flex-1 space-y-4">
                
                {/* STEP 0: DETAILS VIEW */}
                {activeProfile.currentStep === 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Review Candidate Profile Details</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 p-4 rounded-xl space-y-2.5">
                        <p className="font-semibold text-gray-400 border-b border-gray-150 pb-1">Personal Details</p>
                        <p><span className="font-bold text-gray-700">Date of Birth:</span> {activeProfile.personalDetails.dob}</p>
                        <p><span className="font-bold text-gray-700">Gender:</span> {activeProfile.personalDetails.gender}</p>
                        <p><span className="font-bold text-gray-700">Email:</span> {activeProfile.personalDetails.email}</p>
                        <p><span className="font-bold text-gray-700">Phone:</span> {activeProfile.personalDetails.phone}</p>
                        <p className="truncate"><span className="font-bold text-gray-700">Address:</span> {activeProfile.personalDetails.address}</p>
                        <p className="truncate"><span className="font-bold text-gray-700">Emergency:</span> {activeProfile.personalDetails.emergencyContact}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl space-y-2.5">
                        <p className="font-semibold text-gray-400 border-b border-gray-150 pb-1">Employment Assignment</p>
                        <p><span className="font-bold text-gray-700">Proposed ID:</span> {activeProfile.employmentInfo.employeeId}</p>
                        <p><span className="font-bold text-gray-700">Designation:</span> {activeProfile.employmentInfo.designation}</p>
                        <p><span className="font-bold text-gray-700">Employment Type:</span> {activeProfile.employmentInfo.employmentType}</p>
                        <p><span className="font-bold text-gray-700">Proposed Salary:</span> ${activeProfile.employmentInfo.salary.toLocaleString()}/yr</p>
                        <p><span className="font-bold text-gray-700">Target Join Date:</span> {activeProfile.employmentInfo.joiningDate}</p>
                        <p>
                          <span className="font-bold text-gray-700">Reporting Manager:</span>{' '}
                          {(() => {
                            const manager = employees.find((e) => e.id === activeProfile.employmentInfo.reportingManagerId);
                            return manager ? `${manager.firstName} ${manager.lastName}` : '—';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: DOCUMENTS COMPLIANCE */}
                {activeProfile.currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Documents Verification Checklist</h4>
                      <span className="text-[10px] text-gray-400 italic">Click to verify documents</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'citizenshipVerified', label: 'Citizenship / ID Card Proof' },
                        { key: 'passportVerified', label: 'Valid Passport Document' },
                        { key: 'contractSigned', label: 'Employment Contract Signed' },
                        { key: 'bankDetailsSubmitted', label: 'Direct Deposit Bank Details' }
                      ].map((doc) => {
                        const verified = activeProfile.documents[doc.key as keyof OnboardingProfile['documents']];
                        return (
                          <button
                            type="button"
                            key={doc.key}
                            onClick={() => toggleDocument(doc.key as any)}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition cursor-pointer ${
                              verified
                                ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-medium">{doc.label}</span>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition ${
                              verified ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                            }`}>
                              {verified && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: ASSETS ALLOCATION */}
                {activeProfile.currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Secure Corporate Asset Allocation</h4>
                      <span className="text-[10px] text-gray-400 italic">Assign and link barcodes</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'laptop', label: 'MacBook / Corporate Laptop' },
                        { key: 'idCard', label: 'Employee ID Badge' },
                        { key: 'simCard', label: 'Corporate Sim Card' },
                        { key: 'accessCard', label: 'Smart NFC Office Access Card' }
                      ].map((asset) => {
                        const allocated = activeProfile.assetsAllocated[asset.key as keyof OnboardingProfile['assetsAllocated']];
                        return (
                          <button
                            type="button"
                            key={asset.key}
                            onClick={() => toggleAsset(asset.key as any)}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition cursor-pointer ${
                              allocated
                                ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-medium">{asset.label}</span>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition ${
                              allocated ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                            }`}>
                              {allocated && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: SYSTEMS CHECKLIST */}
                {activeProfile.currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Company Access Setup & Compliance</h4>
                      <span className="text-[10px] text-gray-400 italic">Toggle system completions</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'emailCreated', label: 'Company SSO Email Provisioned' },
                        { key: 'payrollAdded', label: 'Enrolled in ADP Payroll Database' },
                        { key: 'systemAccessGranted', label: 'Slack & GitHub Access Granted' },
                        { key: 'trainingCompleted', label: 'Completed Information Security Compliance' }
                      ].map((item) => {
                        const completed = activeProfile.checklist[item.key as keyof OnboardingProfile['checklist']];
                        return (
                          <button
                            type="button"
                            key={item.key}
                            onClick={() => toggleChecklist(item.key as any)}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition cursor-pointer ${
                              completed
                                ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs font-medium">{item.label}</span>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition ${
                              completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                            }`}>
                              {completed && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: ACTIVATION */}
                {activeProfile.currentStep === 4 && (
                  <div className="space-y-6 text-center py-6">
                    <div className="inline-flex p-4 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 animate-bounce">
                      <UserCheck className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-900">Final Verification Complete!</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Once sent, {activeProfile.personalDetails.firstName} will receive an invitation email to accept the offer. On acceptance they will be provisioned as an **Active Employee**, set their own password, and be able to perform GPS Check-Ins and pick up tasks.
                      </p>
                    </div>

                    {/* Completion Checker Warning */}
                    {Object.values(activeProfile.documents).some(v => !v) || 
                     Object.values(activeProfile.assetsAllocated).some(v => !v) || 
                     Object.values(activeProfile.checklist).some(v => !v) ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold max-w-md mx-auto p-3 rounded-lg">
                        ⚠️ Warning: Some documents, assets or check-items have not been verified yet. It is recommended to complete all previous steps.
                      </div>
                    ) : null}

                    <div>
                      <button
                        id="activate-employee-action-btn"
                        onClick={() => void handleActivate()}
                        disabled={activating}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                      >
                        {activating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        <span>{activating ? 'SENDING INVITATION…' : 'SEND INVITATION EMAIL'}</span>
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
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
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
