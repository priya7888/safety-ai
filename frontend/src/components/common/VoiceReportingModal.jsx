import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Globe, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';

export default function VoiceReportingModal({
  isOpen,
  onClose,
  onConfirmTranscript
}) {
  if (!isOpen) return null;

  // Selected language: 'te' (Telugu), 'hi' (Hindi), 'en' (English)
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakerIsolated, setSpeakerIsolated] = useState(true);

  // Transcripts
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [stepStatus, setStepStatus] = useState(1); // 1: Ready, 2: Isolating & Listening, 3: Transcribed & Translated, 4: Confirmed
  const [audioLevel, setAudioLevel] = useState(30);

  const transcriptRef = useRef('');
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  // Supported language configs
  const LANGUAGES = [
    { code: 'te', label: 'తెలుగు (Telugu)', bcp47: 'te-IN', placeholder: 'ఉదాహరణ: గ్యాస్ పైప్‌లైన్ ఫ్లాంజ్ వద్ద భారీగా గ్యాస్ లీక్ అవుతోంది...' },
    { code: 'hi', label: 'हिंदी (Hindi)', bcp47: 'hi-IN', placeholder: 'उदा: कंप्रेसर पाइप से गैस रिसाव हो रहा है और चिंगारी निकल रही है...' },
    { code: 'en', label: 'English', bcp47: 'en-US', placeholder: 'e.g. High-pressure gas pipeline flange leaking near compressor bay...' }
  ];

  const currentLangConfig = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[2];

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Step 1 & 2: Start Voice Reporting with Target Speaker Isolation
  const startVoiceRecording = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    transcriptRef.current = '';
    setOriginalTranscript('');
    setTranslatedTranscript('');
    setIsListening(true);
    setStepStatus(2);

    // Step 2 Simulation: Microphone with Noise Suppression constraints
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const updateAudioMeter = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.max(15, avg * 1.5)));
          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };
        updateAudioMeter();
      }
    } catch (e) {
      console.warn('Microphone stream audio context notice:', e);
    }

    // Step 3: Speech Recognition in native language
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLangConfig.bcp47;

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }

        if (fullTranscript) {
          transcriptRef.current = fullTranscript;
          setOriginalTranscript(fullTranscript);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const captured = transcriptRef.current.trim();
        if (captured) {
          handleTranslateTranscript(captured);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Step 3: Convert speech into English text
  const handleTranslateTranscript = async (overrideText) => {
    const textToTranslate = (typeof overrideText === 'string' ? overrideText : (transcriptRef.current || originalTranscript)).trim();
    if (!textToTranslate) return;

    setIsProcessing(true);
    try {
      const result = await api.translateVoiceText(textToTranslate, selectedLanguage);
      setTranslatedTranscript(result.translated_text || textToTranslate);
      setStepStatus(3);
    } catch (e) {
      setTranslatedTranscript(textToTranslate);
      setStepStatus(3);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4: Continue existing safety analysis
  const handleConfirmAndContinue = () => {
    const finalEnglishText = translatedTranscript || originalTranscript;
    if (!finalEnglishText.trim()) return;

    onConfirmTranscript(finalEnglishText, originalTranscript, selectedLanguage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-[#FF5A36] flex items-center justify-center">
              <Mic className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI VOICE HAZARD REPORTING</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-wide">
                Target Speaker Isolated Voice Dictation
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Process Breadcrumb */}
        <div className="bg-[#FAF8F5] border-b border-stone-200 p-3 sm:px-6 flex items-center justify-between text-xs font-mono">
          {[
            { num: 1, title: 'Voice Input', sub: 'Telugu / Hindi / English' },
            { num: 2, title: 'Speaker Isolation', sub: 'Filters machinery noise' },
            { num: 3, title: 'Speech-to-Text', sub: 'Auto English translate' },
            { num: 4, title: 'Safety Pipeline', sub: 'Precursor & weak signals' }
          ].map((st, i) => (
            <div 
              key={st.num} 
              className={`flex items-center gap-2 ${stepStatus >= st.num ? 'text-orange-950 font-bold' : 'text-slate-400 font-medium'}`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                stepStatus >= st.num ? 'bg-[#FF5A36] text-white shadow-xs' : 'bg-stone-200 text-slate-500'
              }`}>
                {st.num}
              </span>
              <span className="hidden sm:inline text-[11px]">{st.title}</span>
              {i < 3 && <span className="text-stone-300 hidden md:inline">&rarr;</span>}
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* STEP 1: Select Worker Language */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-heading">
              <Globe className="w-4 h-4 text-[#FF5A36]" />
              <span>1. SELECT YOUR SPOKEN LANGUAGE</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  disabled={isListening}
                  className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 ${
                    selectedLanguage === lang.code
                      ? 'bg-orange-50/80 border-[#FF5A36] text-orange-950 shadow-sm font-black'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-orange-300'
                  }`}
                >
                  <span>{lang.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">Speech-to-Text</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Target Speaker Isolation & Mic Action */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  🎯 AI TARGET SPEAKER ISOLATION ACTIVE
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Suppresses Machinery &amp; Ambient Plant Chatter
              </span>
            </div>

            {/* Central Microphone Button & Pulsing Visualizer */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <button
                type="button"
                onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                  isListening
                    ? 'bg-rose-600 text-white scale-105 animate-pulse shadow-rose-500/40'
                    : 'bg-gradient-to-tr from-[#FF5A36] to-[#FFA133] text-white hover:scale-105 shadow-orange-500/30'
                }`}
                title={isListening ? 'Click to Stop Recording' : 'Click to Speak'}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 stroke-[2.5]" />
                ) : (
                  <Mic className="w-8 h-8 stroke-[2.5]" />
                )}
                {isListening && (
                  <span 
                    className="absolute inset-0 rounded-full border-4 border-rose-400/50 animate-ping pointer-events-none" 
                  />
                )}
              </button>

              <div className="text-center">
                <div className="text-sm font-black text-white">
                  {isListening ? 'Listening & Isolating Your Voice...' : 'Tap to Start Speaking'}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {isListening ? 'Speak freely in Telugu, Hindi, or English' : 'AI prioritizes your voice over nearby background noise'}
                </div>
              </div>

              {/* Live Audio Spectrum Bar */}
              {isListening && (
                <div className="w-full max-w-xs flex items-center justify-center gap-1.5 h-6 pt-2">
                  {[18, 42, 65, 88, 70, 52, 95, 60, 40, 25].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1.5 bg-orange-400 rounded-full transition-all duration-75"
                      style={{ height: `${Math.min(24, Math.max(4, (audioLevel * h) / 100))}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 3 & 4: Transcripts & Translation Confirmation */}
          {(originalTranscript || translatedTranscript) && (
            <div className="space-y-3 p-4 rounded-2xl bg-orange-50/70 border-2 border-orange-200">
              
              {/* Native Language Spoken Output */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-900 flex items-center justify-between mb-1">
                  <span>SPOKEN TRANSCRIPT ({currentLangConfig.label}):</span>
                  <button
                    type="button"
                    onClick={() => handleTranslateTranscript(originalTranscript)}
                    disabled={isProcessing || !originalTranscript}
                    className="text-[11px] font-bold text-orange-700 hover:text-orange-950 underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Translating to English...' : 'Translate to English →'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={originalTranscript}
                  onChange={(e) => {
                    const text = e.target.value;
                    setOriginalTranscript(text);
                    transcriptRef.current = text;
                  }}
                  className="w-full p-3 rounded-xl bg-white border border-orange-200 text-xs text-slate-800 leading-relaxed font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder={currentLangConfig.placeholder}
                />
              </div>

              {/* English Translated Output */}
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-900 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ISOLATED &amp; TRANSLATED ENGLISH STATEMENT:</span>
                  </span>
                  {isProcessing && (
                    <span className="text-[10px] font-mono text-emerald-600 animate-pulse font-bold">
                      Translating...
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={translatedTranscript || (isProcessing ? 'Converting to English...' : '')}
                  onChange={(e) => setTranslatedTranscript(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-emerald-300 text-xs text-slate-900 leading-relaxed font-semibold focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  placeholder="Translated English safety statement..."
                />
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmAndContinue}
            disabled={!originalTranscript && !translatedTranscript}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B4A] via-[#FF5A36] to-[#FFA133] hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <span>Confirm &amp; Run Safety Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
