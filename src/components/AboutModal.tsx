import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Github, Linkedin, Cpu, ExternalLink, Code2, Layers, Camera, CheckCircle2, Edit3 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
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
            className="fixed inset-x-2 inset-y-6 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[650px] lg:w-[900px] sm:max-h-[85dvh] bg-[#111111] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] z-[101] overflow-hidden flex flex-col shadow-3xl"
          >
            {/* Header */}
            <div className="p-4 sm:p-8 sm:pb-4 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-accent/30">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-serif text-white tracking-tight uppercase leading-none">Intelligence Briefing</h2>
                  <p className="text-[8px] sm:text-[11px] text-accent font-black uppercase tracking-[0.2em] mt-0.5">Application Metadata</p>
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
              {/* Mission Statement */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">The Objective</h3>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-10 space-y-4">
                   <p className="text-[11px] sm:text-[15px] text-gray-400 leading-relaxed font-medium uppercase tracking-wider">
                      This application helps you solve a Rubik’s Cube using your device camera or manual color input.
                   </p>
                </div>
              </section>

              {/* Operational Workflow */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Operational Workflow</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Capture all 6 faces of the cube using the guided interface",
                    "The app detects colors and builds a cube model",
                    "The backend solver computes the optimal solution",
                    "Step-by-step instructions are shown to solve the cube"
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-4 p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md bg-accent/10 flex items-center justify-center shrink-0 text-[10px] sm:text-base font-black text-accent border border-accent/20">
                        {i + 1}
                      </div>
                      <p className="text-[10px] sm:text-[13px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Capabilities */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Capabilities</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { icon: <Camera />, text: "Camera Detection" },
                     { icon: <Edit3 />, text: "Manual Input" },
                     { icon: <Cpu />, text: "Kociemba Algorithm" },
                     { icon: <CheckCircle2 />, text: "Cube Validation" }
                   ].map((cap, i) => (
                     <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                        <div className="text-accent opacity-60 scale-75 shrink-0">{cap.icon}</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{cap.text}</span>
                     </div>
                   ))}
                </div>
              </section>

              {/* Tech Stack */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">System Architecture</h3>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-10 space-y-4">
                   <div className="grid grid-cols-2 gap-6 sm:gap-10">
                      <div className="space-y-1">
                         <h5 className="text-[9px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Frontend</h5>
                         <p className="text-[10px] sm:text-[14px] font-bold text-white uppercase tracking-widest">React / HTML5 / CSS3</p>
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[9px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">3D Rendering</h5>
                         <p className="text-[10px] sm:text-[14px] font-bold text-white uppercase tracking-widest">Three.js Engine</p>
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[9px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Backend</h5>
                         <p className="text-[10px] sm:text-[14px] font-bold text-white uppercase tracking-widest">FastAPI Layer</p>
                      </div>
                      <div className="space-y-1">
                         <h5 className="text-[9px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Logic</h5>
                         <p className="text-[10px] sm:text-[14px] font-bold text-white uppercase tracking-widest">Kociemba Algorithm</p>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic text-center">
                        Cube solving powered by Kociemba algorithm
                      </p>
                   </div>
                </div>
              </section>

               {/* Important Notes */}
               <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Crucial Protocol</h3>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-4">
                   <ul className="space-y-3">
                      {[
                        { text: "Keep White on Top and Green in Front during scanning", icon: <Layers className="w-3 h-3" /> },
                        { text: "Ensure proper lighting for accurate color detection", icon: <Camera className="w-3 h-3" /> },
                        { text: "Each color must appear exactly 9 times", icon: <CheckCircle2 className="w-3 h-3" /> }
                      ].map((note, i) => (
                        <li key={i} className="flex items-center gap-3">
                           <div className="text-red-500 shrink-0">{note.icon}</div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">{note.text}</p>
                        </li>
                      ))}
                   </ul>
                </div>
              </section>

              {/* Developer Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-accent rounded-full" />
                   <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Lead Engineer</h3>
                </div>
                <div className="bg-accent/5 border border-accent/10 rounded-3xl p-6 space-y-6">
                   <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-accent/20 rounded-[1.5rem] sm:rounded-[2rem] blur-xl group-hover:bg-accent/30 transition-all duration-500" />
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#1a1a1a] rounded-[1.5rem] sm:rounded-[1.8rem] overflow-hidden border border-accent/30 shadow-2xl">
                           <img 
                             src="/developer_photo.jpg" 
                             alt="Harrish Yesuraj P"
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               // Fallback to Icon if image doesn't exist
                               (e.target as HTMLImageElement).style.display = 'none';
                               const parent = (e.target as HTMLElement).parentElement;
                               if (parent) {
                                 const icon = document.createElement('div');
                                 icon.className = "w-full h-full flex items-center justify-center text-accent bg-accent/10";
                                 icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>';
                                 parent.appendChild(icon);
                               }
                             }}
                           />
                        </div>
                      </div>
                      <div className="text-center sm:text-left">
                         <h4 className="text-lg sm:text-xl font-serif text-white tracking-tight">HARRISH  YESURAJ  P</h4>
                         <p className="text-[9px] sm:text-[10px] text-accent font-black uppercase tracking-[0.2em] mt-1">Full Stack Developer</p>
                         <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-2">Software & AI Engineer</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <a 
                        href="https://www.linkedin.com/in/harrish-yesuraj-p/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                      >
                         <Linkedin className="w-4 h-4 text-[#0077B5]" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">LinkedIn</span>
                      </a>
                      <a 
                        href="https://github.com/harrishyesuraj" 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                      >
                         <Github className="w-4 h-4 text-white" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">GitHub</span>
                      </a>
                   </div>

                   <a 
                    href="https://github.com/harrishyesuraj/cube-solve-application" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:bg-opacity-90 active:scale-95 transition-all"
                   >
                      <ExternalLink className="w-4 h-4" />
                      View Source Code
                   </a>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-8 pt-2 sm:pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center bg-black/20 gap-3">
               <span className="text-[9px] sm:text-[12px] font-black text-white/20 uppercase tracking-[0.3em]">Version 1.0</span>
               <button 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-[9px] sm:text-[13px] text-white uppercase tracking-widest transition-all"
               >
                  Close Briefing
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
