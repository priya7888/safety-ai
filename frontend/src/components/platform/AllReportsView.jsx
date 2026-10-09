import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  ChevronRight, 
  MapPin, 
  FileText,
  Sparkles,
  Eye,
  AlertTriangle,
  Calendar,
  X,
  ArrowRight,
  UploadCloud,
  Building2
} from 'lucide-react';
import FullAnalysisModal from './FullAnalysisModal';
import { getStoreState, subscribeSafetyStore, syncBackendReportsToStore } from '../../services/safetyStore';
import { api } from '../../services/api';

export default function AllReportsView({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    // 1. Initialize immediately from local reactive store
    const storeState = getStoreState();
    if (storeState.isWiped) {
      setReports([]);
    } else if (storeState.reports && storeState.reports.length > 0) {
      setReports(storeState.reports);
    } else {
      setReports([]);
    }

    // 2. Fetch all persisted reports from backend to guarantee consistency on load/refresh
    const syncBackendReports = async () => {
      try {
        const [backendReports, dashboardData] = await Promise.all([
          api.getReports(),
          api.getDashboardData()
        ]);
        if (Array.isArray(backendReports)) {
          setTotalReports(dashboardData?.total_reports ?? backendReports.length);
          syncBackendReportsToStore(backendReports, [], false);
        }
      } catch (err) {
        console.warn('Backend reports sync on AllReportsView deferred:', err.message);
      }
    };
    syncBackendReports();

    // 3. Subscribe to safetyStore updates
    const unsub = subscribeSafetyStore((newState) => {
      if (newState.isWiped) {
        setReports([]);
      } else if (newState.reports) {
        setReports(newState.reports);
      }
    });

    return unsub;
  }, []);

  const filteredReports = reports.filter((r) => {
    // Search Term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (r.report_reference || '').toLowerCase().includes(q) ||
                    (r.description || '').toLowerCase().includes(q) ||
                    (r.location || '').toLowerCase().includes(q) ||
                    (r.identified_hazard || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Risk Filter
    if (riskFilter !== 'ALL' && (r.risk_level || '').toLowerCase() !== riskFilter.toLowerCase()) {
      return false;
    }

    // Type Filter (matches both "Near Miss" and "NEAR_MISS")
    if (typeFilter !== 'ALL') {
      const cleanType = (r.report_type || '').toLowerCase().replace(/[\s_-]/g, '');
      const cleanFilter = typeFilter.toLowerCase().replace(/[\s_-]/g, '');
      if (cleanType !== cleanFilter) {
        return false;
      }
    }

    // Site Filter
    if (siteFilter !== 'ALL' && !(r.location || '').toLowerCase().includes(siteFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-800 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 border border-orange-200/60 text-[#FF5A36]">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
              Safety Observation &amp; Incident Records
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise database of audited field reports with neural energy vector ratings and precursor status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 font-medium">
            Showing <strong className="text-[#FF5A36]">{filteredReports.length}</strong> of {totalReports} records
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white border border-[#EAE6E1] p-5 shadow-sm space-y-4 text-slate-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Report ID, description, hazard, or plant unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FBF9F6] border border-stone-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FF5A36] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Risk Level */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#FBF9F6] border border-stone-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-[#FF5A36] transition-all"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Report Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#FBF9F6] border border-stone-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-[#FF5A36] transition-all"
            >
              <option value="ALL">All Report Types</option>
              <option value="Near Miss">Near Miss</option>
              <option value="Unsafe Act">Unsafe Act</option>
              <option value="Unsafe Condition">Unsafe Condition</option>
            </select>

            {/* Site Filter */}
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#FBF9F6] border border-stone-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-[#FF5A36] transition-all"
            >
              <option value="ALL">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
              <option value="Unit 3">Unit 3</option>
              <option value="Unit 4">Unit 4</option>
            </select>

          </div>

        </div>
      </div>

      {/* Reports Card List in Exact Weak Signals Manner */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-stone-200 text-xs text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mx-auto border border-orange-200">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-base">No Safety Reports Logged Yet</p>
            <p className="text-slate-500 max-w-md mx-auto text-xs">
              Existing static data has been cleared. Ingest your safety register via <strong>Bulk Upload</strong> to start analyzing reports starting from today.
            </p>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/bulk-upload')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#e64a27] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Bulk Safety Ingestion</span>
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE6E1] text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700 text-sm">No safety reports found matching the selected filters.</p>
            <p className="text-slate-400">Try adjusting your search query or reset filter dropdowns.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id || report.report_reference}
              className="rounded-2xl bg-white border border-[#EAE6E1] hover:border-orange-300 p-6 shadow-sm space-y-4 transition-all duration-300 text-slate-800"
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                    {report.report_reference}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-600" />
                    {report.location}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {report.report_date}
                  </span>
                  {report.sif_precursor_assessment === 'YES' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      SIF Precursor (Risk Score: {report.ai_score || 85}/100)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Routine Observation (Risk Score: {report.ai_score || 25}/100)
                    </span>
                  )}
                </div>
              </div>

              {/* Headline & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {report.identified_hazard || report.report_reference}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B4A] to-[#FF5A36] hover:from-[#ff5934] hover:to-[#e64a27] text-white font-bold text-xs shadow-md shadow-orange-500/20 shrink-0 cursor-pointer flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {report.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Detailed Analysis Modal */}
      {selectedReport && (
        <FullAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

    </div>
  );
}
