import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Zap, 
  AlertTriangle, 
  Cpu, 
  CheckSquare, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  ShieldAlert,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Clock,
  ChevronDown,
  Lightbulb,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  X,
  MapPin,
  Building2,
  Search,
  Flame,
  Minus,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  getStoreState, 
  subscribeSafetyStore, 
  getDashboardMetrics, 
  getTodayDateString,
  clearAllSafetyData,
  syncBackendReportsToStore
} from '../../services/safetyStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardView({ onNavigate }) {
  const [storeState, setStoreState] = useState(getStoreState());
  const [storeMetrics, setStoreMetrics] = useState(getDashboardMetrics());
  const [backendMetrics, setBackendMetrics] = useState(null);

  useEffect(() => {
    // Load dynamic metrics directly from the authenticated backend database
    api.getDashboardData()
      .then(data => {
        if (data) {
          setBackendMetrics(data);
          if (data.total_reports === 0) {
            clearAllSafetyData();
          }
        }
      })
      .catch(() => {});

    api.getReports()
      .then(backendReports => {
        if (Array.isArray(backendReports)) {
          if (backendReports.length === 0) {
            clearAllSafetyData();
          } else {
            syncBackendReportsToStore(backendReports, [], true);
          }
        }
      })
      .catch(() => {});

    const unsub = subscribeSafetyStore((newState) => {
      setStoreState(newState);
      setStoreMetrics(getDashboardMetrics());
      api.getDashboardData()
        .then(data => {
          if (data) setBackendMetrics(data);
        })
        .catch(() => {});
    });
    return unsub;
  }, []);

  const [trendRange, setTrendRange] = useState('7 Days');
  const [activeHazard, setActiveHazard] = useState(null);
  const [activeClassification, setActiveClassification] = useState(null);
  const [donutHoverIndex, setDonutHoverIndex] = useState(null);
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [currentTodayDate, setCurrentTodayDate] = useState(() => getTodayDateString());

  // Automatically update daily date when the clock crosses midnight (after 12 AM)
  useEffect(() => {
    const checkDateInterval = setInterval(() => {
      const nowStr = getTodayDateString();
      setCurrentTodayDate(prev => (prev !== nowStr ? nowStr : prev));
    }, 30000);

    return () => clearInterval(checkDateInterval);
  }, []);

  // Dynamic weak signals loaded solely from the backend
  const [weakSignalSearch, setWeakSignalSearch] = useState('');
  const [weakSignalsList, setWeakSignalsList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getWeakSignals()
      .then((data) => {
        if (isMounted && data?.weak_signals) {
          setWeakSignalsList(data.weak_signals);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const filteredWeakSignals = weakSignalsList
    .filter((sig) => {
      const q = weakSignalSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        (sig.title || '').toLowerCase().includes(q) ||
        (sig.category || '').toLowerCase().includes(q) ||
        (sig.signal_id || '').toLowerCase().includes(q) ||
        (sig.energy_source || '').toLowerCase().includes(q) ||
        (sig.barrier_status || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 6);


  // Interactive Submit Report Card State
  const [quickCategory, setQuickCategory] = useState('Near Miss');
  const [quickUnit, setQuickUnit] = useState('Unit 1');
  const [quickText, setQuickText] = useState('');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickSubmitted, setQuickSubmitted] = useState(false);

  const quickCategories = [
    {
      id: 'Near Miss',
      title: 'Near Miss',
      sub: 'High-energy release',
      icon: Zap,
      iconColor: 'text-[#FF5A36]',
      iconBg: 'bg-orange-100/80',
      energy: 'Gravity / High Kinetic Energy',
      conf: '96.2%'
    },
    {
      id: 'Unsafe Act',
      title: 'Unsafe Act',
      sub: 'LOTO / PPE bypass',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100/80',
      energy: 'Electrical / Arc Flash Vector',
      conf: '93.5%'
    },
    {
      id: 'Hazard Condition',
      title: 'Hazard Condition',
      sub: 'Degraded barriers',
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100/80',
      energy: 'Pressure / Flange Leak Vector',
      conf: '94.8%'
    },
    {
      id: 'Barrier Defect',
      title: 'Barrier Defect',
      sub: 'Equipment anomalies',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100/80',
      energy: 'Mechanical / Rigging Degradation',
      conf: '91.4%'
    }
  ];

  const activeQuickMeta = quickCategories.find(c => c.id === quickCategory) || quickCategories[0];

  const handleQuickSubmit = (e) => {
    e?.preventDefault();
    setIsQuickSubmitting(true);
    setTimeout(() => {
      setIsQuickSubmitting(false);
      setQuickSubmitted(true);
      setTimeout(() => {
        setQuickSubmitted(false);
        setQuickText('');
        handleNav('/ai-analysis');
      }, 900);
    }, 800);
  };

  const handleNav = (path) => {
    if (onNavigate) onNavigate(path);
  };

  const handleBarClick = (entry) => {
    const cat = entry?.shortName || entry?.category;
    if (!cat) return;
    setActiveClassification(null);
    setActiveHazard(prev => prev === cat ? null : cat);
  };

  const handleClassificationClick = (name) => {
    if (!name) return;
    setActiveHazard(null);
    setActiveClassification(prev => prev === name ? null : name);
  };

  const clearFilters = () => {
    setActiveHazard(null);
    setActiveClassification(null);
  };

  // Helper categorizers for dynamic hazard mapping from uploaded reports
  const categorizeHazard = (text) => {
    const t = (text || '').toLowerCase();
    if (t.includes('gas') || t.includes('explosion') || t.includes('flange') || t.includes('blowout') || t.includes('pressure') || t.includes('lpg')) return 'Pressure & Flammable Gas';
    if (t.includes('crane') || t.includes('rigging') || t.includes('load') || t.includes('hoist') || t.includes('casing') || t.includes('sling')) return 'Lifting Operations & Rigging';
    if (t.includes('electric') || t.includes('loto') || t.includes('substation') || t.includes('switchboard') || t.includes('arc flash') || t.includes('grounding')) return 'Electrical Energy & LOTO';
    if (t.includes('fall') || t.includes('height') || t.includes('scaffold') || t.includes('ladder')) return 'Working at Height';
    if (t.includes('weld') || t.includes('hot work') || t.includes('fire') || t.includes('spark') || t.includes('thermal') || t.includes('steam')) return 'Hot Work & Thermal Fire';
    if (t.includes('confined') || t.includes('toxic') || t.includes('h2s') || t.includes('asphyxiation') || t.includes('chemical') || t.includes('acid')) return 'Toxic & Confined Space';
    if (t.includes('pulley') || t.includes('pinch') || t.includes('machinery') || t.includes('grating') || t.includes('hydraulic') || t.includes('mechanical')) return 'Mechanical & Process Safety';
    return 'General Operational Safety';
  };

  const getShortCategory = (cat) => {
    if (cat.includes('Pressure') || cat.includes('Gas')) return 'Pressure';
    if (cat.includes('Lifting')) return 'Lifting';
    if (cat.includes('Electrical')) return 'Electrical';
    if (cat.includes('Height')) return 'Height';
    if (cat.includes('Hot Work') || cat.includes('Fire')) return 'Hot Work';
    if (cat.includes('Toxic') || cat.includes('Confined')) return 'Confined';
    if (cat.includes('Mechanical')) return 'Mechanical';
    return 'General';
  };

  // Unified active reports: strictly 0 if backend reports 0 or store reports are wiped
  const activeReports = React.useMemo(() => {
    if (backendMetrics && backendMetrics.total_reports === 0) {
      return [];
    }
    if (storeState.isWiped) {
      return [];
    }
    return storeState.reports || [];
  }, [backendMetrics, storeState.isWiped, storeState.reports]);

  // 1. Hazard Categories Breakdown Data (Dynamically aggregated from uploaded records)
  const hazardCategoryData = React.useMemo(() => {
    const reports = activeReports;
    if (reports.length === 0) return [];
    
    const catMap = {};
    reports.forEach((r) => {
      const fullCat = categorizeHazard(r.identified_hazard || r.description);
      const shortName = getShortCategory(fullCat);
      if (!catMap[fullCat]) {
        catMap[fullCat] = {
          category: fullCat,
          shortName: shortName,
          sifHigh: 0,
          nonSif: 0,
          total: 0,
          description: r.identified_hazard || r.description
        };
      }
      const isSIF = r.sif_precursor_assessment === 'YES' || r.risk_level === 'Critical' || (r.ai_score && r.ai_score >= 80);
      if (isSIF) {
        catMap[fullCat].sifHigh += 1;
      } else {
        catMap[fullCat].nonSif += 1;
      }
      catMap[fullCat].total += 1;
    });

    return Object.values(catMap).sort((a, b) => b.total - a.total);
  }, [activeReports]);

  // Max count for BarChart YAxis
  const maxHazardCount = React.useMemo(() => {
    if (hazardCategoryData.length === 0) return 4;
    return Math.max(4, ...hazardCategoryData.map(h => h.total || 0));
  }, [hazardCategoryData]);

  // 2. SIF vs Non-SIF vs Near Misses Donut Chart Data (Reflecting active safety reports)
  const classificationDistributionData = React.useMemo(() => {
    const reports = activeReports;
    const total = reports.length || 1;
    const sifCount = reports.filter(r => r.sif_precursor_assessment === 'YES' || r.risk_level === 'Critical' || (r.ai_score && r.ai_score >= 80)).length;
    const nearMissCount = reports.filter(r => (r.report_type || '').toLowerCase().includes('near miss')).length;
    const nonSifCount = Math.max(0, reports.length - sifCount);

    return [
      { 
        name: 'SIF Precursors', 
        value: reports.length > 0 ? Math.round((sifCount / total) * 100) : 0, 
        count: sifCount, 
        color: '#FF5A36',
        description: 'High-severity critical precursors'
      },
      { 
        name: 'Non-SIF / Weak Signals', 
        value: reports.length > 0 ? Math.round((nonSifCount / total) * 100) : 0, 
        count: nonSifCount, 
        color: '#10B981',
        description: 'Routine observations & weak signals'
      },
      { 
        name: 'Near Misses', 
        value: reports.length > 0 ? Math.round((nearMissCount / total) * 100) : 0, 
        count: nearMissCount, 
        color: '#8B5CF6',
        description: 'Immediate near-miss incidents'
      }
    ];
  }, [activeReports]);

  // 3. Safety Reports Table (Dynamically mapped from uploaded safety reports)
  const summaryReports = React.useMemo(() => {
    const reports = activeReports;
    return reports.map((r, idx) => {
      const fullCat = categorizeHazard(r.identified_hazard || r.description);
      const isSIF = r.sif_precursor_assessment === 'YES' || r.risk_level === 'Critical' || (r.ai_score && r.ai_score >= 80);
      const isNearMiss = (r.report_type || '').toLowerCase().includes('near miss');
      return {
        id: r.report_reference || `REP-ID001-${String(idx + 1).padStart(4, '0')}`,
        type: r.report_type || 'Near Miss',
        hazardCategory: getShortCategory(fullCat),
        classification: isSIF ? 'SIF Precursors' : (isNearMiss ? 'Near Misses' : 'Non-SIF / Weak Signals'),
        location: r.location || r.facility_unit || 'Unit 1',
        risk: isSIF ? 'Critical' : 'Low',
        score: r.ai_score || (isSIF ? 92 : 45),
        status: r.status || 'Under Review',
        date: r.report_date || getTodayDateString(),
        description: r.description || ''
      };
    });
  }, [activeReports]);

  // Dynamic filter computed based on active chart interaction
  const filteredReports = summaryReports.filter(rep => {
    if (activeHazard) return rep.hazardCategory === activeHazard;
    if (activeClassification) return rep.classification === activeClassification;
    return true;
  });

  // Custom Dark Tooltip for Hazard Categories Bar Chart
  const CustomHazardTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-[#0F172A] text-white border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{data?.category || label}</span>
            <span className="text-[#FF5A36] font-mono text-[11px] font-bold">{data?.total} {data?.total === 1 ? 'Incident' : 'Incidents'}</span>
          </div>
          {data?.sifHigh > 0 && (
            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                SIF Precursor (High)
              </span>
              <strong className="text-white font-mono">{data.sifHigh}</strong>
            </div>
          )}
          {data?.nonSif > 0 && (
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Non-SIF / Weak Signal
              </span>
              <strong className="text-white font-mono">{data.nonSif}</strong>
            </div>
          )}
          <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 leading-relaxed italic">
            {data?.description}
          </p>
        </div>
      );
    }
    return null;
  };

  // Unit Selector Options for Day-Wise Trend Analysis
  const siteOptions = [
    { id: 'ALL', name: 'All Units', location: 'Enterprise-wide' },
    { id: 'PLANT_01', name: 'Unit 1', location: 'Unit 1' },
    { id: 'PLANT_02', name: 'Unit 2', location: 'Unit 2' },
    { id: 'PLANT_03', name: 'Unit 3', location: 'Unit 3' },
    { id: 'PLANT_04', name: 'Unit 4', location: 'Unit 4' }
  ];

  // 4. Day-Wise Incident & SIF Precursor Trajectory Across the 4 Sites (Dynamically rolling daily through today)
  const siteDayWiseData = React.useMemo(() => {
    const reports = activeReports;
    const today = currentTodayDate || getTodayDateString();

    const formatDate = (isoStr) => {
      try {
        const parts = isoStr.split('-');
        if (parts.length === 3) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = parseInt(parts[1], 10) - 1;
          return `${parseInt(parts[2], 10)} ${monthNames[mIdx] || 'Sep'}`;
        }
      } catch (e) {}
      return isoStr;
    };

    const getUnitCount = (list, unitNum) => {
      return list.filter(r => {
        const loc = `${r.location || ''} ${r.facility_unit || ''}`.toLowerCase();
        return (
          loc.includes(`unit ${unitNum}`) ||
          loc.includes(`unit0${unitNum}`) ||
          loc.includes(`unit-${unitNum}`) ||
          loc.includes(`plant 0${unitNum}`) ||
          loc.includes(`plant ${unitNum}`)
        );
      }).length;
    };

    if (reports.length === 0) return [];

    // Extract all valid report dates
    const reportDates = reports
      .map(r => (r.report_date || r.created_at || '').slice(0, 10))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

    const sortedReportDates = [...new Set(reportDates)].sort();
    const earliestDateStr = sortedReportDates.length > 0 ? sortedReportDates[0] : today;

    // Generate consecutive rolling date list ending at today (or rolling window)
    const consecutiveDates = [];
    const startObj = new Date(earliestDateStr + 'T00:00:00');
    const todayObj = new Date(today + 'T00:00:00');

    if (!isNaN(startObj.getTime()) && !isNaN(todayObj.getTime()) && startObj <= todayObj) {
      const curr = new Date(startObj);
      while (curr <= todayObj) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        consecutiveDates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      consecutiveDates.push(today);
    }

    // Keep the rolling last 7 days ending at today
    const displayDates = consecutiveDates.slice(-7);

    return displayDates.map(dStr => {
      const dReports = reports.filter(r => {
        const rDate = (r.report_date || r.created_at || '').slice(0, 10);
        return rDate === dStr;
      });

      return {
        day: formatDate(dStr),
        fullDate: dStr,
        isToday: dStr === today,
        plant01: getUnitCount(dReports, 1),
        plant02: getUnitCount(dReports, 2),
        plant03: getUnitCount(dReports, 3),
        plant04: getUnitCount(dReports, 4),
      };
    });
  }, [activeReports, currentTodayDate]);

  // Max count for LineChart YAxis
  const maxTrajectoryCount = React.useMemo(() => {
    if (!siteDayWiseData || siteDayWiseData.length === 0) return 5;
    const maxVal = Math.max(5, ...siteDayWiseData.flatMap(d => [d.plant01 || 0, d.plant02 || 0, d.plant03 || 0, d.plant04 || 0]));
    return maxVal + 1;
  }, [siteDayWiseData]);


  // Custom Dark Tooltip for Multi-Line Spline Trajectory Chart (4 Units)
  const CustomTrajectoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isTodayPoint = payload[0]?.payload?.isToday;
      return (
        <div className="bg-[#0F172A] text-white border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[230px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[#FF5A36] font-bold">{label}</span>
              {isTodayPoint && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  TODAY
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">4 Monitored Units</span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </span>
                <strong className="text-white font-mono">{entry.value} Incidents</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };



  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1680px] mx-auto text-slate-800 animate-in fade-in duration-200 select-none">

      {/* ================= 1. REFINERY HERO BANNER (IMAGE REPLACES VIDEO) ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-[#081B38] border border-slate-700/60 shadow-md min-h-[220px] lg:min-h-[260px] flex items-center justify-between">
        
        {/* BACKGROUND IMAGE: Sunset Industrial Refinery (Replaces Video) */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/refinery-banner.png"
            alt="PetroSafe Refinery at Sunset"
            className="w-full h-full object-cover object-right"
          />
          {/* Deep Navy to Transparent Gradient Overlay on Left Half */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071930] via-[#0A2446]/95 via-48% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071930]/60 via-transparent to-[#071930]/30" />
        </div>

        {/* LEFT HALF: Safety Intelligence Content & Interactive Actions */}
        <div className="relative z-10 w-full lg:w-3/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold tracking-wider uppercase w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>SAFETY INTELLIGENCE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-white tracking-tight leading-[1.18]">
            Detect Risk Before It Becomes an <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-[#FF5A36] to-amber-400">Incident</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            AI analysis has identified recurring safety signals in the maintenance area. Focus on electrical hazards and control failures.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button 
              onClick={() => handleNav('/ai-analysis')} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FFA133] hover:from-[#e54a26] hover:to-[#e6902b] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
            <button 
              onClick={() => handleNav('/reports')} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-white/20 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>Browse All Reports</span>
            </button>
          </div>
        </div>

        {/* RIGHT HALF: "Safer Tomorrow Together" artistic overlay matching Image 2 */}
        <div className="relative z-10 pr-10 xl:pr-14 pointer-events-none hidden lg:block select-none text-right">
          <p className="text-white font-serif italic text-3xl xl:text-4xl tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-tight opacity-95">
            Safer<br />Tomorrow<br />Together
          </p>
          <div className="w-16 h-1 bg-[#FF5A36] mt-2.5 ml-auto rounded-full shadow-md" />
        </div>
      </section>

      {/* ================= 1.5 KEY OPERATIONAL METRICS (4 KPIS) ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Safety Reports */}
        <div className="rounded-2xl bg-white border border-[#EAE6E1] p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Safety Reports</p>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 mt-1">
              {backendMetrics != null ? backendMetrics.total_reports : activeReports.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Database operational records</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Analyzed Reports */}
        <div className="rounded-2xl bg-white border border-[#EAE6E1] p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analyzed Reports</p>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 mt-1">
              {backendMetrics != null ? backendMetrics.completed_analysis : activeReports.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">AI/NLP pipeline completed</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Potential SIF Findings */}
        <div className="rounded-2xl bg-white border border-[#EAE6E1] p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Potential SIF Findings</p>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-[#FF5A36] mt-1">
              {backendMetrics != null 
                ? backendMetrics.potential_sif_findings 
                : activeReports.filter(r => r.sif_precursor_assessment === 'YES' || r.risk_level === 'Critical').length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">High-energy / fatal risk</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] shadow-2xs">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Awaiting Human Review */}
        <div className="rounded-2xl bg-white border border-[#EAE6E1] p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Human Review</p>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-amber-600 mt-1">
              {backendMetrics != null 
                ? backendMetrics.awaiting_review 
                : activeReports.filter(r => r.status === 'Under Review').length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Requires safety verification</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ================= 2. MAIN ANALYTICS ROW (HAZARD CATEGORIES & SIF DONUT) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* 1. Hazard Categories Breakdown Bar Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#EAE6E1] p-5 flex flex-col justify-between shadow-sm min-h-[420px] transition-all text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/50 text-[#FF5A36] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900 tracking-tight">
                  Hazard Categories
                </h3>
                <p className="text-[10.5px] text-slate-500">Distribution across {hazardCategoryData.length} industrial hazard types</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeHazard && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[10.5px] px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/60 text-[#FF5A36] font-mono font-bold hover:bg-orange-100 transition-all cursor-pointer shadow-2xs"
                  title="Click to reset filter"
                >
                  <span>{activeHazard} Active</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {hazardCategoryData.length === 0 ? (
            <div className="w-full h-72 sm:h-80 lg:h-[310px] flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No safety reports available yet</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Submit a safety observation or upload your site register to visualize real-time hazard category distributions.
              </p>
              <button
                onClick={() => handleNav('/bulk-upload')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#e54a26] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Report Register</span>
              </button>
            </div>
          ) : (
            <div className="w-full h-72 sm:h-80 lg:h-[310px] pt-2 cursor-pointer flex-1 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={hazardCategoryData} 
                  margin={{ top: 16, right: 16, left: -20, bottom: 4 }}
                  barCategoryGap="16%"
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      handleBarClick(state.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }} 
                    dy={4}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }} 
                    domain={[0, maxHazardCount]} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomHazardTooltip />} />
                  <Bar 
                    dataKey="sifHigh" 
                    name="SIF Precursor (High)" 
                    stackId="hazards" 
                    radius={[0, 0, 4, 4]} 
                    barSize={46}
                  >
                    {hazardCategoryData.map((entry) => (
                      <Cell 
                        key={`sif-${entry.shortName}`} 
                        fill="#FF5A36" 
                        opacity={activeHazard && activeHazard !== entry.shortName ? 0.35 : 1}
                        stroke={activeHazard === entry.shortName ? '#FF5A36' : 'none'}
                        strokeWidth={activeHazard === entry.shortName ? 2 : 0}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="nonSif" 
                    name="Non-SIF / Weak Signal" 
                    stackId="hazards" 
                    radius={[4, 4, 0, 0]} 
                    barSize={46}
                  >
                    {hazardCategoryData.map((entry) => (
                      <Cell 
                        key={`nonsif-${entry.shortName}`} 
                        fill="#10B981" 
                        opacity={activeHazard && activeHazard !== entry.shortName ? 0.35 : 1}
                        stroke={activeHazard === entry.shortName ? '#10B981' : 'none'}
                        strokeWidth={activeHazard === entry.shortName ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom Chart Legend */}
          <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 text-[11px]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5A36] inline-block" />
                SIF Precursors
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
                Non-SIF / Weak Signal
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10.5px] font-mono text-slate-500">
                Total: <strong className="text-slate-900 font-bold">{activeHazard ? filteredReports.length : hazardCategoryData.reduce((acc, c) => acc + c.total, 0)}</strong> Incidents
              </span>
            </div>
          </div>
        </div>

        {/* 2. SIF vs Non-SIF vs Near Misses Donut Chart (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#EAE6E1] p-5 flex flex-col justify-between shadow-sm min-h-[420px] transition-all text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/50 text-[#FF5A36] flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900 tracking-tight">
                  SIF vs Non-SIF vs Near Miss
                </h3>
                <p className="text-[10.5px] text-slate-500">Classification ratio of logged safety reports</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeClassification && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[10.5px] px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/60 text-[#FF5A36] font-mono font-bold hover:bg-orange-100 transition-all cursor-pointer shadow-2xs"
                  title="Click to reset filter"
                >
                  <span>{activeClassification.split(' ')[0]} Active</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {summaryReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center my-auto py-12 px-6 text-center w-full flex-1 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-3">
                <PieChartIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No safety reports available yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                SIF vs Non-SIF breakdown will dynamically update once operational reports are processed.
              </p>
            </div>
          ) : (
            /* Centered Large Interactive Donut Chart */
            <div className="flex flex-col items-center justify-center my-auto py-2 gap-3 w-full flex-1">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={76}
                      outerRadius={122}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(entry) => handleClassificationClick(entry.name)}
                      onMouseEnter={(_, index) => setDonutHoverIndex(index)}
                      onMouseLeave={() => setDonutHoverIndex(null)}
                      className="cursor-pointer outline-none"
                    >
                      {classificationDistributionData.map((entry, index) => {
                        const isHovered = donutHoverIndex === index;
                        const isSelected = activeClassification === entry.name;
                        const isFaded = (activeClassification && !isSelected) || (donutHoverIndex !== null && !isHovered && !isSelected);
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke="#FFFFFF" 
                            strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                            opacity={isFaded ? 0.35 : 1}
                            style={{
                              filter: isSelected || isHovered ? `drop-shadow(0 4px 12px ${entry.color}40)` : 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Dynamic Interactive Center Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200 select-none">
                  {donutHoverIndex !== null ? (
                    <div className="text-center px-3 animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-4xl sm:text-5xl font-black font-heading text-slate-900 tracking-tight block">
                        {classificationDistributionData[donutHoverIndex].count}
                      </span>
                      <span 
                        className="text-xs font-bold uppercase tracking-wider block max-w-[130px] mx-auto truncate mt-1"
                        style={{ color: classificationDistributionData[donutHoverIndex].color }}
                      >
                        {classificationDistributionData[donutHoverIndex].name}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold block mt-0.5">
                        {classificationDistributionData[donutHoverIndex].value}% of total
                      </span>
                    </div>
                  ) : activeClassification ? (
                    <div className="text-center px-3 animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-4xl sm:text-5xl font-black font-heading text-[#FF5A36] tracking-tight block">
                        {classificationDistributionData.find(c => c.name === activeClassification)?.count || 0}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A36] block max-w-[130px] mx-auto truncate mt-1">
                        {activeClassification}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold block mt-0.5">
                        {classificationDistributionData.find(c => c.name === activeClassification)?.value || 0}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-center px-3">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 font-heading tracking-tight block">{summaryReports.length}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mt-1">Reports</span>
                      <span className="text-[10.5px] font-mono text-[#FF5A36] font-semibold block mt-0.5">Analyzed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Centered Pills with richer spacing and stats */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full">
                {classificationDistributionData.map((item, index) => {
                  const isSelected = activeClassification === item.name;
                  const isHovered = donutHoverIndex === index;
                  return (
                    <button 
                      key={item.name} 
                      onClick={() => handleClassificationClick(item.name)}
                      onMouseEnter={() => setDonutHoverIndex(index)}
                      onMouseLeave={() => setDonutHoverIndex(null)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-orange-50 border-orange-200 text-[#FF5A36] font-bold shadow-xs scale-105' 
                          : isHovered
                            ? 'bg-stone-100 border-stone-300 text-slate-900 scale-102 shadow-2xs'
                            : 'bg-[#FBF9F6] border-[#EAE6E1] text-slate-700 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold">{item.name}</span>
                      <span className="font-mono text-xs text-slate-500 font-bold">({item.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ================= 3. SIF-WISE TRAJECTORY (FULL WIDTH) ================= */}
      <section className="w-full">
        <div className="w-full rounded-2xl bg-white border border-[#EAE6E1] p-6 sm:p-7 shadow-sm transition-all text-slate-800 space-y-4">
          
          {/* Chart Header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A36]">
                  SIF-WISE TRAJECTORY
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">4 Monitored Operating Units</span>
                {siteDayWiseData.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Rolling Daily (Through {siteDayWiseData[siteDayWiseData.length - 1]?.day})
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 tracking-tight mt-1">
                Daily Incident &amp; SIF Velocity Across Units
              </h3>
            </div>

            {/* Colored dots legend for the 4 Units */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-700 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EAE6E1]">
                <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block shadow-2xs" />
                Unit 1
              </span>
              <span className="flex items-center gap-2 text-slate-700 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EAE6E1]">
                <span className="w-3 h-3 rounded-full bg-[#FF5A36] inline-block shadow-2xs" />
                Unit 2
              </span>
              <span className="flex items-center gap-2 text-slate-700 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EAE6E1]">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6] inline-block shadow-2xs" />
                Unit 3
              </span>
              <span className="flex items-center gap-2 text-slate-700 bg-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#EAE6E1]">
                <span className="w-3 h-3 rounded-full bg-[#64748B] inline-block shadow-2xs" />
                Unit 4
              </span>
            </div>
          </div>

          {/* Spline Curve Multi-Line Chart or Empty State */}
          {siteDayWiseData.length === 0 ? (
            <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No safety reports available yet</p>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Multi-unit velocity curves and daily precursor trajectories will render as incident and near-miss logs are captured.
              </p>
            </div>
          ) : (
            <div className="w-full h-72 sm:h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={siteDayWiseData}
                  margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
                >
                  <CartesianGrid stroke="#F1F5F9" strokeDasharray="0" vertical={true} horizontal={true} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{ stroke: '#E2E8F0' }}
                    domain={[0, maxTrajectoryCount]}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTrajectoryTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="plant01" 
                    name="Unit 1" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10B981', stroke: '#ffffff', strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plant02" 
                    name="Unit 2" 
                    stroke="#FF5A36" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#FF5A36', stroke: '#ffffff', strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plant03" 
                    name="Unit 3" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3B82F6', stroke: '#ffffff', strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plant04" 
                    name="Unit 4" 
                    stroke="#64748B" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#64748B', stroke: '#ffffff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>


      {/* ================= 5. FOOTER ================= */}
      <footer className="pt-2 pb-1 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="hidden sm:block">
          {/* subtle left spacer */}
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-slate-400">
            Last data synchronization: 2 minutes ago
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </span>
        </div>
      </footer>

    </div>
  );
}
