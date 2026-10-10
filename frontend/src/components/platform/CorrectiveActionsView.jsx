import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  ArrowRight, 
  Filter, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  Zap,
  Wrench,
  Flame,
  HeartPulse,
  Cpu,
  Lock,
  Upload,
  RefreshCw,
  PlusCircle,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStoreState } from '../../services/safetyStore';

const DEPARTMENTS = [
  { id: 'ALL', name: 'All Departments', icon: Layers, color: 'text-slate-700 bg-slate-100 border-slate-200' },
  { id: 'Mechanical Maintenance', name: 'Mechanical Maintenance', icon: Wrench, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'Electrical Maintenance', name: 'Electrical Maintenance', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'Instrumentation & Control', name: 'Instrumentation & Control', icon: Cpu, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'Fire & Rescue', name: 'Fire & Rescue', icon: Flame, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 'Medical & Ambulance', name: 'Medical & Ambulance', icon: HeartPulse, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'HSE & Safety Investigation', name: 'HSE & Safety Investigation', icon: ShieldCheck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
];

export default function CorrectiveActionsView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [kpis, setKpis] = useState({
    total_tasks: 0,
    unassigned_or_awaiting_claim: 0,
    in_progress: 0,
    awaiting_verification: 0,
    rework_requested: 0,
    verified_and_closed: 0
  });

  // Action Modals State
  const [activeModal, setActiveModal] = useState(null); // 'SUBMIT_VERIFY', 'ADMIN_VERIFY', 'CREATE_TASK'
  const [selectedTask, setSelectedTask] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Submit Verification Form
  const [workNotes, setWorkNotes] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceFileUrl, setEvidenceFileUrl] = useState('');

  // Admin Verification Form
  const [verifyDecision, setVerifyDecision] = useState('APPROVE');
  const [reworkReason, setReworkReason] = useState('');

  // New Task Form
  const [allReports, setAllReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [newTaskDept, setNewTaskDept] = useState('Mechanical Maintenance');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('P2 - High');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // Fetch Tasks and Reports
  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const [taskList, kpiData, reportList] = await Promise.all([
        api.getResponseTasks(),
        api.getResponseTaskKPIs(),
        api.getReports().catch(() => [])
      ]);
      setTasks(Array.isArray(taskList) ? taskList : []);
      if (kpiData) setKpis(kpiData);
      if (Array.isArray(reportList)) setAllReports(reportList);
    } catch (err) {
      console.warn('Error loading response tasks from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  // When selecting report in create task modal, fetch AI recommendation
  useEffect(() => {
    if (selectedReportId) {
      api.getTaskRecommendation(selectedReportId).then((recs) => {
        if (Array.isArray(recs) && recs.length > 0) {
          setRecommendations(recs);
          setNewTaskDept(recs[0].department);
        }
      }).catch(() => {});
    } else {
      setRecommendations([]);
    }
  }, [selectedReportId]);

  // Atomic Exclusive Task Claim
  const handleAcceptTask = async (task) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      await api.acceptResponseTask(task.id);
      await fetchTasksData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to claim task.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Work for Verification
  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!selectedTask || !workNotes.trim()) return;
    setActionLoading(true);
    try {
      await api.submitTaskVerification(selectedTask.id, {
        work_notes: workNotes,
        evidence_notes: evidenceNotes,
        evidence_file_url: evidenceFileUrl
      });
      setActiveModal(null);
      setWorkNotes('');
      setEvidenceNotes('');
      setEvidenceFileUrl('');
      await fetchTasksData();
    } catch (err) {
      setErrorMessage(err.message || 'Error submitting verification.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Verification / Rework
  const handleAdminVerify = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (verifyDecision === 'REWORK' && !reworkReason.trim()) {
      setErrorMessage('Please provide instructions for the requested rework.');
      return;
    }
    setActionLoading(true);
    try {
      await api.verifyResponseTask(selectedTask.id, {
        decision: verifyDecision,
        rework_reason: reworkReason
      });
      setActiveModal(null);
      setReworkReason('');
      await fetchTasksData();
    } catch (err) {
      setErrorMessage(err.message || 'Error executing verification.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Response Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedReportId || !newTaskTitle.trim()) return;
    setActionLoading(true);
    try {
      await api.createResponseTask({
        report_id: parseInt(selectedReportId),
        department: newTaskDept,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        due_date: newTaskDueDate || new Date().toISOString().slice(0, 10)
      });
      setActiveModal(null);
      setSelectedReportId('');
      setNewTaskTitle('');
      setNewTaskDesc('');
      await fetchTasksData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch task.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      return true;
    });
  }, [tasks, selectedDept, selectedStatus]);

  // Grouping check for multi-team tasks
  const multiTeamReports = useMemo(() => {
    const counts = {};
    tasks.forEach(t => {
      counts[t.report_id] = (counts[t.report_id] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE6E1]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1EE] border border-[#FFE0D6] flex items-center justify-center text-[#FF5A36] shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight">
              Response Team Dispatch &amp; Verification Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-12">
            Structured Department Routing • Atomic Exclusive Acceptance • Multi-Team Coordination • Admin Verification Sign-off
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTasksData}
            className="p-2.5 rounded-xl bg-white border border-[#EAE6E1] text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer transition-all"
            title="Refresh Task Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF5A36]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setActiveModal('CREATE_TASK');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e04826] text-white text-xs font-bold font-mono tracking-wide flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign Response Task</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 6 KPI Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Total Queue', count: kpis.total_tasks || tasks.length, sub: 'All incident tasks', color: 'text-slate-900 bg-white border-slate-200' },
          { label: 'Awaiting Claim', count: kpis.unassigned_or_awaiting_claim, sub: 'Unclaimed queue', color: 'text-amber-900 bg-amber-50/70 border-amber-200' },
          { label: 'In Progress', count: kpis.in_progress, sub: 'Claimed & locked', color: 'text-blue-900 bg-blue-50/70 border-blue-200' },
          { label: 'Needs Verification', count: kpis.awaiting_verification, sub: 'Awaiting admin sign-off', color: 'text-purple-900 bg-purple-50/70 border-purple-200' },
          { label: 'Rework Required', count: kpis.rework_requested, sub: 'Action sent back', color: 'text-rose-900 bg-rose-50/70 border-rose-200' },
          { label: 'Verified & Closed', count: kpis.verified_and_closed, sub: 'Officially certified', color: 'text-emerald-900 bg-emerald-50/70 border-emerald-200' },
        ].map((k, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${k.color}`}>
            <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-75">{k.label}</div>
            <div className="text-2xl font-black font-heading my-1">{k.count}</div>
            <div className="text-[10px] font-mono opacity-80">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 6 Department Directory Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
          <span>Filter By Response Department:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            const isSelected = selectedDept === dept.id;
            const deptCount = dept.id === 'ALL' ? tasks.length : tasks.filter(t => t.department === dept.id).length;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedDept(dept.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-[#EAE6E1] hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                <span>{dept.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-slate-800 text-orange-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {deptCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lifecycle Status Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Lifecycle States' },
            { id: 'ASSIGNED', label: 'Assigned / Unclaimed' },
            { id: 'ACCEPTED', label: 'In Progress (Claimed)' },
            { id: 'SUBMITTED_FOR_VERIFICATION', label: 'Awaiting Admin Verification' },
            { id: 'REWORK_REQUESTED', label: 'Rework Requested' },
            { id: 'VERIFIED', label: 'Verified & Certified' }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg font-bold font-mono text-[11px] cursor-pointer transition-all border ${
                selectedStatus === st.id 
                  ? 'bg-orange-50 text-[#FF5A36] border-orange-300 shadow-2xs font-black' 
                  : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing <strong>{filteredTasks.length}</strong> of {tasks.length} total tasks
        </span>
      </div>

      {/* Tasks Queue Cards */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mx-auto border border-orange-200">
              <CheckSquare className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-base">No Response Tasks in this Filter View</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Corrective response tasks appear here when incidents are assigned to departments. Click "Assign Response Task" above to dispatch a new task.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const hasMultipleLinked = multiTeamReports[task.report_id] > 1;
            const isAccepted = task.status === 'ACCEPTED';
            const isSubmitted = task.status === 'SUBMITTED_FOR_VERIFICATION';
            const isRework = task.status === 'REWORK_REQUESTED';
            const isVerified = task.status === 'VERIFIED';
            const isUnclaimed = task.status === 'ASSIGNED' || task.status === 'UNASSIGNED';

            const DeptObj = DEPARTMENTS.find(d => d.id === task.department) || DEPARTMENTS[1];
            const DeptIcon = DeptObj.icon;

            return (
              <div 
                key={task.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#EAE6E1] hover:border-orange-300 transition-all shadow-xs space-y-4 text-slate-800"
              >
                {/* Top Header: Task Reference, Department, Priority & Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-slate-900 bg-stone-100 px-3 py-1 rounded-xl border border-stone-300">
                      {task.task_reference}
                    </span>

                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${DeptObj.color}`}>
                      <DeptIcon className="w-3.5 h-3.5" />
                      <span>{task.department}</span>
                    </span>

                    <span className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold font-mono uppercase border ${
                      task.priority.includes('P1') ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {task.priority}
                    </span>

                    {hasMultipleLinked && (
                      <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Multi-Team Linked Incident</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black font-mono uppercase tracking-wide border flex items-center gap-1.5 ${
                      isVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      isRework ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse' :
                      isSubmitted ? 'bg-purple-50 text-purple-800 border-purple-300' :
                      isAccepted ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isRework && <RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                      {isSubmitted && <Clock className="w-3.5 h-3.5 text-purple-600" />}
                      {isAccepted && <Lock className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{task.status.replaceAll('_', ' ')}</span>
                    </span>

                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {task.due_date || 'Standard SLA'}
                    </span>
                  </div>
                </div>

                {/* Main Content Scope */}
                <div>
                  <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 tracking-tight">
                    {task.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {task.description}
                  </p>
                  <div className="mt-2 text-xs font-mono text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Incident Ref: <strong className="text-slate-800">{task.report_reference}</strong></span>
                    <span>&bull;</span>
                    <span>Location: <strong className="text-slate-800">{task.location || 'Industrial Plant Unit'}</strong></span>
                  </div>
                </div>

                {/* Section 5: Atomic Exclusive Claiming Information */}
                {isAccepted && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Exclusively Claimed &amp; Locked by: <strong className="font-bold text-blue-900">{task.accepted_by_name || 'Frontline Responder'}</strong>
                        {task.accepted_at && ` at ${new Date(task.accepted_at).toLocaleTimeString()}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md font-bold">
                      Work In Progress
                    </span>
                  </div>
                )}

                {/* Section 6: Evidence & Verification Submission Preview */}
                {(isSubmitted || isVerified || isRework) && task.work_notes && (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                    <div className="font-bold uppercase tracking-wider text-slate-700 font-heading flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#FF5A36]" />
                        <span>Work Completed &amp; Evidence Documentation:</span>
                      </span>
                      {task.submitted_for_verification_at && (
                        <span className="font-mono text-[10px] text-slate-500 font-normal">
                          Submitted: {new Date(task.submitted_for_verification_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-semibold bg-white p-3 rounded-xl border border-stone-200 leading-relaxed">
                      {task.work_notes}
                    </p>
                    {task.evidence_notes && (
                      <p className="text-slate-600 font-medium italic">
                        <strong>Evidence Notes:</strong> {task.evidence_notes}
                      </p>
                    )}
                    {task.evidence_file_url && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">Attached Photo Evidence:</span>
                        <a 
                          href={task.evidence_file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#FF5A36] underline hover:text-[#e04826]"
                        >
                          View Inspection Document ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Section 6.2: Admin Rework Warning Banner */}
                {isRework && task.rework_reason && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-black text-rose-950 uppercase tracking-wide flex items-center gap-2 font-heading">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>ADMIN REWORK REQUIRED — CORRECTIVE ACTION REJECTED</span>
                    </div>
                    <p className="text-rose-900 font-medium leading-relaxed">
                      {task.rework_reason}
                    </p>
                    {task.rework_requested_at && (
                      <div className="text-[10px] font-mono text-rose-700 pt-1">
                        Requested at: {new Date(task.rework_requested_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 6.3: Officially Verified Stamp */}
                {isVerified && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Officially Verified &amp; Signed Off by: <strong className="font-bold text-emerald-900">{task.verified_by_name || 'Chief Safety Officer'}</strong>
                        {task.verified_at && ` on ${new Date(task.verified_at).toLocaleDateString()}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-black">
                      Verified Complete
                    </span>
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-100">
                  <div className="text-xs text-slate-500 font-mono">
                    Assigned by: <strong className="text-slate-800">{task.assigned_by_name || 'Safety Command Admin'}</strong>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action 1: Atomic Claim Button for Unclaimed Tasks */}
                    {isUnclaimed && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAcceptTask(task)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Accept &amp; Claim Task</span>
                      </button>
                    )}

                    {/* Action 2: Submit Verification for In-Progress / Reworked Tasks */}
                    {(isAccepted || isRework) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setWorkNotes(task.work_notes || '');
                          setEvidenceNotes(task.evidence_notes || '');
                          setEvidenceFileUrl(task.evidence_file_url || '');
                          setErrorMessage('');
                          setActiveModal('SUBMIT_VERIFY');
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Work for Verification</span>
                      </button>
                    )}

                    {/* Action 3: Admin Review & Approve / Rework Button */}
                    {isSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setVerifyDecision('APPROVE');
                          setReworkReason('');
                          setErrorMessage('');
                          setActiveModal('ADMIN_VERIFY');
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-[#FF5A36] hover:from-orange-600 hover:to-[#e04826] text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Verify Work</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Submit Work For Verification Modal */}
      {/* ========================================================================= */}
      {activeModal === 'SUBMIT_VERIFY' && selectedTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-heading text-slate-900">
                    Submit Work for Official Verification
                  </h3>
                  <div className="text-xs font-mono text-slate-500">{selectedTask.task_reference} • {selectedTask.department}</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  Corrective Action Work Notes (Required)
                </label>
                <textarea
                  rows={4}
                  required
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Detail the mechanical, electrical, or procedural actions taken to remediate the hazard..."
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  Evidence Documentation &amp; Test Measurements
                </label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="e.g. Torque values verified, megger insulation resistance > 500 MOhm, hydrostatic test pressure held for 30 mins..."
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  Evidence Photo / Document Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceFileUrl}
                  onChange={(e) => setEvidenceFileUrl(e.target.value)}
                  placeholder="https://... photo or scanned permit link"
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !workNotes.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold font-mono tracking-wide shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Submitting...' : 'Submit to Admin for Sign-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Admin Verification & Rework Modal */}
      {/* ========================================================================= */}
      {activeModal === 'ADMIN_VERIFY' && selectedTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF5A36] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-heading text-slate-900">
                    Admin Verification &amp; Remediation Review
                  </h3>
                  <div className="text-xs font-mono text-slate-500">{selectedTask.task_reference} • {selectedTask.department}</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Completed Work Review Box */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-700 uppercase tracking-wider font-heading">
                Submitted Work Notes from Responder:
              </div>
              <p className="text-slate-900 font-semibold leading-relaxed">
                {selectedTask.work_notes || 'No work notes provided'}
              </p>
              {selectedTask.evidence_notes && (
                <div className="text-slate-600 font-normal pt-1">
                  <strong>Evidence:</strong> {selectedTask.evidence_notes}
                </div>
              )}
            </div>

            <form onSubmit={handleAdminVerify} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-2 font-heading">
                  Verifier Determination
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyDecision('APPROVE')}
                    className={`p-3 rounded-2xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      verifyDecision === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-stone-200 text-slate-600 hover:bg-stone-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve &amp; Verify</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifyDecision('REWORK')}
                    className={`p-3 rounded-2xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      verifyDecision === 'REWORK'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                        : 'bg-white border-stone-200 text-slate-600 hover:bg-stone-50'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Request Rework</span>
                  </button>
                </div>
              </div>

              {verifyDecision === 'APPROVE' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                  ✓ <strong>Verification Sign-off Notice:</strong> Marking this task verified records your administrative seal. If all other response tasks under parent incident <strong>{selectedTask.report_reference}</strong> are complete, the entire incident report will officially be closed.
                </div>
              )}

              {verifyDecision === 'REWORK' && (
                <div>
                  <label className="block font-bold text-rose-900 uppercase tracking-wide mb-1 font-heading">
                    Rework Correction Instructions (Required)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    placeholder="Specify why the repair was insufficient and what exact corrections are needed before sign-off..."
                    className="w-full p-3 rounded-xl bg-rose-50/50 border border-rose-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (verifyDecision === 'REWORK' && !reworkReason.trim())}
                  className={`px-5 py-2 rounded-xl text-white font-bold font-mono tracking-wide shadow-sm disabled:opacity-50 cursor-pointer ${
                    verifyDecision === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : verifyDecision === 'APPROVE' ? 'Confirm Official Verification' : 'Return for Rework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Assign New Response Task with AI Department Recommendation */}
      {/* ========================================================================= */}
      {activeModal === 'CREATE_TASK' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF5A36] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-heading text-slate-900">
                    Assign Response Team Corrective Action
                  </h3>
                  <div className="text-xs font-mono text-slate-500">Dispatch Department Task with AI Routing Rules</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* Select Incident Report */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  1. Target Incident Safety Report
                </label>
                <select
                  required
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#FF5A36]"
                >
                  <option value="">-- Select Parent Safety Incident Report --</option>
                  {allReports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.report_reference} &bull; {r.location} &bull; {(r.description || '').slice(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Department Recommendation Box */}
              {recommendations.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>AI Recommended Response Department:</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 font-mono text-sm">
                      {recommendations[0].department}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-orange-200 text-orange-900">
                      {Math.round(recommendations[0].confidence * 100)}% Confidence Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {recommendations[0].rationale}
                  </p>
                </div>
              )}

              {/* Department Selection */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  2. Responsible Response Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENTS.filter(d => d.id !== 'ALL').map((dept) => {
                    const Icon = dept.icon;
                    const isSelected = newTaskDept === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setNewTaskDept(dept.id)}
                        className={`p-2.5 rounded-xl border text-left text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-[#FAF8F5] text-slate-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                        <span>{dept.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  3. Corrective Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Hydrotest 280-bar high-pressure flange and restore isolation valve"
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              {/* Scope Description */}
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                  4. Scope of Work &amp; Mandatory Engineering Remediation
                </label>
                <textarea
                  rows={3}
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Specify inspection scope, PPE tier, energy lockout requirements, and parts to be replaced..."
                  className="w-full p-3 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                    Priority Tier
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-bold focus:bg-white focus:outline-none"
                  >
                    <option value="P1 - Critical">P1 - Critical (24-Hour SLA)</option>
                    <option value="P2 - High">P2 - High (48-Hour SLA)</option>
                    <option value="P3 - Medium">P3 - Medium (7-Day SLA)</option>
                    <option value="P4 - Low">P4 - Low (14-Day SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wide mb-1 font-heading">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-300 text-slate-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedReportId || !newTaskTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#e04826] text-white font-bold font-mono tracking-wide shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Dispatching...' : 'Dispatch Task to Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
