import React, { useState } from 'react';
import { 
  FileText, 
  Cpu, 
  ShieldAlert, 
  SearchCode, 
  Network, 
  BarChart2, 
  ArrowRight, 
  Workflow, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function HowItWorksPage({ onNavigate, onOpenLogin, onOpenDemo }) {
  const [activeStage, setActiveStage] = useState(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Safety Reports Ingestion',
      category: 'Data Ingestion',
      icon: FileText,
      tag: 'Raw Input',
      desc: 'Ingests Unsafe Acts (UA), Unsafe Conditions (UC), Near-Misses, and incident logs from OIL platforms and field apps.',
      metric: 'Real-Time Multi-Source',
      details: 'Accepts raw text reports, mobile voice logs, PDF incident forms, and ERP maintenance logs across drilling rigs and gathering stations.'
    },
    {
      step: '02',
      title: 'AI & NLP Semantic Engine',
      category: 'NLP Analysis',
      icon: Cpu,
      tag: '< 500ms Triage',
      desc: 'Domain-trained safety LLMs parse unstructured oilfield jargon, acronyms, and multilingual report descriptions.',
      metric: 'Oilfield Vocabulary Tokenizer',
      details: 'Decodes localized technical terminology like "BOP packoff failure", "iron roughneck pinch", "H2S trip", and "Christmas tree valve leak".'
    },
    {
      step: '03',
      title: 'Hazard & Energy Vector Detection',
      category: 'Risk Classification',
      icon: SearchCode,
      tag: 'Vector Mapping',
      desc: 'Extracts energy sources (gravity, mechanical, electrical, chemical, pressure) involved in the observation.',
      metric: '10 High-Energy Vectors',
      details: 'Identifies whether hazardous energy exceeded fatal threshold thresholds (e.g. working > 1.8m at height, electrical > 50V, pressure > 100 psi).'
    },
    {
      step: '04',
      title: 'SIF Precursor Identification',
      category: 'Precursor AI',
      icon: ShieldAlert,
      tag: '98.4% Precision',
      desc: 'Differentiates true fatal precursors from low-energy occurrences using scientific EEI/DEKRA risk models.',
      metric: 'SIF-p Flagging',
      details: 'Isolates the genuine 20–25% fatal potential events from thousands of low-consequence housekeeping reports.'
    },
    {
      step: '05',
      title: 'Weak Signal & Barrier Failure Detection',
      category: 'Pattern Clustering',
      icon: Network,
      tag: 'Bow-Tie Audit',
      desc: 'Audits whether physical LOTO, administrative permits, or interlock hardware defenses were compromised.',
      metric: 'Barrier Degradation',
      details: 'Detects repetitive micro-failures across geographic clusters and warns HSE managers of impending barrier collapses.'
    },
    {
      step: '06',
      title: 'Alerts & Preventive Actions',
      category: 'Command Center',
      icon: BarChart2,
      tag: 'Zero Data Lag',
      desc: 'Triggers automated Stop Work Authority recommendations and targeted audit stand-downs for safety leaders.',
      metric: 'Instant Executive Alerts',
      details: 'Pushes instant SMS/Email notifications, risk index recalculations, and automated HSE compliance dashboard exports.'
    }
  ];

  const current = workflowSteps[activeStage];

  return (
    <div className="w-full text-slate-100 bg-[#07101F] selection:bg-amber-500 selection:text-slate-950 pt-24">
      
      {/* Header Banner */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#07101F] via-slate-900 to-[#07101F] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Workflow className="w-3.5 h-3.5 text-amber-400" />
            <span>HOW IT WORKS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white font-heading tracking-tight leading-tight">
            The 6-Stage AI & NLP <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Safety Triage Pipeline
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-300 font-light leading-relaxed">
            From raw unstructured field safety logs to proactive barrier assurance, see how SafetyAI analyzes observations in sub-seconds.
          </p>
        </div>
      </section>

      {/* Main Workflow Timeline Section with Vertical Orange Line */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Continuous Signature Vertical Orange Line */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px] bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-24">
          
          {/* Visual Workflow Diagram */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-bold text-white font-heading">
              End-to-End Safety Intelligence Flow
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Click any stage in the pipeline below to inspect its AI mechanisms and industrial safety metrics.
            </p>
          </div>

          {/* Pipeline Stage Cards Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStage;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStage(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isActive 
                      ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/10 scale-105' 
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                      {step.step}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {step.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Breakdown (Split View) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center">
            
            {/* Left Image / Visualization */}
            <div className="lg:col-span-6 lg:pr-16">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                  src="/assets/images/pic-3.jpg"
                  alt="Industrial Rig Inspection"
                  className="w-full h-80 sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07101F] via-transparent to-transparent opacity-85" />
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-amber-400 font-bold uppercase">Pipeline Phase {current.step}</div>
                      <div className="text-base font-bold text-white">{current.category}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {current.tag}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Detailed Stage Narrative */}
            <div className="lg:col-span-6 lg:pl-16 space-y-6 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs font-mono shadow-md">
                  {current.step}
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  {current.category}
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-bold text-white font-heading leading-tight">
                {current.title}
              </h3>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 inline-block">
                <span className="text-xs font-mono text-amber-300 font-bold">
                  ⚡ Benchmark: {current.metric}
                </span>
              </div>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
                {current.desc}
              </p>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                <strong className="text-white block mb-1">Industrial Execution:</strong>
                {current.details}
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => onNavigate('sif-intelligence')}
                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-sm tracking-wide group cursor-pointer"
                >
                  <span>Explore SIF Intelligence</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>

          {/* Multilingual Voice Hazard Reporting Feature Breakdown */}
          <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/30 p-8 sm:p-10 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                FEATURE SPOTLIGHT
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-heading">
                Multilingual Voice Hazard Reporting (Telugu, Hindi, English)
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Designed for noisy industrial environments where frontline workers wearing gloves and PPE report hazards by speaking naturally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black font-mono">
                  01
                </div>
                <h4 className="text-base font-bold text-white">1. Worker starts voice reporting</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The worker presses the microphone button and speaks in <strong>Telugu, Hindi, or English</strong> while other people are talking nearby.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black font-mono">
                  02
                </div>
                <h4 className="text-base font-bold text-white">2. Isolate the target speaker</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI reduces machinery noise and other voices, prioritizing the selected worker's speech instead of transcribing every conversation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-black font-mono">
                  03
                </div>
                <h4 className="text-base font-bold text-white">3. Convert speech into text</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Speech recognition transcribes the isolated voice in its original language, then a translation model converts it into English.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black font-mono">
                  04
                </div>
                <h4 className="text-base font-bold text-white">4. Continue existing safety analysis</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The worker confirms the transcript, and your existing NLP/ML pipeline identifies hazards, possible SIF precursors, and weak-signal combinations.
                </p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-4xl font-bold text-white font-heading">
            Review the Life-Saving Guardrails
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">
            See how the 9 critical IOGP life-saving rules are continuously verified by our semantic barrier model.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('life-saving-rules')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 cursor-pointer hover:scale-105 transition-all"
            >
              <span>View Life-Saving Rules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 cursor-pointer"
            >
              <span>Organization Login</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
