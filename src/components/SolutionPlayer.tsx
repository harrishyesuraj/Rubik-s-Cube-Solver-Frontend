import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle, Cpu, AlertTriangle, RefreshCcw, Layers, ArrowRight, ChevronRight } from 'lucide-react';
import { Cube3D } from './Cube3D';
import { CubeState, applyMove } from '../utils/cubeUtils';
import { getSolutionFromRemoteAI } from '../services/solverService';

interface SolutionPlayerProps {
  initialState: CubeState;
  onReset?: () => void;
}

export const SolutionPlayer: React.FC<SolutionPlayerProps> = ({ initialState, onReset }) => {
  const [moves, setMoves] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(50);

  // Computed states
  const prevState = useMemo(() => {
    let state = initialState;
    // If currentIndex is -1, skip all moves
    // history index 0 is currentIndex -1
    for (let i = 0; i < currentIndex && i < moves.length; i++) {
        state = applyMove(state, moves[i]);
    }
    return state;
  }, [initialState, moves, currentIndex]);

  const currentState = useMemo(() => {
    let state = initialState;
    // Current index is the last move applied
    for (let i = 0; i <= currentIndex && i < moves.length; i++) {
        state = applyMove(state, moves[i]);
    }
    return state;
  }, [initialState, moves, currentIndex]);

  useEffect(() => {
    async function fetchSolution() {
        setIsLoading(true);
        try {
            const solution = await getSolutionFromRemoteAI(initialState);
            setMoves(solution);
            setError(null);
            // Start at -1 (Initial state) so user can see what to do for move 0
            setCurrentIndex(-1);
            setNavigationHistory([-1]);
            setHistoryIndex(0);
        } catch (err: any) {
            setError(err.message || 'Failed to solve');
        } finally {
            setIsLoading(false);
        }
    }
    fetchSolution();
  }, [initialState]);

  const updateIndexWithHistory = (newIndex: number) => {
    if (newIndex === currentIndex) return;
    
    setCurrentIndex(newIndex);
    setNavigationHistory(prev => {
        const truncated = prev.slice(0, historyIndex + 1);
        return [...truncated, newIndex];
    });
    setHistoryIndex(prev => prev + 1);
  };

  const undoNavigation = () => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1;
      setHistoryIndex(newHistoryIndex);
      setCurrentIndex(navigationHistory[newHistoryIndex]);
    }
  };

  const redoNavigation = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newHistoryIndex = historyIndex + 1;
      setHistoryIndex(newHistoryIndex);
      setCurrentIndex(navigationHistory[newHistoryIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < moves.length) {
      updateIndexWithHistory(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > -1) {
      updateIndexWithHistory(currentIndex - 1);
    }
  };

  const jumpToStart = () => updateIndexWithHistory(-1);
  const jumpToEnd = () => updateIndexWithHistory(moves.length);

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentIndex < moves.length) {
      timer = setTimeout(() => {
        handleNext();
      }, 2000);
    } else if (currentIndex >= moves.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] space-y-10">
        <div className="relative">
            <div className="w-32 h-32 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <Cpu className="absolute inset-0 m-auto w-10 h-10 text-accent animate-pulse" />
        </div>
        <div className="space-y-4 text-center">
            <h3 className="text-4xl font-serif text-white uppercase tracking-[0.2em] leading-tight">SOLVING<span className="text-accent underline underline-offset-8">...</span></h3>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-mono opacity-70">Calculating optimal path</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40dvh] space-y-8 max-w-md mx-auto text-center px-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 rotate-12 relative">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">FAILURE_NODE</div>
        </div>
        <div className="space-y-3">
            <h3 className="text-xl font-serif text-white uppercase">Matrix_Decryption_Error</h3>
            <p className="text-gray-400 text-xs font-mono leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">{error}</p>
        </div>
        
        <div className="w-full space-y-3">
            <div className="bg-accent/5 border border-accent/10 p-4 rounded-2xl text-left">
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" /> Fix Suggestions:
                </p>
                <ul className="text-[11px] text-gray-500 space-y-1.5 list-disc pl-4">
                    <li>Ensure <span className="text-white font-bold">Center colors</span> are in correct standard positions.</li>
                    <li>Check for <span className="text-white font-bold">Reflections</span> on glossy stickers during scan.</li>
                    <li>Verify each color appears exactly <span className="text-white font-bold">9 times</span>.</li>
                </ul>
            </div>

            <button 
              onClick={onReset}
              className="w-full bg-accent text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/20"
            >
              <RefreshCcw className="w-4 h-4" />
              Re-Scan Matrix
            </button>
        </div>
      </div>
    );
  }

  if (moves.length === 0 && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-8 min-h-[50dvh] text-center">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="space-y-2">
            <h3 className="text-3xl font-serif text-white uppercase tracking-tight">PERFECTION_DETECTED</h3>
            <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">The cube is already solved.</p>
        </div>
        <button 
          onClick={onReset}
          className="bg-panel-bg border border-border text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
        >
          Return to Scanner
        </button>
      </div>
    );
  }

  const isComplete = currentIndex === moves.length && moves.length > 0;

  const getMoveDescription = (move: string) => {
    if (!move) return "";
    const face = move[0];
    const isPrime = move.includes("'");
    const isDouble = move.includes("2");
    
    const faceNames: Record<string, string> = {
      U: "TOP", D: "BOTTOM", L: "LEFT", R: "RIGHT", F: "FRONT", B: "BACK"
    };
    
    const faceName = faceNames[face] || face;
    if (isDouble) return `Turn ${faceName} 180°`;
    if (isPrime) return `Turn ${faceName} Counter-Clockwise`;
    return `Turn ${faceName} Clockwise`;
  };

  const getCenterColor = (state: CubeState, face: keyof CubeState) => {
    const colorName = state[face][4]; // Center is at index 4
    const COLORS: Record<string, string> = {
      white: '#FFFFFF',
      yellow: '#FACC15',
      red: '#EF4444',
      orange: '#F97316',
      blue: '#3B82F6',
      green: '#22C55E',
    };
    return COLORS[colorName] || '#18181B';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-2 sm:px-4 space-y-3 sm:space-y-6 pb-20 sm:pb-32">
      <div className="w-full bg-panel-bg rounded-[1.5rem] sm:rounded-[3rem] p-3 sm:p-10 border border-border shadow-3xl space-y-3 sm:space-y-6 relative overflow-visible">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />

        <div className="flex justify-between items-center border-b border-border/40 pb-2.5 sm:pb-6">
            <div className="space-y-0 sm:space-y-1">
                <p className="text-[6.5px] sm:text-[10px] font-black text-accent uppercase tracking-[0.25em] sm:tracking-[0.4em]">Guided Navigation</p>
                <h3 className="text-xs sm:text-2xl font-serif font-black text-white tracking-tight uppercase leading-none">
                    {isComplete ? 'Solved!' : 
                     currentIndex === -1 ? 'Ready' : `Step ${currentIndex + 1} / ${moves.length}`}
                </h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-6">
                 {/* Navigation History Controls */}
                 <div className="flex items-center bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-0.5">
                    <button 
                      onClick={undoNavigation} 
                      disabled={historyIndex <= 0}
                      className="p-1 sm:p-1.5 hover:bg-white/10 rounded-md sm:rounded-lg disabled:opacity-20 transition-all text-gray-400 hover:text-white"
                      title="Undo Navigation"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 -scale-x-100" />
                    </button>
                    <div className="w-px h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />
                    <button 
                      onClick={redoNavigation} 
                      disabled={historyIndex >= navigationHistory.length - 1}
                      className="p-1 sm:p-1.5 hover:bg-white/10 rounded-md sm:rounded-lg disabled:opacity-20 transition-all text-gray-400 hover:text-white"
                      title="Redo Navigation"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                 </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono text-gray-500 uppercase">Progress</span>
                    <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-500" 
                          style={{ width: `${moves.length > 0 ? ((currentIndex + 1) / moves.length) * 100 : 0}%` }} 
                        />
                    </div>
                 </div>
                 <div className="bg-accent/10 border border-accent/20 px-1.5 sm:px-3 py-0.5 rounded-full text-accent font-black text-[8px] sm:text-xs">
                    {moves.length > 0 ? Math.round(((currentIndex + 1) / moves.length) * 100) : 0}%
                 </div>
            </div>
        </div>

        {/* Big Single Cube View */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-8">
            {/* Orientation Guide - More compact for mobile */}
            {!isComplete && (
                <div className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-5 grid grid-cols-2 gap-2 sm:gap-8 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-0.5 sm:gap-2 border-r border-white/10 pr-2">
                        <span className="text-[6px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Top Center</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div 
                                className="w-3 h-3 sm:w-6 sm:h-6 rounded shadow-lg border border-white/20" 
                                style={{ backgroundColor: getCenterColor(prevState, 'U') }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">{prevState['U'][4]}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 sm:gap-2 pl-2">
                        <span className="text-[6px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Front Center</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div 
                                className="w-3 h-3 sm:w-6 sm:h-6 rounded shadow-lg border border-white/20" 
                                style={{ backgroundColor: getCenterColor(prevState, 'F') }}
                            />
                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">{prevState['F'][4]}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="aspect-square w-full max-w-[min(350px,85vw)] sm:max-w-[450px] bg-black rounded-[1.5rem] sm:rounded-[3rem] border border-white/5 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] sm:shadow-[0_0_80px_rgba(0,0,0,0.8)] relative group shrink-0">
                <Cube3D 
                    state={prevState} 
                    currentMove={moves[currentIndex]} 
                    showArrow={true} 
                    highlightMove={true} 
                    instant={!isPlaying}
                    fov={110 - zoom}
                />
                
                {/* Overlay Instruction */}
                <div className="absolute bottom-1 sm:bottom-10 left-0 right-0 px-2 sm:px-8 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 sm:p-6 rounded-xl sm:rounded-3xl flex flex-col items-center transform translate-y-1 sm:translate-y-2 group-hover:translate-y-0 transition-all">
                        <h2 className="text-lg sm:text-5xl font-serif font-black text-accent tracking-tighter leading-none mb-0.5 sm:mb-2">
                            {isComplete ? 'DONE' : moves[currentIndex] || 'START'}
                        </h2>
                        <p className="text-[7px] sm:text-[10px] text-gray-300 font-mono uppercase tracking-[0.2em] text-center max-w-[140px] sm:max-w-[200px] leading-tight">
                            {isComplete ? "Your cube is now solved. Orientation verified." : moves[currentIndex] ? getMoveDescription(moves[currentIndex]) : "Ready to begin the solve sequence. Click Next to see your first move."}
                        </p>
                    </div>
                </div>

                {/* Zoom Control */}
                <div className="absolute top-2 left-2 z-20 group/zoom">
                    <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex flex-col gap-2 items-center">
                        <div className="flex items-center justify-between w-full px-1">
                            <span className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Zoom</span>
                            <button 
                                onClick={() => setZoom(50)}
                                className="text-[6px] text-accent hover:text-white transition-colors font-black uppercase"
                            >
                                Reset
                            </button>
                        </div>
                        <input 
                            type="range" 
                            min="20" 
                            max="80" 
                            value={zoom} 
                            onChange={(e) => setZoom(parseInt(e.target.value))}
                            className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                        />
                    </div>
                </div>

                {/* Manual Rotation Guide Info */}
                <div className="absolute top-2 right-2 sm:hidden">
                    <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                        <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">Orbit Enabled</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8 w-full">
                 <div className="bg-dark-bg/20 p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/40 flex items-center gap-3 sm:gap-6">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/10 rounded-lg sm:rounded-2xl flex items-center justify-center border border-accent/20 shrink-0">
                        <Layers className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[7px] sm:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Precision Control</p>
                        <p className="text-[10px] sm:text-sm text-white font-medium leading-tight">Follow the glowing white arrow. The rotating side is highlighted in <span className="text-white font-bold">pure white</span>.</p>
                    </div>
                 </div>

                  <div className="flex items-center gap-1.5 sm:gap-4">
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={jumpToStart}
                            disabled={currentIndex === -1}
                            className="w-8 h-8 sm:w-12 sm:h-12 bg-panel-bg border border-border text-gray-400 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/5 hover:text-white disabled:opacity-20 transition-all"
                            title="Jump to Start"
                        >
                            <SkipBack className="w-3 h-3 sm:w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={handlePrev}
                        disabled={currentIndex <= -1}
                        className="flex-1 h-12 sm:h-20 bg-panel-bg border border-border text-gray-400 rounded-xl sm:rounded-3xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow-lg active:scale-95 disabled:opacity-20 transition-all hover:bg-white/5 hover:text-white group"
                    >
                        <ChevronRight className="w-3 sm:w-5 sm:h-5 rotate-180 group-hover:scale-110 transition-transform" />
                        <span className="text-[5.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Prev</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex-[2] h-12 sm:h-20 rounded-xl sm:rounded-[2rem] flex flex-col items-center justify-center gap-0 sm:gap-1 transition-all shadow-2xl relative overflow-hidden group ${
                            isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-accent text-white border border-accent/50 scale-105'
                        }`}
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isPlaying ? <Pause className="w-4 h-4 sm:w-7 sm:h-7 fill-current" /> : <Play className="w-4 h-4 sm:w-7 sm:h-7 fill-current ml-0.5 sm:ml-1" />}
                        <span className="text-[6.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] font-mono">
                            {isPlaying ? 'STOP' : 'AUTO'}
                        </span>
                    </button>

                    <button 
                        onClick={handleNext}
                        disabled={currentIndex >= moves.length}
                        className="flex-1 h-12 sm:h-20 bg-panel-bg border border-border text-gray-400 rounded-xl sm:rounded-3xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow-lg active:scale-95 disabled:opacity-20 transition-all hover:bg-white/5 hover:text-white group"
                    >
                        <ChevronRight className="w-3 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[5.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Next</span>
                    </button>

                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={jumpToEnd}
                            disabled={currentIndex === moves.length}
                            className="w-8 h-8 sm:w-12 sm:h-12 bg-panel-bg border border-border text-gray-400 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-white/5 hover:text-white disabled:opacity-20 transition-all"
                            title="Jump to End"
                        >
                            <SkipForward className="w-3 h-3 sm:w-4 h-4" />
                        </button>
                    </div>
                 </div>
            </div>
        </div>

        <div className="pt-8 border-t border-border/40">
            <div className="flex gap-3 overflow-x-auto pb-6 noscrollbar scroll-smooth snap-x">
                <button 
                    onClick={() => updateIndexWithHistory(-1)}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-[10px] font-black transition-all snap-start ${
                        -1 === currentIndex ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110 border-accent' : 'bg-dark-bg/50 text-gray-600 border-border'
                    }`}
                >
                    START
                </button>
                {moves.map((m, i) => (
                    <button 
                        key={i}
                        onClick={() => updateIndexWithHistory(i)}
                        className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-xs font-black transition-all snap-start ${
                            i === currentIndex ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110 border-accent' : 
                            i < currentIndex ? 'bg-green-500/5 text-green-500/50 border-green-500/10' : 'bg-dark-bg/50 text-gray-600 border-border'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
            
            <button 
                onClick={onReset}
                className="w-full bg-panel-bg/40 border border-border/50 text-gray-600 h-12 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all hover:text-white hover:border-accent/40"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Return to Scanner
            </button>

            {/* Beginner Instructions Footer */}
            <div className="mt-4 bg-neutral-900/50 border border-border/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                    </div>
                    <h4 className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">Beginner Tips</h4>
                </div>
                <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-1 w-1 h-1 rounded-full bg-accent shrink-0" />
                        <p className="text-[10px] sm:text-[11px] text-gray-400 leading-tight sm:leading-relaxed"><span className="text-white font-bold">Centers never move:</span> Use middle colors as your guide!</p>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-1 w-1 h-1 rounded-full bg-accent shrink-0" />
                        <p className="text-[10px] sm:text-[11px] text-gray-400 leading-tight sm:leading-relaxed"><span className="text-white font-bold">Face the Front:</span> Keep the FRONT center facing you at all times.</p>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};
;
