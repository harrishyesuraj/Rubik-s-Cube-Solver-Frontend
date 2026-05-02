import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, RotateCw, Camera, Edit3, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-2 inset-y-6 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[600px] lg:w-[850px] sm:max-h-[85dvh] bg-[#111111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] z-[101] overflow-hidden flex flex-col shadow-3xl shadow-accent/20"
          >
            {/* Header */}
            <div className="p-4 sm:p-8 sm:pb-4 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-accent/30">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-serif text-white tracking-tight uppercase leading-none">Mission Protocol</h2>
                  <p className="text-[8px] sm:text-[11px] text-accent font-black uppercase tracking-[0.2em] mt-0.5">Operational Guidance</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 sm:p-3 hover:bg-white/5 rounded-xl sm:rounded-2xl transition-all border border-white/5 group"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 sm:pt-6 space-y-6 sm:space-y-10 custom-scrollbar">
              {/* Core Principle: Fixed Orientation */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">01. Fixed Orientation</h3>
                </div>
                 <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
                   <p className="text-[10px] sm:text-[14px] text-gray-400 leading-relaxed font-medium">To ensure the AI synchronizes with your cube correctly, you must maintain a consistent reference throughout the capture process.</p>
                   <div className="grid grid-cols-2 gap-3 sm:gap-6">
                      <div className="bg-[#050505] p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col items-center gap-2 sm:gap-4">
                         <div className="w-6 h-6 sm:w-12 sm:h-12 bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                         <span className="text-[8px] sm:text-[12px] font-black text-white uppercase tracking-widest text-center">White = TOP</span>
                      </div>
                      <div className="bg-[#050505] p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col items-center gap-2 sm:gap-4">
                         <div className="w-6 h-6 sm:w-12 sm:h-12 bg-[#22C55E] rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.2)]" />
                         <span className="text-[8px] sm:text-[12px] font-black text-white uppercase tracking-widest text-center">Green = FRONT</span>
                      </div>
                   </div>
                </div>
              </section>

              {/* Capture Flow */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">02. Sequence Matrix</h3>
                </div>
                <div className="space-y-3">
                   {[
                     { step: 1, action: "Capture TOP", detail: "Start with White face up and Green facing you.", icon: <RotateCw className="w-4 h-4" /> },
                     { step: 2, action: "Capture FRONT", detail: "Stay in the same position.", icon: <Camera className="w-4 h-4" /> },
                     { step: 3, action: "Capture RIGHT", detail: "Rotate the cube 90° LEFT (Right comes to front).", icon: <ArrowLeft className="w-4 h-4" /> },
                     { step: 4, action: "Capture BACK", detail: "Rotate another 90° LEFT (Back comes to front).", icon: <ArrowLeft className="w-4 h-4" /> },
                     { step: 5, action: "Capture LEFT", detail: "Rotate another 90° LEFT (Left comes to front).", icon: <ArrowLeft className="w-4 h-4" /> },
                     { step: 6, action: "Capture BOTTOM", detail: "Rotate back to Front, then flip it UP.", icon: <RotateCw className="w-4 h-4" /> },
                   ].map((s) => (
                    <div key={s.step} className="flex items-center gap-4 p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl">
                       <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent text-xs sm:text-lg font-black">
                          {s.step}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-[11px] sm:text-[14px] font-black text-white uppercase tracking-widest">{s.action}</h4>
                          <p className="text-[9px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{s.detail}</p>
                       </div>
                       <div className="text-accent opacity-40 scale-100 sm:scale-125">
                          {s.icon}
                       </div>
                    </div>
                   ))}
                </div>
              </section>

              {/* Tips */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">03. Calibration Tips</h3>
                </div>
                <div className="grid gap-3">
                   <div className="p-5 sm:p-7 bg-white/5 border border-white/5 rounded-3xl flex gap-4 sm:gap-6">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                         <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-widest">Steady Capture</h5>
                         <p className="text-[9px] sm:text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-widest">Wait for the stability bar to turn green before capturing to ensure accurate color detection.</p>
                      </div>
                   </div>
                   <div className="p-5 sm:p-7 bg-white/5 border border-white/5 rounded-3xl flex gap-4 sm:gap-6">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                         <Edit3 className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-widest">Manual Override</h5>
                         <p className="text-[9px] sm:text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-widest">If colors are detected incorrectly, tap individual squares to manually correct them.</p>
                      </div>
                   </div>
                   <div className="p-5 sm:p-7 bg-white/5 border border-white/5 rounded-3xl flex gap-4 sm:gap-6">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30">
                         <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-widest">Live Validation</h5>
                         <p className="text-[9px] sm:text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-widest">Ensure all color counts reach exactly 9/9 before attempting to solve the matrix.</p>
                      </div>
                   </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-8 pt-2 sm:pt-4 border-t border-white/5">
               <button 
                onClick={onClose}
                className="w-full h-12 sm:h-16 bg-accent text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[14px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 active:scale-95 transition-all"
               >
                  Acknowledge Protocol
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
