import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight, RotateCcw, RotateCw } from 'lucide-react';
import { CubeState, FaceColor } from '../utils/cubeUtils';

const COLOR_CLASSES: Record<FaceColor, string> = {
  white: 'bg-white',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-600',
  green: 'bg-green-500',
};

interface FaceGridProps {
  colors: FaceColor[];
  move?: string;
  isAfter?: boolean;
}

export const FaceGrid: React.FC<FaceGridProps> = ({ colors, move, isAfter }) => {
  const getMoveOverlay = () => {
    if (isAfter || !move) return null;
    
    const isPrime = move.includes("'");
    const isDouble = move.includes("2");

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <motion.div
           initial={{ scale: 0.5, opacity: 0, rotate: isPrime ? 45 : -45 }}
           animate={{ scale: 1, opacity: 1, rotate: 0 }}
           className="bg-black/60 backdrop-blur-md rounded-full p-6 border-2 border-accent shadow-[0_0_30px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center"
        >
          {isPrime ? (
            <RotateCcw className="w-16 h-16 text-accent drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          ) : (
            <RotateCw className="w-16 h-16 text-accent drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          )}
          <span className="mt-2 text-[10px] font-black text-white tracking-widest uppercase">
            {isDouble ? "TWO TURNS" : (isPrime ? "LEFT TURN" : "RIGHT TURN")}
          </span>
          {isDouble && <span className="absolute top-2 right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black border border-white/20">2x</span>}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="relative aspect-square w-full max-w-[200px] bg-neutral-900 rounded-xl p-1 shadow-2xl border border-white/5">
      {getMoveOverlay()}
      <div className="grid grid-cols-3 gap-1 h-full w-full">
        {colors.map((color, idx) => (
          <div
            key={idx}
            className={`${COLOR_CLASSES[color]} w-full h-full rounded-sm border border-black/20 shadow-inner`}
          />
        ))}
      </div>
    </div>
  );
};

interface Cube2DProps {
  state: CubeState;
  move?: string;
  isAfter?: boolean;
}

export const Cube2D: React.FC<Cube2DProps> = ({ state, move, isAfter }) => {
  // Determine which face to show based on the move
  // Standard: show the face that is being rotated
  let faceToShow: keyof CubeState = 'F';
  if (move) {
    const faceChar = move[0] as keyof CubeState;
    if (['U', 'D', 'L', 'R', 'F', 'B'].includes(faceChar)) {
        faceToShow = faceChar;
    }
  }

  const faceNames: Record<string, string> = {
    U: "TOP",
    D: "BOTTOM",
    L: "LEFT",
    R: "RIGHT",
    F: "FRONT",
    B: "BACK"
  };

  const faceColors: Record<keyof CubeState, string> = {
    U: COLOR_CLASSES[state.U[4]],
    D: COLOR_CLASSES[state.D[4]],
    L: COLOR_CLASSES[state.L[4]],
    R: COLOR_CLASSES[state.R[4]],
    F: COLOR_CLASSES[state.F[4]],
    B: COLOR_CLASSES[state.B[4]],
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative flex flex-col items-center">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">{faceNames[faceToShow]} FACE</span>
        <FaceGrid colors={state[faceToShow]} move={move} isAfter={isAfter} />
        
        {/* Orientation Key */}
        <div className="absolute -top-4 -right-12 sm:-right-16 flex flex-col items-center gap-1 opacity-80 backdrop-blur-sm bg-black/40 p-2 rounded-xl border border-white/10 shadow-2xl">
            <span className="text-[8px] font-black text-accent uppercase tracking-tighter">Your View</span>
            <div className="relative w-10 h-10">
                {/* Simple Perspective Cube Icon */}
                <div className={`absolute top-0 left-2 w-6 h-6 border-2 transform -skew-x-12 -skew-y-12 transition-all ${faceToShow === 'U' ? 'border-accent scale-110 z-10' : 'border-white/20'} ${faceColors.U}`} />
                <div className={`absolute top-2 left-0 w-6 h-6 border-2 transition-all ${faceToShow === 'F' ? 'border-accent scale-110 z-10' : 'border-white/20'} ${faceColors.F}`} />
                <div className={`absolute top-2 left-4 w-6 h-6 border-2 transform skew-y-12 transition-all ${faceToShow === 'R' ? 'border-accent scale-110 z-10' : 'border-white/20'} ${faceColors.R}`} />
            </div>
            <span className="text-[7px] text-white/60 font-mono">Orient 3D</span>
        </div>
      </div>
      
      {/* Mini layout of other faces for context */}
      <div className="grid grid-cols-4 gap-2 opacity-50 scale-75">
          {Object.entries(faceNames).filter(([k]) => k !== faceToShow).map(([key, name]) => (
              <div key={key} className="flex flex-col items-center">
                  <span className="text-[8px] font-mono mb-1">{name[0]}</span>
                  <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
                      {state[key as keyof CubeState].map((c, i) => (
                          <div key={i} className={`${COLOR_CLASSES[c]} w-full h-full rounded-[1px]`} />
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
