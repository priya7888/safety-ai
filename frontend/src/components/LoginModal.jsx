import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Building2,
  Lock,
  Mail,
  Info,
  User,
  UserCheck,
  KeyRound,
  Check,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FOUR_ADMINS = [
  { id: 'admin1', name: 'Admin Rajesh', title: 'Rig Ops Lead', zone: 'Rig Operations', email: 'admin1@gmail.com', pass: 'Admin1@123', team: 'Workers 1–10', orgId: 'id001' },
  { id: 'admin2', name: 'Admin Priya', title: 'Refinery Plant Lead', zone: 'Refinery Processing', email: 'admin2@gmail.com', pass: 'Admin2@123', team: 'Workers 11–20', orgId: 'id002' },
  { id: 'admin3', name: 'Admin Vikram', title: 'Pipeline Lead', zone: 'Pipeline Transmission', email: 'admin3@gmail.com', pass: 'Admin3@123', team: 'Workers 21–30', orgId: 'id003' },
  { id: 'admin4', name: 'Admin Sunita', title: 'Hazmat Lead', zone: 'Hazmat Storage', email: 'admin4@gmail.com', pass: 'Admin4@123', team: 'Workers 31–40', orgId: 'id004' },
];

const TEAM_WORKERS = [
  { id: 'worker1', name: 'Worker 01', zone: 'Rig Operations', supervisor: 'Admin Rajesh', email: 'worker1@gmail.com', pass: 'Worker@123', orgId: 'id001' },
  { id: 'worker11', name: 'Worker 11', zone: 'Refinery Processing', supervisor: 'Admin Priya', email: 'worker11@gmail.com', pass: 'Worker@123', orgId: 'id002' },
  { id: 'worker21', name: 'Worker 21', zone: 'Pipeline Transmission', supervisor: 'Admin Vikram', email: 'worker21@gmail.com', pass: 'Worker@123', orgId: 'id003' },
  { id: 'worker31', name: 'Worker 31', zone: 'Hazmat Storage', supervisor: 'Admin Sunita', email: 'worker31@gmail.com', pass: 'Worker@123', orgId: 'id004' },
];

// Preset credentials for both Administrator and Normal User
const PRESET_ACCOUNTS = {
  admin: {
    key: 'admin',
    roleLabel: 'Administrator',
    title: 'Chief HSE Administrator',
    badge: 'Full Admin Privileges',
    email: 'admin1@gmail.com',
    password: 'Admin1@123',
    orgId: 'id001',
    orgName: 'Oil India Limited – Operational Safety Unit',
    accessSummary: 'Full administrative control, batch AI ingestion, audit logs, and system configuration.',
    accentColor: 'amber'
  },
  normal: {
    key: 'normal',
    roleLabel: 'Normal User',
    title: 'Field Safety Operator',
    badge: 'Standard Operations',
    email: 'worker1@gmail.com',
    password: 'Worker@123',
    orgId: 'id001',
    orgName: 'Oil India Limited – Field Operations',
    accessSummary: 'Plant safety monitoring, incident submission, precursor telemetry, and signal review.',
    accentColor: 'sky'
  }
};

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login } = useAuth();
  
  // Active role tab: 'admin' or 'normal'
  const [activeRole, setActiveRole] = useState('admin');
  
  // Form fields
  const [orgId, setOrgId] = useState('id001');
  const [email, setEmail] = useState('admin1@gmail.com');
  const [password, setPassword] = useState('Admin1@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('safetyai_remember_me') !== 'false';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);
  const [customAccounts, setCustomAccounts] = useState([]);

  // Clear messages & sync fields whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setForgotPasswordNotice(false);
      setIsSuccess(false);

      try {
        const stored = localStorage.getItem('safetyai_custom_users');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setCustomAccounts(list);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  // Select custom provisioned user
  const handleSelectCustomUser = (u) => {
    const isCustomAdmin = u.role === 'ADMINISTRATOR' || u.is_admin;
    setActiveRole(isCustomAdmin ? 'admin' : 'normal');
    setOrgId(u.organization_id || 'id001');
    setEmail(u.email);
    setPassword(u.password || '');
    setErrorMessage('');
    setForgotPasswordNotice(false);
  };

  // Switch role handler: autofills matching credentials
  const handleSelectRole = (roleKey) => {
    setActiveRole(roleKey);
    const target = PRESET_ACCOUNTS[roleKey];
    setOrgId(target.orgId);
    setEmail(target.email);
    setPassword(target.password);
    setErrorMessage('');
    setForgotPasswordNotice(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setForgotPasswordNotice(false);

    const cleanOrg = orgId.trim() || 'id001';
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both Email and Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute login via AuthContext / Backend API
      await login(cleanOrg, cleanEmail, cleanPassword);

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('safetyai_remembered_role', activeRole);
        localStorage.setItem('safetyai_remember_me', 'true');
      } else {
        localStorage.removeItem('safetyai_remembered_role');
        localStorage.setItem('safetyai_remember_me', 'false');
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      // Transition to Dashboard
      setTimeout(() => {
        setIsSuccess(false);
        if (onClose) onClose();
        if (onLoginSuccess) onLoginSuccess();
      }, 700);

    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Invalid Organization ID, Email, or Password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#09090b] overflow-y-auto lg:overflow-hidden animate-in fade-in duration-300 flex flex-col lg:flex-row select-none">
      
      {/* ================= LEFT HALF: BRIGHT CLEAR IMAGE WITH ACCESSIBLE BADGE ================= */}
      <div className="relative w-full lg:w-1/2 min-h-[360px] lg:min-h-screen bg-[#09090b] overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/images/pic-5.jpg"
            alt="Safety First Petroleum Engineer"
            className="w-full h-full object-cover object-center transform scale-100 filter brightness-100 contrast-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10" />
        </div>

        {/* Top Left: Logo Badge */}
        <div className="relative z-20">
          <button
            type="button"
            onClick={onClose}
            title="Click to go to main website"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/30 hover:border-amber-400 text-white shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 group"
          >
            <Shield className="w-4 h-4 text-amber-400 fill-amber-400/20 group-hover:rotate-12 transition-transform duration-200" />
            <span className="text-sm font-black font-heading tracking-wide">SafetyAI</span>
            <span className="text-[11px] text-slate-300 font-mono pl-2 border-l border-white/20 group-hover:text-amber-400 transition-colors flex items-center gap-1">
              <span>Main Site</span>
              <span className="text-xs">↗</span>
            </span>
          </button>
        </div>

        {/* Bottom Left: Headline and Role Capabilities Summary */}
        <div className="relative z-20 space-y-3.5 max-w-lg mt-auto pt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual Role Enterprise Authentication</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white tracking-tight leading-tight drop-shadow-md">
            Organization Safety Portal
          </h2>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium drop-shadow-sm">
            Authenticate as an <strong className="text-amber-300">Administrator</strong> for full audit controls or as a <strong className="text-sky-300">Normal User</strong> for field operations and incident reporting.
          </p>

          {/* Role pill indicators */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-amber-500/30 text-left">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Privileges</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                Full Audits, Reset Controls, AI Batch Ingestion & Calibrations
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-sky-500/30 text-left">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Normal User Access</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                Field Observations, Incident Reports, Telemetry & Precursor Review
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT HALF: AUTHENTICATION FORM ================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white dark:bg-[#09090b] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-y-auto">
        
        <div className="max-w-md w-full mx-auto my-auto space-y-5">
          
          {/* Back to Website Link */}
          <div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-amber-400 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Website</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-950 dark:text-white tracking-tight">
              Sign In to SafetyAI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Select your role or enter your enterprise credentials below.
            </p>
          </div>

          {/* ================= 1-CLICK ROLE SELECTOR TABS ================= */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Login Role
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Administrator Role Card */}
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  activeRole === 'admin'
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                    : 'bg-slate-50 dark:bg-[#141418] border-slate-200 dark:border-[#27272e] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      activeRole === 'admin'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Admin User</span>
                  </div>
                  {activeRole === 'admin' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                  Chief HSE Admin
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold mt-1">
                  admin1@gmail.com
                </div>
              </button>

              {/* Normal User Role Card */}
              <button
                type="button"
                onClick={() => handleSelectRole('normal')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  activeRole === 'normal'
                    ? 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/20 shadow-md shadow-sky-500/10'
                    : 'bg-slate-50 dark:bg-[#141418] border-slate-200 dark:border-[#27272e] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      activeRole === 'normal'
                        ? 'bg-sky-500 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Normal User</span>
                  </div>
                  {activeRole === 'normal' && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                  Field Safety Operator
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold mt-1">
                  user1@gmail.com
                </div>
              </button>
            </div>

            {/* Active role permission helper info */}
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all ${
              activeRole === 'admin'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <span>{PRESET_ACCOUNTS[activeRole].accessSummary}</span>
            </div>

            {/* 4 Admins Picker (With 10 Allocated Workers each) */}
            {activeRole === 'admin' && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select from 4 Designated Admins (10 Allocated Workers Each):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FOUR_ADMINS.map(adm => (
                    <button
                      key={adm.id}
                      type="button"
                      onClick={() => {
                        setEmail(adm.email);
                        setPassword(adm.pass);
                        setOrgId(adm.orgId);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                        email.toLowerCase() === adm.email.toLowerCase()
                          ? 'bg-amber-500/15 border-amber-500 font-bold text-amber-950 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-[#141418] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{adm.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-semibold">10 Workers</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{adm.zone}</div>
                      <div className="text-[9px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">{adm.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Workers Picker (Mapped to Respective Admins) */}
            {activeRole === 'normal' && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Field Worker (Segregated to Respective Admin):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_WORKERS.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setEmail(w.email);
                        setPassword(w.pass);
                        setOrgId(w.orgId);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                        email.toLowerCase() === w.email.toLowerCase()
                          ? 'bg-sky-500/15 border-sky-500 font-bold text-sky-950 dark:text-sky-200'
                          : 'bg-slate-50 dark:bg-[#141418] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{w.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-semibold">Worker</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">Reports to: {w.supervisor}</div>
                      <div className="text-[9px] font-mono text-sky-600 dark:text-sky-400 mt-0.5">{w.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Admin-Provisioned Accounts if any exist */}
            {customAccounts.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Admin-Provisioned Accounts ({customAccounts.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {customAccounts.map((cu) => {
                    const isSelected = email.toLowerCase() === cu.email.toLowerCase();
                    return (
                      <button
                        key={cu.email}
                        type="button"
                        onClick={() => handleSelectCustomUser(cu)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                            : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-[#27272e] text-slate-700 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{cu.full_name || cu.email}</span>
                        <span className="text-[10px] opacity-75 font-mono">({cu.role_name || (cu.role === 'ADMINISTRATOR' ? 'Admin' : 'User')})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Forgot Password Notice */}
          {forgotPasswordNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                For security reset or credential recovery, please contact your Organization HSE Lead or System Administrator at <span className="font-mono text-amber-400">admin@petrosafe.com</span>.
              </div>
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="py-12 text-center space-y-3 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Authentication Successful
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Access granted as {activeRole === 'admin' ? 'Chief HSE Administrator' : 'Field Safety Operator'}. Loading platform...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Organization ID & Email Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Org ID */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1">
                    Org ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      placeholder="id001"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-[#27272e] text-xs font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g. admin1@gmail.com or user1@gmail.com"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-[#27272e] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password with Show/Hide Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter password"
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-[#27272e] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>Remember role</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
                  className="text-xs text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-amber-400 transition-colors font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Dynamic Login Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                    activeRole === 'admin'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {activeRole === 'admin' ? 'Login as Administrator' : 'Login as Normal User'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* ================= 1-CLICK QUICK-FILL DEMO LOGINS ================= */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Quick Demo Credentials:</span>
                  <span className="text-[10px] font-mono text-amber-500">Instant 1-Click Fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Admin 1-Click Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('admin')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                    title="Fill Admin credentials: admin1@gmail.com / Admin1@123"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white">Admin Demo</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">admin1@gmail.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded group-hover:bg-amber-500/30 shrink-0">
                      Fill
                    </span>
                  </button>

                  {/* Normal User 1-Click Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('normal')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/5 hover:bg-sky-500/15 border border-sky-500/20 hover:border-sky-500/40 text-left transition-all cursor-pointer group"
                    title="Fill Normal User credentials: user1@gmail.com / User1@123"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white">Normal User Demo</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">user1@gmail.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-500/20 px-2 py-0.5 rounded group-hover:bg-sky-500/30 shrink-0">
                      Fill
                    </span>
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

        {/* Bottom Security Note */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>256-Bit Encrypted OIL SIF Security Standard</span>
          </div>
        </div>

      </div>

    </div>
  );
}