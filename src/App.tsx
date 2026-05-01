import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Layers, PlayCircle, Info, Sparkles, ChevronRight, Menu, X, Home, RotateCcw, Activity, HelpCircle } from 'lucide-react';
import { Scanner } from './components/Scanner';
import { SolutionPlayer } from './components/SolutionPlayer';
import { HelpModal } from './components/HelpModal';
import { AboutModal } from './components/AboutModal';
import { CubeState } from './utils/cubeUtils';

export default function App() {
  const [view, setView] = useState<'home' | 'scan' | 'solve'>('home');
  const [cubeState, setCubeState] = useState<CubeState | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'waking'>('checking');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            const newStatus = data.status === 'online' ? 'online' : 'waking';
            if (newStatus !== serverStatus) setServerStatus(newStatus);
            
            // If still waking, check again soon
            if (data.status !== 'online') {
              timeoutId = setTimeout(checkHealth, 5000);
            }
          } else {
            setServerStatus('waking');
            timeoutId = setTimeout(checkHealth, 5000);
          }
        } else {
          setServerStatus('waking');
          timeoutId = setTimeout(checkHealth, 5000);
        }
      } catch (e) {
        console.error("Health check failed:", e);
        if (serverStatus !== 'offline') setServerStatus('offline');
        timeoutId = setTimeout(checkHealth, 10000); 
      }
    };

    checkHealth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Only run once on mount, it handles its own recursion

  const startScanning = () => setView('scan');

  const onScanComplete = (state: CubeState) => {
    setCubeState(state);
    setView('solve');
  };

  const goToHome = () => {
    setView('home');
    setIsMenuOpen(false);
  };

  return (
    <div className="flex-1 bg-dark-bg text-[#E0E0E0] font-sans selection:bg-accent/30 selection:text-white flex flex-col relative">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid-bg" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.05" className="text-accent" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-bg)" />
        </svg>
      </div>

      {/* Decorative Background Element */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] flex items-center justify-center select-none z-0">
          <h1 className="text-[35vw] font-serif whitespace-nowrap leading-none selection:bg-transparent">VISION_AI</h1>
      </div>
      
      {/* Header */}
      <header className="h-14 sm:h-20 fixed top-0 left-0 right-0 border-b border-border/50 flex items-center justify-between px-4 sm:px-8 bg-dark-bg/60 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-xl flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/10 group cursor-pointer hover:rotate-12 transition-transform shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-serif tracking-tight uppercase text-white leading-none">
                CubeVision
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1 h-1 rounded-full ${
                    serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                    serverStatus === 'waking' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
                }`} />
                <span className={`text-[7px] sm:text-[8px] font-black tracking-[0.2em] uppercase transition-colors ${
                    serverStatus === 'online' ? 'text-accent' : 
                    serverStatus === 'waking' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                    {serverStatus === 'online' ? 'NEURAL_ACTIVE' : 
                     serverStatus === 'waking' ? 'ENGINE_WAKING' : 'ENGINE_OFFLINE'}
                </span>
            </div>
          </div>
        </div>
        
        {/* Progress Stepper */}
        <div className="hidden md:flex items-center gap-8">
           {[
             { id: 'scan', label: 'Scan', step: 1 },
             { id: 'solve', label: 'Solve', step: 2 },
             { id: 'follow', label: 'Follow', step: 3 }
           ].map((s, idx) => {
             const isActive = view === s.id || (view === 'solve' && s.id === 'solve') || (view === 'solve' && s.id === 'follow'); // follow is sub-step of solve
             const isPast = (view === 'solve' && s.id === 'scan');
             
             return (
               <div key={s.id} className="flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                   isActive ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                   isPast ? 'bg-green-500 border-green-500 text-white' : 'border-border text-gray-500'
                 }`}>
                   {s.step}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${isActive || isPast ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
                 {idx < 2 && <div className="w-12 h-[2px] bg-border ml-4" />}
               </div>
             );
           })}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-border group relative z-[60]"
          >
            {isMenuOpen ? (
                <X className="w-5 h-5 text-accent animate-in fade-in spin-in-90" />
            ) : (
                <Menu className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>
      </header>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] bg-panel-bg z-[56] border-l border-border shadow-2xl flex flex-col p-8 pt-24"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Navigation</p>
                  <nav className="flex flex-col gap-3">
                    <button 
                      onClick={goToHome}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group lg:active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                         <Home className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold text-white uppercase tracking-tight">Return Home</span>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Status: Ready</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-accent transition-colors" />
                    </button>

                    <button 
                      onClick={() => { setView('scan'); setIsMenuOpen(false); }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group lg:active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                         <Camera className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold text-white uppercase tracking-tight">Active Scanner</span>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Status: Standby</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-accent transition-colors" />
                    </button>
                    
                    {cubeState && (
                        <button 
                          onClick={() => { setView('solve'); setIsMenuOpen(false); }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group lg:active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                             <PlayCircle className="w-5 h-5 text-accent" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-bold text-white uppercase tracking-tight">Solve Matrix</span>
                            <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Status: Active</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-accent transition-colors" />
                        </button>
                    )}

                    <button 
                      onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group lg:active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                         <HelpCircle className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold text-white uppercase tracking-tight">Help & Instructions</span>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">Protocol: Operational</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-accent transition-colors" />
                    </button>

                    <button 
                      onClick={() => { setIsAboutOpen(true); setIsMenuOpen(false); }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all group lg:active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/20">
                         <Info className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold text-white uppercase tracking-tight">Intelligence Briefing</span>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-none mt-1">About & Credits</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-700 ml-auto group-hover:text-accent transition-colors" />
                    </button>
                  </nav>
                </div>

                <div className="space-y-4 pt-8 border-t border-border/40">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Global Operations</p>
                  <button 
                    onClick={() => { window.location.reload(); }}
                    className="w-full flex items-center gap-3 p-4 text-gray-500 hover:text-red-500 transition-colors font-black text-[10px] uppercase tracking-widest"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Core Logic
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col pt-14 sm:pt-24 pb-12 sm:pb-24 px-4 sm:px-6 relative z-10 w-full overflow-visible">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto w-full space-y-8 sm:space-y-12"
            >
              <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-12">
                <div className="flex items-center gap-3">
                   <div className="h-px flex-1 bg-border"></div>
                   <h2 className="text-[10px] font-bold text-accent-text uppercase tracking-[0.3em]">Neural_Matrix_v2.0</h2>
                   <div className="h-px flex-1 bg-border"></div>
                </div>
                <h1 className="title-massive text-white text-center">
                  CUBE<br/>
                  <span className="text-accent">VISION</span>
                </h1>
                <p className="text-gray-500 text-center text-base sm:text-lg max-w-[280px] sm:max-w-sm mx-auto leading-relaxed font-light">
                  From scrambled to solved — powered by intelligent vision
                </p>
              </div>

                <button 
                  onClick={startScanning}
                  className="w-full bg-accent text-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col items-center gap-4 sm:gap-6 group overflow-hidden relative shadow-3xl shadow-accent/20 active:scale-[0.98] transition-all hover:bg-accent/90"
                >
                   <div className="relative z-10 text-center space-y-1 sm:space-y-2">
                     <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] font-black opacity-60">Initialize sequence</p>
                     <h3 className="text-2xl sm:text-3xl font-serif tracking-tight">ACTIVATE SCANNER</h3>
                   </div>
                   <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black tracking-widest opacity-80 z-10 transition-transform group-hover:translate-x-1">
                      PROCEED TO CALIBRATION <ChevronRight className="w-4 h-4" />
                   </div>
                   <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 blur-3xl -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 group-hover:bg-white/20 transition-all"></div>
                   <Camera className="absolute bottom-4 right-6 sm:bottom-6 sm:right-8 w-16 h-16 sm:w-20 sm:h-20 opacity-10 -rotate-12 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700" />
                </button>

                <div className="bg-panel-bg/20 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-border/40 space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Network_Status</h4>
                    <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-2 w-fit ${
                        serverStatus === 'online' ? 'text-accent-text bg-accent/5 border-accent/10' :
                        serverStatus === 'waking' ? 'text-yellow-500 bg-yellow-500/5 border-yellow-500/10' :
                        'text-red-500 bg-red-500/5 border-red-500/10'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            serverStatus === 'online' ? 'bg-accent animate-pulse shadow-[0_0_8px_#3B82F6]' :
                            serverStatus === 'waking' ? 'bg-yellow-500 animate-bounce' :
                            'bg-red-500'
                        }`}></div>
                        {serverStatus === 'online' ? 'CORE_ENGINE_ACTIVE' : 
                         serverStatus === 'waking' ? 'SYSTEM_INITIALIZING...' : 'CONNECTION_ERROR'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-mono text-gray-600">
                        <span>ENDPOINT</span>
                        <span className="text-gray-400">cube-solve-application.onrender.com</span>
                    </div>
                    {serverStatus === 'waking' && (
                        <p className="text-[9px] text-yellow-500/70 font-mono italic text-center animate-pulse py-1">
                            Engine is waking up from sleep mode. Please wait...
                        </p>
                    )}
                    {serverStatus === 'offline' && (
                        <p className="text-[9px] text-red-500/70 font-mono italic text-center py-1">
                            Target server failed to reach. Matrix decryption limited to local backup.
                        </p>
                    )}
                    <div className="h-px bg-border/20"></div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-600">
                        <span>WAKE_PROTOCOL</span>
                        <span className="text-accent/50 uppercase">{serverStatus === 'online' ? 'Verified' : 'Active'}</span>
                    </div>
                  </div>

                  {/* Relocated Status Indicators */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                          <Layers className="w-4 h-4 text-accent/70" />
                          <div className="space-y-0.5">
                              <h4 className="font-bold text-white text-[9px] uppercase tracking-tight">Vision Core</h4>
                              <p className="text-[7px] text-gray-600 uppercase tracking-widest leading-none">Gemini 1.5</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                          <PlayCircle className="w-4 h-4 text-accent/70" />
                          <div className="space-y-0.5">
                              <h4 className="font-bold text-white text-[9px] uppercase tracking-tight">Solve API</h4>
                              <p className="text-[7px] text-gray-600 uppercase tracking-widest leading-none">Kociemba</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-4 py-4 opacity-50 justify-center">
                  <div className="h-[1px] w-8 bg-border"></div>
                  <Sparkles className="w-4 h-4 text-accent" />
                  <div className="h-[1px] w-8 bg-border"></div>
              </div>
            </motion.div>
          )}

          {view === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto"
            >
              <Scanner onComplete={onScanComplete} />
              <button 
                onClick={() => setView('home')}
                className="mt-12 text-gray-600 font-mono text-[10px] uppercase tracking-[0.4em] w-full text-center hover:text-white transition-all py-4 group"
              >
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">[ EXIT_CALIBRATION_SEQUENCE ]</span>
              </button>
            </motion.div>
          )}

          {view === 'solve' && cubeState && (
            <motion.div 
              key="solve"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
               <SolutionPlayer 
                 initialState={cubeState} 
                 onReset={() => setView('scan')}
               />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
