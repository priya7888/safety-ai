import React from 'react';
import { ShieldCheck, Flame, CheckCircle2, ArrowRight, Target, Cpu, AlertTriangle, Layers } from 'lucide-react';

export default function AboutPage({ onNavigate, onOpenLogin, onOpenDemo }) {
  return (
    <div className="w-full text-slate-100 bg-[#07101F] selection:bg-amber-500 selection:text-slate-950 pt-24">
      
      {/* Header Banner */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#07101F] via-slate-900 to-[#07101F] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>ABOUT SAFETYAI</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white font-heading tracking-tight leading-tight">
            Transforming Safety Data into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Actionable Intelligence
            </span>
          </h1>
          <p className="max-w-4xl mx-auto text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Safety AI is an AI-powered industrial Safety Intelligence Platform designed to identify potential Serious Injury and Fatality (SIF) precursors from unsafe-act, unsafe-condition, and near-miss reports. It enables workers to submit reports through voice or text in supported languages, translates and validates the report in English, and processes it using Natural Language Processing, machine learning, and safety rules. Its key innovation is weak-signal correlation, which identifies combinations of warning signs that may indicate more serious hazards. The platform provides explainable risk assessments, prioritizes reports for human review, and helps safety teams identify recurring patterns and take preventive action earlier.
          </p>
        </div>
      </section>

      {/* Main Split Section with Signature Vertical Line */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Continuous Signature Vertical Orange Line */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px] bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-28">
          
          {/* Row 1: Core Mission & What We Analyze */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center">
            
            {/* Left Image Showcase */}
            <div className="lg:col-span-6 lg:pr-16">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                  src="/assets/images/pic-2.jpg"
                  alt="Industrial Oilfield Operations"
                  className="w-full h-96 sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07101F] via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-amber-400 font-bold uppercase">Continuous Monitoring</div>
                      <div className="text-sm font-bold text-white">Full-Spectrum Rig & Pipeline Triage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 lg:pl-16 space-y-6 text-left">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest">
                01. CORE PURPOSE
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-heading leading-tight">
                Why SafetyAI Was Built
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
                In complex industrial environments like Oil India Limited, thousands of safety observations are filed annually. Crucial precursor signals often get buried in textual noise until a high-energy incident occurs. SafetyAI reads between the lines with domain-trained AI.
              </p>

              {/* The 3 Core Pillars Analyzed */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Continuous AI Analysis of:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                      UA
                    </div>
                    <div className="text-sm font-bold text-white">Unsafe Acts</div>
                    <div className="text-xs text-slate-400 mt-1">Behavioral deviations & procedural bypasses</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                      UC
                    </div>
                    <div className="text-sm font-bold text-white">Unsafe Conditions</div>
                    <div className="text-xs text-slate-400 mt-1">Hardware defects & barrier degradations</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
                      NM
                    </div>
                    <div className="text-sm font-bold text-white">Near-Miss Reports</div>
                    <div className="text-xs text-slate-400 mt-1">High-energy releases without injury</div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Row 2: Scientific SIF Paradigm vs Traditional Heinrich Pyramid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center">
            
            <div className="lg:col-span-6 lg:pr-16 text-left space-y-6">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest">
                02. THE PARADIGM SHIFT
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-heading leading-tight">
                Flaws of the Heinrich Triangle & The SIF Science
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-light">
                Historically, industry relied on Heinrich’s 1931 triangle, believing reducing minor trips would eliminate fatalities. Global industrial data has disproven this: while minor workplace injuries fell by over 50%, fatalities dropped by only 25%.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-200">
                    <strong className="text-white">Only 20–25% of incidents</strong> have true fatal potential (high energy + compromised barrier).
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-200">
                    <strong className="text-white">Targeted Barrier Assurance:</strong> Focus resources on critical controls rather than minor cosmetic issues.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Comparison Card */}
            <div className="lg:col-span-6 lg:pl-16">
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-left space-y-6">
                <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  <span>The SIF Mathematical Reality</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Total Safety Reports Ingested</span>
                      <span className="text-white font-bold">100%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full w-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-amber-400 font-bold">Genuine SIF Precursors (High Energy + Missing Barrier)</span>
                      <span className="text-amber-400 font-bold">22.4%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full w-[22.4%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Low-Energy Minor Observations (Everyday Noise)</span>
                      <span className="text-slate-400">77.6%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-700 rounded-full w-[77.6%]" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed font-mono">
                  SafetyAI eliminates manual triage backlogs and immediately elevates the critical 20-25% to executive safety attention.
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-4xl font-bold text-white font-heading">
            See the Architecture Behind SafetyAI
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">
            Understand how our natural language semantic classifier triages safety logs in under 500ms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 cursor-pointer hover:scale-105 transition-all"
            >
              <span>See How It Works</span>
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
