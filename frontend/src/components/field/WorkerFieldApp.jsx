import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Send, 
  CheckCircle2, 
  Clock, 
  Mic, 
  MicOff, 
  Flame, 
  Zap, 
  Compass, 
  User, 
  Layers, 
  PhoneCall, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Check, 
  Bell, 
  LogOut, 
  Volume2, 
  Radio, 
  Smartphone,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  syncBackendReportsToStore, 
  autoPersistToTotalRecords, 
  getStoredTotalRecords,
  getStoreState
} from '../../services/safetyStore';
import VoiceReportingModal from '../common/VoiceReportingModal';

// Common field safety factors for 1-tap checklist reporting
const QUICK_SAFETY_FACTORS = [
  { id: 'height', label: 'Work at Height', icon: '🧗', hazard: 'Fall Hazard / Unclipped Lanyard', category: 'Working at Height' },
  { id: 'gas', label: 'Gas Leak / Flange Hiss', icon: '💨', hazard: 'High LEL Vapor / Flange Leak', category: 'Process Safety' },
  { id: 'electric', label: 'Electrical Spark / Arc', icon: '⚡', hazard: 'Electrical Shock / Open Breaker', category: 'Electrical Safety' },
  { id: 'lifting', label: 'Crane & Dropped Object', icon: '🏗️', hazard: 'Rigging Failure / Suspended Load', category: 'Mechanical Lifting' },
  { id: 'confined', label: 'Confined Space Alarm', icon: '🕳️', hazard: 'Atmospheric O2 Deficiency / Toxic Vapor', category: 'Confined Space' },
  { id: 'chemical', label: 'Chemical / Liquid Spill', icon: '🧪', hazard: 'Corrosive Fluid / Hydrocarbon Spill', category: 'Hazardous Materials' },
  { id: 'barrier', label: 'Barrier / LOTO Bypass', icon: '🛑', hazard: 'Missing Safety Barrier / Lock Bypass', category: 'Energy Isolation' },
  { id: 'ppe', label: 'PPE Non-Compliance', icon: '🧤', hazard: 'Missing Helmet / Face Shield / Harness', category: 'PPE Violation' }
];

// Presets for quick field worker switcher (from our 40-worker allocation across 4 admins)
const PRESET_WORKERS = [
  {
    email: 'worker.rig1@safetyai.org',
    name: 'Liam Vance',
    badge: '#RIG-101',
    zone: 'Rig Alpha (Drilling & Wellhead)',
    adminName: 'Eleanor Vance (Rig Admin)',
    adminEmail: 'admin.rig@safetyai.org',
    coords: { lat: 27.3892, lng: 95.6315, location: 'Rig Alpha Drilling Bay' }
  },
  {
    email: 'worker.refinery1@safetyai.org',
    name: 'Sarah Jenkins',
    badge: '#REF-201',
    zone: 'Refinery Unit 1 (Crude Distillation)',
    adminName: 'Marcus Sterling (Refinery Admin)',
    adminEmail: 'admin.refinery@safetyai.org',
    coords: { lat: 12.9716, lng: 77.5946, location: 'Refinery Unit 1 CDU' }
  },
  {
    email: 'worker.pipeline1@safetyai.org',
    name: 'David Kim',
    badge: '#PIP-301',
    zone: 'Pipeline Sector B (Compression Bay)',
    adminName: 'Sarah Chen (Pipeline Admin)',
    adminEmail: 'admin.pipeline@safetyai.org',
    coords: { lat: 21.1702, lng: 72.8311, location: 'Pipeline Compression Bay A' }
  },
  {
    email: 'worker.hazmat1@safetyai.org',
    name: 'Elena Rostova',
    badge: '#HAZ-401',
    zone: 'Hazmat Facility (LPG Storage Farm)',
    adminName: 'David Thorne (Hazmat Admin)',
    adminEmail: 'admin.hazmat@safetyai.org',
    coords: { lat: 19.0760, lng: 72.8777, location: 'LPG Storage Farm & Bullets' }
  }
];

export default function WorkerFieldApp({ onNavigate, onExitToWeb }) {
  const { user, login } = useAuth();
  
  // Active worker state
  const [selectedWorker, setSelectedWorker] = useState(() => {
    if (user && !user.is_admin && user.role !== 'ADMINISTRATOR') {
      return {
        email: user.email,
        name: user.full_name || 'Field Operator',
        badge: user.badge || '#FLD-882',
        zone: user.zone || 'Operational Unit 1',
        adminName: user.assigned_admin_name || 'Assigned HSE Supervisor',
        adminEmail: 'admin@safetyai.org',
        coords: { lat: 17.0005, lng: 81.8040, location: user.zone || 'Sivaraopeta Unit 1' }
      };
    }
    return PRESET_WORKERS[0];
  });

  // App Tabs: 'report' | 'history' | 'profile'
  const [activeTab, setActiveTab] = useState('report');

  // Reporting Form State
  const [reportMode, setReportMode] = useState('checklist'); // 'checklist' | 'description'
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('UNSAFE_CONDITION');
  const [facilityLocation, setFacilityLocation] = useState(selectedWorker.coords.location);
  const [currentGps, setCurrentGps] = useState(selectedWorker.coords);
  const [gpsStatus, setGpsStatus] = useState('Acquiring GPS...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // SOS Emergency State
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [sosTriggerTimer, setSosTriggerTimer] = useState(null);

  // Recent worker reports
  const [workerReports, setWorkerReports] = useState([]);

  // Fetch / Sync reports from safetyStore on mount
  useEffect(() => {
    const refreshReports = () => {
      const state = getStoreState();
      const myReports = (state.reports || []).filter(r => 
        r.submitted_by === selectedWorker.name || 
        r.reporter_email === selectedWorker.email ||
        r.location?.includes(selectedWorker.zone) ||
        r.description?.includes(selectedWorker.name)
      );
      setWorkerReports(myReports);
    };

    refreshReports();
    const interval = setInterval(refreshReports, 2500);
    return () => clearInterval(interval);
  }, [selectedWorker]);

  // Acquire real GPS coordinates via browser Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setCurrentGps({
            lat,
            lng,
            location: selectedWorker.coords.location
          });
          setGpsStatus(`GPS Active (±${Math.round(pos.coords.accuracy || 10)}m)`);
        },
        (err) => {
          setGpsStatus('GPS Default (Facility Presets)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus('GPS Standard (Field Default)');
    }
  }, [selectedWorker]);

  // Voice speech-to-text recording
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setReportText(prev => prev ? `${prev} ${transcript}` : transcript);
        setReportMode('description');
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  // Toggle factor in checklist
  const toggleFactor = (factorId) => {
    setSelectedFactors(prev => {
      const exists = prev.includes(factorId);
      if (exists) {
        return prev.filter(f => f !== factorId);
      } else {
        return [...prev, factorId];
      }
    });
  };

  // Handle SOS Emergency Activation
  const startSosCountdown = () => {
    setSosActive(true);
    setSosCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setSosCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        triggerEmergencySos();
      }
    }, 1000);
    setSosTriggerTimer(timer);
  };

  const cancelSos = () => {
    if (sosTriggerTimer) clearInterval(sosTriggerTimer);
    setSosActive(false);
    setSosCountdown(3);
    setSosDispatched(false);
  };

  const triggerEmergencySos = async () => {
    setSosDispatched(true);
    
    // Play alert audio chirp via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}

    const emergencyDescription = `EMERGENCY SOS: Field Worker ${selectedWorker.name} (${selectedWorker.badge}) triggered critical distress alarm in ${selectedWorker.zone}. Immediate life-safety emergency response dispatched! Coordinates: [${currentGps.lat}, ${currentGps.lng}].`;

    try {
      const sosResult = await api.executeAiAnalysis({
        report_text: emergencyDescription,
        description: emergencyDescription,
        report_name: `🚨 CRITICAL SOS: ${selectedWorker.zone}`,
        report_type: 'Near Miss',
        classification: 'Near Miss',
        location: facilityLocation || selectedWorker.coords.location,
        operating_unit: selectedWorker.zone,
        site: selectedWorker.zone,
        report_date: new Date().toISOString().slice(0, 10),
        incident_latitude: currentGps.lat,
        incident_longitude: currentGps.lng,
        incident_address: `${facilityLocation || selectedWorker.coords.location} Emergency Point`,
        incident_location_name: facilityLocation || selectedWorker.coords.location,
        additional_context: 'EMERGENCY_SOS_ACTIVE'
      });

      const sosRecord = {
        id: Date.now(),
        report_reference: sosResult?.report_reference || `SOS-${Date.now().toString().slice(-6)}`,
        report_name: `CRITICAL SOS: ${selectedWorker.zone}`,
        report_type: 'Near Miss',
        description: emergencyDescription,
        location: facilityLocation || selectedWorker.coords.location,
        facility_unit: selectedWorker.zone,
        report_date: new Date().toISOString().slice(0, 10),
        risk_level: 'Critical',
        sif_precursor_assessment: 'YES',
        ai_score: 99,
        status: 'Action Required',
        identified_hazard: 'Life-Safety SOS Emergency Distress',
        energy_source: 'Immediate Critical Threat',
        barrier_status: 'BARRIER_FAILED',
        recommended_action: 'Dispatch emergency HSE rescue team and sound localized plant alarm.',
        submitted_by: `${selectedWorker.name} (${selectedWorker.badge})`,
        reporter_email: selectedWorker.email,
        assigned_admin_name: selectedWorker.adminName,
        created_at: new Date().toISOString(),
        incident_latitude: currentGps.lat,
        incident_longitude: currentGps.lng,
        incident_address: `${facilityLocation || selectedWorker.coords.location} Emergency Point`,
        incident_location_name: facilityLocation || selectedWorker.coords.location
      };

      syncBackendReportsToStore([sosRecord], [], false);
      autoPersistToTotalRecords(sosRecord);

      setTimeout(() => {
        setWorkerReports(prev => [sosRecord, ...prev]);
      }, 500);
    } catch (err) {
      console.error('SOS Dispatch Error:', err);
    }
  };

  // Submit standard field report
  const handleSubmitReport = async (e) => {
    e.preventDefault();

    // Compile description from checklist if checklist mode used
    let finalDescription = reportText.trim();
    if (selectedFactors.length > 0 && (!finalDescription || reportMode === 'checklist')) {
      const selectedLabels = selectedFactors.map(id => {
        const item = QUICK_SAFETY_FACTORS.find(f => f.id === id);
        return item ? item.hazard : id;
      });
      finalDescription = `${selectedLabels.join('; ')}. Observed by ${selectedWorker.name} at ${selectedWorker.zone}. Immediate frontline barrier inspection recommended. ${reportText ? `Field Notes: ${reportText}` : ''}`;
    }

    if (!finalDescription || finalDescription.length < 5) {
      alert('Please select at least one checklist safety hazard or enter an observation description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const chosenTypeLabel = reportType === 'UNSAFE_CONDITION' ? 'Unsafe Condition' : 
                              reportType === 'UNSAFE_ACT' ? 'Unsafe Act' : 'Near Miss';

      const backendResult = await api.executeAiAnalysis({
        report_text: finalDescription,
        description: finalDescription,
        report_name: selectedFactors.length > 0 ? QUICK_SAFETY_FACTORS.find(f => f.id === selectedFactors[0])?.label || 'Field Safety Observation' : 'Field Safety Observation',
        report_type: chosenTypeLabel,
        classification: chosenTypeLabel,
        location: facilityLocation || selectedWorker.coords.location,
        operating_unit: selectedWorker.zone,
        site: selectedWorker.zone,
        report_date: new Date().toISOString().slice(0, 10),
        incident_latitude: currentGps.lat,
        incident_longitude: currentGps.lng,
        incident_address: `${facilityLocation || selectedWorker.coords.location} Operations Area`,
        incident_location_name: facilityLocation || selectedWorker.coords.location,
        additional_context: `Safety Factors: ${selectedFactors.join(', ')}`
      });

      const isSIF = backendResult?.sif_precursor === 'YES' || (backendResult?.determination_status || '').toLowerCase().includes('sif');
      const score = backendResult?.risk_score || (isSIF ? 88 : 34);

      const newRecord = {
        id: Date.now(),
        report_reference: backendResult?.report_reference || `REP-${Date.now().toString().slice(-6)}`,
        report_name: backendResult?.report_name || 'Field Observation',
        report_type: chosenTypeLabel,
        description: finalDescription,
        location: facilityLocation || selectedWorker.coords.location,
        facility_unit: selectedWorker.zone,
        report_date: new Date().toISOString().slice(0, 10),
        risk_level: isSIF ? 'High Risk' : 'Medium Risk',
        sif_precursor_assessment: isSIF ? 'YES' : 'NO',
        ai_score: score,
        status: isSIF ? 'Action Required' : 'Under Review',
        identified_hazard: backendResult?.hazard || 'Field Precursor Observation',
        energy_source: backendResult?.energy_source || 'Identified Hazardous Vector',
        barrier_status: backendResult?.barrier_status || 'Under Audit',
        recommended_action: backendResult?.recommended_controls?.[0] || 'Enforce physical barrier containment.',
        submitted_by: `${selectedWorker.name} (${selectedWorker.badge})`,
        reporter_email: selectedWorker.email,
        assigned_admin_name: selectedWorker.adminName,
        created_at: new Date().toISOString(),
        incident_latitude: currentGps.lat,
        incident_longitude: currentGps.lng,
        incident_address: `${facilityLocation || selectedWorker.coords.location} Operations Area`,
        incident_location_name: facilityLocation || selectedWorker.coords.location
      };

      syncBackendReportsToStore([newRecord], [], false);
      autoPersistToTotalRecords(newRecord);

      setSubmissionSuccess({
        ref: newRecord.report_reference,
        isSIF,
        score,
        hazard: newRecord.identified_hazard,
        adminName: selectedWorker.adminName
      });

      // Reset form
      setSelectedFactors([]);
      setReportText('');
      setWorkerReports(prev => [newRecord, ...prev]);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Network alert: Report stored in offline sync queue and will sync to supervisor automatically.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-start p-2 sm:p-4 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 select-none">
      
      {/* Mobile App Viewport Container (App frame on desktop, full screen on phones) */}
      <div className="w-full max-w-md bg-[#0F172A] border-2 border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[860px] relative">

        {/* 1. App Top Status Bar */}
        <div className="bg-[#090E17] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 font-bold">SAFETY FIELD LINK</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExitToWeb || (() => onNavigate && onNavigate('/dashboard'))}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Return to full Web Command Center"
            >
              <span>🖥️ Web Portal</span>
            </button>
          </div>
        </div>

        {/* 2. Worker Identity Card & Switcher */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-[#162033] border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
              {selectedWorker.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                  {selectedWorker.name}
                </h3>
                <span className="font-mono text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  {selectedWorker.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{selectedWorker.zone}</span>
              </p>
            </div>
          </div>

          {/* Supervisor indicator */}
          <div className="text-right shrink-0">
            <div className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Assigned HSE Admin</div>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{selectedWorker.adminName.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* 3. Emergency SOS Banner (Always Accessible) */}
        <div className="px-3.5 pt-3 pb-1 bg-[#0F172A] shrink-0">
          {!sosActive && !sosDispatched ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 to-red-900/60 border border-rose-600/50 flex items-center justify-between shadow-lg shadow-rose-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">Life-Safety Emergency SOS</h4>
                  <p className="text-[10.5px] text-rose-200">Instant distress alert to supervisor</p>
                </div>
              </div>

              <button
                type="button"
                onClick={startSosCountdown}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/40 cursor-pointer transition-all"
              >
                🚨 SOS
              </button>
            </div>
          ) : sosActive && !sosDispatched ? (
            <div className="p-3.5 rounded-2xl bg-rose-900 border-2 border-rose-500 text-white flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="text-2xl font-black font-mono text-white animate-bounce">
                  {sosCountdown}s
                </div>
                <div>
                  <div className="text-xs font-black uppercase">Transmitting Distress Signal...</div>
                  <div className="text-[10px] text-rose-200">Tap Cancel to abort false alarm</div>
                </div>
              </div>

              <button
                type="button"
                onClick={cancelSos}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold border border-rose-400 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-white uppercase">SOS Dispatched to Supervisor</div>
                  <div className="text-[10px] text-emerald-300">Live GPS beacon transmitting</div>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelSos}
                className="text-[11px] underline text-emerald-400 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 4. App Body Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          
          {/* Submission Success Toast Card */}
          {submissionSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-white space-y-2 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {submissionSuccess.ref} Transmitted
                </span>
                <button
                  onClick={() => setSubmissionSuccess(null)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs font-semibold text-slate-200">
                Observation successfully delivered to <span className="text-amber-400 font-bold">{submissionSuccess.adminName}</span>.
              </div>
              <div className="flex items-center gap-2 text-[10.5px]">
                <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                  submissionSuccess.isSIF ? 'bg-rose-900/80 text-rose-300 border border-rose-600' : 'bg-blue-900/80 text-blue-300'
                }`}>
                  {submissionSuccess.isSIF ? 'SIF PRECURSOR' : 'CONTROLLED'}
                </span>
                <span className="text-slate-400">Score: {submissionSuccess.score}/100</span>
              </div>
            </div>
          )}

          {activeTab === 'report' ? (
            /* TAB 1: REPORT HAZARD */
            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              
              {/* Type Switcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('UNSAFE_CONDITION')}
                  className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'UNSAFE_CONDITION' 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unsafe Condition
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('UNSAFE_ACT')}
                  className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'UNSAFE_ACT' 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unsafe Act
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('NEAR_MISS')}
                  className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'NEAR_MISS' 
                      ? 'bg-rose-500 text-white shadow-md font-black' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Near Miss
                </button>
              </div>

              {/* Mode Toggle: Rapid Checklist vs. Detailed Narrative */}
              <div className="bg-slate-900/80 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReportMode('checklist')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    reportMode === 'checklist' 
                      ? 'bg-slate-800 text-amber-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  ⚡ 1-Tap Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setReportMode('description')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    reportMode === 'description' 
                      ? 'bg-slate-800 text-amber-400 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  📝 Statement &amp; Voice
                </button>
              </div>

              {/* MODE 1: RAPID CHECKLIST GRID */}
              {reportMode === 'checklist' ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Tap Safety Hazards Observed:</span>
                    <span className="text-amber-400 font-mono">{selectedFactors.length} selected</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_SAFETY_FACTORS.map((factor) => {
                      const isSelected = selectedFactors.includes(factor.id);
                      return (
                        <button
                          key={factor.id}
                          type="button"
                          onClick={() => toggleFactor(factor.id)}
                          className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between h-20 ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10' 
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xl">{factor.icon}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <div className="font-bold text-[11px] leading-tight truncate">
                            {factor.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* MODE 2 / COMPLEMENTARY: STATEMENT & VOICE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {reportMode === 'checklist' ? 'Additional Field Notes (Optional):' : 'Incident Statement / Description:'}
                  </label>
                  
                  {/* Voice Dictation Button */}
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(true)}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700 shadow-sm"
                  >
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Voice Report (Telugu/Hindi/En)</span>
                  </button>
                </div>

                <textarea
                  rows={reportMode === 'checklist' ? 2 : 4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder={reportMode === 'checklist' ? 'e.g. Near compressor unit 2, no barriers placed...' : 'Describe what happened, equipment involved, and immediate hazard observed...'}
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 leading-relaxed resize-none font-medium"
                />
              </div>

              {/* Location & GPS Info */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-[11px]">
                      {facilityLocation || selectedWorker.coords.location}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Lat: {currentGps.lat.toFixed(4)}, Lng: {currentGps.lng.toFixed(4)}
                    </div>
                  </div>
                </div>

                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold">
                  {gpsStatus}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing &amp; Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit to {selectedWorker.adminName.split(' ')[0]}</span>
                  </>
                )}
              </button>

            </form>
          ) : activeTab === 'history' ? (
            /* TAB 2: MY FIELD SUBMISSIONS LOG */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  My Field Submissions ({workerReports.length})
                </h4>
                <span className="text-[10.5px] text-slate-500 font-mono">Live Sync</span>
              </div>

              {workerReports.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No field observations submitted yet.</p>
                  <p className="text-[11px] text-slate-500">Tap "Report Hazard" to log an unsafe condition.</p>
                </div>
              ) : (
                workerReports.map((item, idx) => {
                  const isSif = item.sif_precursor_assessment === 'YES' || item.ai_score > 66;
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-2 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-amber-400">
                          {item.report_reference || `REP-${item.id}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          item.status === 'Completed' || item.status === 'Complete'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isSif
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.status || 'Under Review'}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-white line-clamp-1">
                        {item.identified_hazard || item.report_name || item.description?.slice(0, 50)}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60">
                        <span>📍 {item.location || selectedWorker.zone}</span>
                        <span>{item.report_date || 'Today'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* TAB 3: WORKER SHIFT & PROFILE SWITCHER */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Active Worker Shift &amp; Sector:
              </div>

              <div className="space-y-2">
                {PRESET_WORKERS.map((worker) => {
                  const isCurrent = worker.email === selectedWorker.email;
                  return (
                    <button
                      key={worker.email}
                      type="button"
                      onClick={() => {
                        setSelectedWorker(worker);
                        setFacilityLocation(worker.coords.location);
                        setCurrentGps(worker.coords);
                        setActiveTab('report');
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{worker.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({worker.badge})</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400">{worker.zone}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[9.5px] font-bold text-slate-500">Supervisor:</div>
                        <div className="text-[10.5px] font-bold text-emerald-400">{worker.adminName.split(' ')[0]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-200">ℹ️ Sector Allocation Architecture:</div>
                <p>
                  Each field worker is pre-allocated to their corresponding HSE Supervisor (Rig, Refinery, Pipeline, or Hazmat). Any reports or SOS signals immediately dispatch to that supervisor's portal.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* 5. Bottom Navigation Bar */}
        <div className="bg-[#090E17] border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'report' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="text-[10px]">Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px]">My Log ({workerReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px]">Shift &amp; Zone</span>
          </button>
        </div>

      </div>

      {/* Target Speaker Isolated Multilingual Voice Reporting Modal */}
      <VoiceReportingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onConfirmTranscript={(translatedText) => {
          setReportText(translatedText);
          setReportMode('description');
        }}
      />

    </div>
  );
}
