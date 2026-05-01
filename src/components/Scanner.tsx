import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Camera, RefreshCw, CheckCircle2, ChevronRight, AlertCircle, Edit3, Keyboard, Monitor, Cpu, Sparkles, SwitchCamera, Undo2, Redo2, ArrowRight, ArrowLeft, RotateCw, History, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FaceColor, CubeState, INITIAL_STATE, isSolved, cubeStateTo3x3Matrix, applyMove, getMoveDescription } from '../utils/cubeUtils';
import { Cube3D } from './Cube3D';

interface ScannerProps {
  onComplete: (state: CubeState) => void;
}

const FACE_ORDER: (keyof CubeState)[] = ['U', 'F', 'R', 'B', 'L', 'D'];

const CAPTURE_STEPS = [
  { face: 'U' as keyof CubeState, instruction: 'Capture TOP (WHITE)', detail: 'Keep WHITE face on top, GREEN face facing you.', icon: <RotateCw className="w-5 h-5 text-accent" /> },
  { face: 'F' as keyof CubeState, instruction: 'Capture FRONT (GREEN)', detail: 'Keep WHITE face on top, GREEN face facing you.', icon: <Camera className="w-5 h-5 text-accent" /> },
  { face: 'R' as keyof CubeState, instruction: 'Capture RIGHT (RED)', detail: 'Rotate the cube 90° to the LEFT (Right face moves to front).', icon: <ArrowLeft className="w-5 h-5 text-accent" /> },
  { face: 'B' as keyof CubeState, instruction: 'Capture BACK (BLUE)', detail: 'Rotate the cube another 90° to the LEFT (Back face moves to front).', icon: <ArrowLeft className="w-5 h-5 text-accent" /> },
  { face: 'L' as keyof CubeState, instruction: 'Capture LEFT (ORANGE)', detail: 'Rotate the cube another 90° to the LEFT (Left face moves to front).', icon: <ArrowLeft className="w-5 h-5 text-accent" /> },
  { face: 'D' as keyof CubeState, instruction: 'Capture BOTTOM (YELLOW)', detail: 'Rotate the cube 180° back to Front, then flip it UP (Bottom face moves to front).', icon: <RotateCw className="w-5 h-5 text-accent" /> },
];

const FACE_NAMES: Record<string, string> = {
  U: 'Top',
  F: 'Front',
  R: 'Right',
  B: 'Back',
  L: 'Left',
  D: 'Bottom',
};

const getFaceOrientation = (face: string) => {
  switch(face) {
    case 'U': return { center: 'White', top: 'Blue', front: 'Green' };
    case 'F': return { center: 'Green', top: 'White', front: 'Green' };
    case 'R': return { center: 'Red', top: 'White', front: 'Red' };
    case 'B': return { center: 'Blue', top: 'White', front: 'Blue' };
    case 'L': return { center: 'Orange', top: 'White', front: 'Orange' };
    case 'D': return { center: 'Yellow', top: 'Green', front: 'Yellow' };
    default: return { center: '', top: '', front: '' };
  }
};

const COLOR_HEX: Record<FaceColor, string> = {
  white: '#FFFFFF',
  yellow: '#FACC15',
  red: '#EF4444',
  orange: '#F97316',
  blue: '#3B82F6',
  green: '#22C55E',
};

export const Scanner: React.FC<ScannerProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [captureState, setCaptureState] = useState<Partial<CubeState>>({});
  const [liveColors, setLiveColors] = useState<FaceColor[] | null>(null);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [lastDetectedColors, setLastDetectedColors] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [reviewColors, setReviewColors] = useState<FaceColor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isFinalReview, setIsFinalReview] = useState(false);
  const loadingCameraRef = useRef(false);

  // Undo/Redo states for manual color entry
  const [history, setHistory] = useState<FaceColor[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fullCubeHistory, setFullCubeHistory] = useState<Partial<CubeState>[]>([]);
  const [fullCubeHistoryIndex, setFullCubeHistoryIndex] = useState(-1);

  const addToHistory = (colors: FaceColor[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, [...colors]]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setReviewColors([...history[nextIndex]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setReviewColors([...history[nextIndex]]);
    }
  };

  const addToCubeHistory = (state: Partial<CubeState>) => {
    const newHistory = fullCubeHistory.slice(0, fullCubeHistoryIndex + 1);
    setFullCubeHistory([...newHistory, JSON.parse(JSON.stringify(state))]);
    setFullCubeHistoryIndex(newHistory.length);
  };

  const undoCube = () => {
    if (fullCubeHistoryIndex > 0) {
      const nextIndex = fullCubeHistoryIndex - 1;
      setFullCubeHistoryIndex(nextIndex);
      setCaptureState(JSON.parse(JSON.stringify(fullCubeHistory[nextIndex])));
    }
  };

  const redoCube = () => {
    if (fullCubeHistoryIndex < fullCubeHistory.length - 1) {
      const nextIndex = fullCubeHistoryIndex + 1;
      setFullCubeHistoryIndex(nextIndex);
      setCaptureState(JSON.parse(JSON.stringify(fullCubeHistory[nextIndex])));
    }
  };

  const startCamera = async (specificDeviceId?: string) => {
    if (loadingCameraRef.current || isManualMode) return;
    loadingCameraRef.current = true;
    setError(null);

    // Stop current stream immediately to release hardware
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Increased cooldown for hardware release, especially important for some mobile devices
    await new Promise(resolve => setTimeout(resolve, 500));

    // Helper for getUserMedia with timeout
    const getStreamWithTimeout = async (constraints: MediaStreamConstraints, timeoutMs: number = 8000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        clearTimeout(timeoutId);
        return stream;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Timeout starting video source');
        throw err;
      }
    };

    try {
      const activeId = specificDeviceId || currentDeviceId;
      const constraints: MediaStreamConstraints = {
        video: activeId 
          ? { deviceId: { exact: activeId } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 } }
      };
      
      let s: MediaStream;
      try {
        s = await getStreamWithTimeout(constraints);
      } catch (firstErr) {
        console.warn("First camera attempt failed, trying fallback constraints...", firstErr);
        // Fallback to basic video if complex constraints failed
        s = await getStreamWithTimeout({ video: true });
      }
      
      if (!loadingCameraRef.current || isManualMode) {
        s.getTracks().forEach(t => t.stop());
        return;
      }

      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.setAttribute('playsinline', 'true');
        
        // Handle play() promise to catch potential hangs
        try {
          await Promise.race([
            videoRef.current.play(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Video playback timeout")), 5000))
          ]);
        } catch (playErr) {
          console.error("Video play error:", playErr);
          throw new Error("Unable to start video playback. Try refreshing.");
        }
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      
      const track = s.getVideoTracks()[0];
      if (track) {
        const actualDeviceId = track.getSettings().deviceId || null;
        // Don't update state if it matches to avoid re-triggering effect
        if (actualDeviceId && actualDeviceId !== currentDeviceId) {
          setCurrentDeviceId(actualDeviceId);
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("CAMERA_PERMISSION_DENIED: Please enable camera access in your browser settings or use Manual Mode.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError("CAMERA_NOT_FOUND: No camera detected. Switching to Manual Mode.");
          setTimeout(() => toggleManualMode(true), 2000);
        } else {
          setError(`CAMERA_ERROR: ${err.message}. Try Manual Mode.`);
        }
      }
    } finally {
      loadingCameraRef.current = false;
    }
  };

  useEffect(() => {
    if (!isManualMode && !isFinalReview) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isManualMode, isFinalReview, facingMode, currentDeviceId]);

  // Ensure stream is attached to video element when it mounts or when review ends
  useEffect(() => {
    if (videoRef.current && stream && !isManualMode && !isFinalReview) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      
      // Ensure video is playing
      videoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') {
          console.error("Camera play error:", e);
        }
      });
    }
  }, [stream, isManualMode, isFinalReview, reviewColors, currentFaceIndex]);

  const toggleManualMode = (manual: boolean) => {
    setIsManualMode(manual);
    setError(null);
    if (manual) {
      const face = FACE_ORDER[currentFaceIndex];
      const centerColor = INITIAL_STATE[face][4];
      const initialColors = Array(9).fill(centerColor) as FaceColor[];
      setReviewColors(initialColors);
      setHistory([initialColors]);
      setHistoryIndex(0);
    } else {
      setReviewColors(null);
    }
  };

  const toggleCamera = async () => {
    if (devices.length > 1) {
      const idx = devices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (idx + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      setCurrentDeviceId(nextDevice.deviceId);
    } else {
      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextMode);
      setCurrentDeviceId(null); // Reset device ID to use facingMode ideal
    }
  };

  const stabilityRef = useRef({ count: 0, lastKey: '' });
  const [isSolvingInternal, setIsSolvingInternal] = useState(false);

  // RGB to HSV Conversion helper
  function rgbToHsv(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s, v };
  }

  // Color Classification using HSV
  function classifyHSV(h: number, s: number, v: number): FaceColor {
    // White: Low saturation, medium-high value
    if (s < 0.28 && v > 0.45) return 'white';
    
    // Very dark: potentially shadow or black frame, but we need a cube color
    if (v < 0.15) return 'white'; 

    if (h < 15 || h > 345) {
        // Red vs Orange around 15 degrees
        return (s > 0.75 || v < 0.6) ? 'red' : 'orange';
    }
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 75) return 'yellow';
    if (h >= 75 && h < 160) return 'green';
    if (h >= 160 && h < 260) return 'blue';
    if (h >= 260 && h < 345) return 'red';
    
    return 'white';
  }

  // Majority Vote Sampler (Steps 2-7)
  const getMajorityColor = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number): FaceColor => {
    const votes: Record<FaceColor, number> = { white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0 };
    const sampleRegion = 12; // Sample a 24x24 area for each sticker
    const sampleStep = 4;
    
    for (let x = -sampleRegion; x <= sampleRegion; x += sampleStep) {
      for (let y = -sampleRegion; y <= sampleRegion; y += sampleStep) {
        const data = ctx.getImageData(centerX + x, centerY + y, 1, 1).data;
        const { h, s, v } = rgbToHsv(data[0], data[1], data[2]);
        const color = classifyHSV(h, s, v);
        votes[color]++;
      }
    }

    // Find majority color among samples
    let maxVotes = -1;
    let winner: FaceColor = 'white';
    (Object.entries(votes) as [FaceColor, number][]).forEach(([color, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = color as FaceColor;
      }
    });

    return winner;
  };

  useEffect(() => {
    let animationFrameId: number;
    let timeoutId: number;
    let isMounted = true;
    
    const detectLoop = async () => {
      if (!isMounted) return;

      if (!isManualMode && !isFinalReview && !isSolvingInternal && stream && videoRef.current && canvasRef.current && !reviewColors) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null;
        
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const size = Math.min(canvas.width, canvas.height) * 0.65;
          const offset = size / 3;

          const detectedColors: FaceColor[] = [];
          const positions = [
            [-offset, -offset], [0, -offset], [offset, -offset],
            [-offset, 0],       [0, 0],       [offset, 0],
            [-offset, offset],  [0, offset],  [offset, offset]
          ];

          for (const [ox, oy] of positions) {
            detectedColors.push(getMajorityColor(ctx, Math.round(centerX + ox), Math.round(centerY + oy)));
          }

          const colorsKey = JSON.stringify(detectedColors);
          setLiveColors(detectedColors);
          
          if (colorsKey === stabilityRef.current.lastKey) {
            stabilityRef.current.count = Math.min(stabilityRef.current.count + 1, 15);
          } else {
            stabilityRef.current.count = 0;
            stabilityRef.current.lastKey = colorsKey;
          }
          
          if (stabilityRef.current.count !== stabilityCounter) {
            setStabilityCounter(stabilityRef.current.count);
          }
        }
        animationFrameId = requestAnimationFrame(detectLoop);
      } else {
        timeoutId = window.setTimeout(() => {
            if (isMounted) requestAnimationFrame(detectLoop);
        }, 100) as unknown as number;
      }
    };

    animationFrameId = requestAnimationFrame(detectLoop);
    
    return () => {
        isMounted = false;
        cancelAnimationFrame(animationFrameId);
        clearTimeout(timeoutId);
    };
  }, [isManualMode, isFinalReview, isSolvingInternal, stream, reviewColors]);

  const captureFrame = useCallback(async () => {
    if (liveColors && stabilityRef.current.count >= 5) {
      const captured = [...liveColors];
      setReviewColors(captured);
      setHistory([captured]);
      setHistoryIndex(0);
    } else if (stabilityRef.current.count < 5) {
      setError("STABILITY_LOW: Keep the cube still for a moment.");
      setTimeout(() => setError(null), 2000);
    }
  }, [liveColors]);

  const confirmFace = () => {
    if (!reviewColors) return;

    const face = FACE_ORDER[currentFaceIndex];
    const nextCubeState = { ...captureState, [face]: reviewColors };
    setCaptureState(nextCubeState);
    setReviewColors(null);
    setHistory([]);
    setHistoryIndex(-1);

    if (currentFaceIndex < FACE_ORDER.length - 1) {
      const nextIdx = currentFaceIndex + 1;
      setCurrentFaceIndex(nextIdx);
      // Auto-init manual override if we were in manual mode
      if (isManualMode) {
        const nextFace = FACE_ORDER[nextIdx];
        const centerColor = INITIAL_STATE[nextFace][4];
        const initialColors = Array(9).fill(centerColor) as FaceColor[];
        setReviewColors(initialColors);
        setHistory([initialColors]);
        setHistoryIndex(0);
      }
    } else {
      setIsFinalReview(true);
      setFullCubeHistory([nextCubeState]);
      setFullCubeHistoryIndex(0);
    }
  };

  const cycleColor = (colors: FaceColor[], index: number, setter: (c: FaceColor[]) => void) => {
    if (index === 4) return; // Keep center
    const allColors: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];
    const currentColor = colors[index];
    const colorIndex = allColors.indexOf(currentColor);
    const nextColor = allColors[(colorIndex + 1) % allColors.length];
    
    const newColors = [...colors];
    newColors[index] = nextColor;
    addToHistory(newColors);
    setter(newColors);
  };

  const resetCube = () => {
    setIsFinalReview(false);
    setCurrentFaceIndex(0);
    setCaptureState({});
    setError(null);
    setReviewColors(null);
  };

  const colorCounts = useMemo(() => {
    const counts: Record<FaceColor, number> = {
      white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0
    };
    FACE_ORDER.forEach(f => {
      const face = captureState[f];
      if (face) {
        face.forEach(c => counts[c]++);
      }
    });
    return counts;
  }, [captureState]);

  const isValidDistribution = Object.values(colorCounts).every(count => count === 9);

  const currentState = useMemo(() => {
    return {
      U: captureState.U || Array(9).fill('white'),
      F: captureState.F || Array(9).fill('green'),
      R: captureState.R || Array(9).fill('red'),
      B: captureState.B || Array(9).fill('blue'),
      L: captureState.L || Array(9).fill('orange'),
      D: captureState.D || Array(9).fill('yellow'),
    };
  }, [captureState]);

  if (isFinalReview) {
    const cubeIsSolved = isSolved(currentState);
    
    // Calculate color distribution for validation feedback
    const colorCounts: Record<FaceColor, number> = {
        white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0
    };
    FACE_ORDER.forEach(f => currentState[f].forEach(c => colorCounts[c]++));
    
    const isValidDistribution = Object.values(colorCounts).every(count => count === 9);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 w-full max-w-2xl mx-auto pb-20">
        <div className="flex flex-col items-center gap-2 text-center">
            <div className={`w-16 h-16 ${cubeIsSolved ? 'bg-green-500/10' : !isValidDistribution ? 'bg-red-500/10' : 'bg-accent/10'} rounded-3xl flex items-center justify-center border ${cubeIsSolved ? 'border-green-500/20' : !isValidDistribution ? 'border-red-500/20' : 'border-accent/20'} mb-2`}>
                {cubeIsSolved ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <CheckCircle2 className="w-8 h-8 text-accent" />}
            </div>
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-serif text-white uppercase tracking-tight">
                    {cubeIsSolved ? 'System: Solved' : 'Matrix Verification'}
                </h2>
                <div className="flex gap-2">
                    <button 
                        onClick={undoCube} 
                        disabled={fullCubeHistoryIndex <= 0}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-20 transition-all"
                        title="Undo Change"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={redoCube} 
                        disabled={fullCubeHistoryIndex >= fullCubeHistory.length - 1}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-20 transition-all"
                        title="Redo Change"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {(Object.entries(colorCounts) as [FaceColor, number][]).map(([color, count]) => (
                    <div key={color} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${count === 9 ? 'border-green-500/20 bg-green-500/5 text-green-500' : 'border-red-500/20 bg-red-500/5 text-red-500'} text-[9px] font-black uppercase tracking-widest`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_HEX[color] }} />
                        <span>{count}/9</span>
                    </div>
                ))}
            </div>
            {!isValidDistribution && (
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-2">
                    Physical Imbalance: Each color must have exactly 9 stickers.
                </p>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FACE_ORDER.map(face => (
                <div key={face} className="bg-[#111111] p-5 rounded-[2rem] border border-white/5 space-y-4 hover:border-accent/20 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{FACE_NAMES[face]} FACE</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_HEX[currentState[face][4]] }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 aspect-square relative">
                        {currentState[face].map((color, i) => (
                            <button
                                key={i}
                                disabled={isSolvingInternal}
                                onClick={() => {
                                    const newFaceColors = [...currentState[face]];
                                    const allCols: FaceColor[] = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];
                                    const next = allCols[(allCols.indexOf(color) + 1) % allCols.length];
                                    newFaceColors[i] = next;
                                    const nextState = { ...captureState, [face]: newFaceColors };
                                    setCaptureState(nextState);
                                    addToCubeHistory(nextState);
                                }}
                                className={`w-full h-full rounded-md border border-black/40 shadow-inner transition-all ${isSolvingInternal ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
                                style={{ backgroundColor: COLOR_HEX[color] }}
                            />
                        ))}
                        {isSolvingInternal && (
                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] rounded-lg z-10" />
                        )}
                    </div>
                </div>
            ))}
        </div>

        <div className="flex flex-col gap-4 pt-4">
            <button
                disabled={isSolvingInternal}
                onClick={() => {
                    const testCube: CubeState = {
                        U: Array(9).fill('white'),
                        R: Array(9).fill('red'),
                        F: Array(9).fill('green'),
                        D: Array(9).fill('yellow'),
                        L: Array(9).fill('orange'),
                        B: Array(9).fill('blue')
                    };
                    // Scramble a few moves to make it interesting
                    // R U R' U'
                    const scrambled = applyMove(testCube, "R");
                    const scrambled2 = applyMove(scrambled, "U");
                    setCaptureState(scrambled2);
                }}
                className="w-full bg-white/10 text-white h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
            >
                LOAD_TEST_MATRIX (Bypass Camera)
            </button>
            <button
                onClick={async (e) => {
                    e.preventDefault();
                    if (isSolvingInternal) return;

                    // STEP 1: Final Distribution Check
                    let counts: Record<string, number> = { white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0 };
                    FACE_ORDER.forEach(f => currentState[f].forEach(c => counts[c]++));
                    const isTotalValid = Object.values(counts).every(v => v === 9);
                    
                    if (!isTotalValid) {
                        setError("VALIDATION_ERROR: Cube must have exactly 9 stickers of each color.");
                        setTimeout(() => setError(null), 3000);
                        return;
                    }

                    // STEP 2: Pure Local Freeze
                    const immutableState = JSON.parse(JSON.stringify(currentState));
                    
                    // STEP 3: Enforce all faces captured
                    const capturedCount = Object.keys(captureState).length;
                    if (capturedCount < 6) {
                        setError(`INCOMPLETE_CUBE: Captured ${capturedCount}/6 faces.`);
                        setTimeout(() => setError(null), 3000);
                        return;
                    }
                    
                    setIsSolvingInternal(true);
                    try {
                        console.info("--- FREEZE: DISPATCHING FINAL MATRIX ---");
                        console.log("MATRIX_PAYLOAD:", JSON.stringify(cubeStateTo3x3Matrix(immutableState), null, 2));
                        console.info("-----------------------------------------");
                        
                        await onComplete(immutableState);
                    } catch (err: any) {
                        setError(err.message);
                    } finally {
                        setIsSolvingInternal(false);
                    }
                }}
                disabled={!isValidDistribution || isSolvingInternal}
                className={`w-full ${cubeIsSolved ? 'bg-green-600' : !isValidDistribution ? 'bg-gray-800' : 'bg-accent'} text-white h-20 rounded-[32px] font-serif uppercase tracking-widest flex items-center justify-center gap-3 shadow-3xl ${cubeIsSolved ? 'shadow-green-500/20' : 'shadow-accent/20'} active:scale-95 transition-all text-xl group disabled:opacity-50`}
            >
                <div className="flex items-center gap-4 group-hover:scale-105 transition-transform">
                    {isSolvingInternal ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : cubeIsSolved ? (
                        <CheckCircle2 className="w-7 h-7" />
                    ) : (
                        <Cpu className="w-7 h-7" />
                    )}
                    {isSolvingInternal ? 'PROCESSING...' : cubeIsSolved ? 'CUBE_ALREADY_SOLVED' : 'INIT_SOLVE_SEQUENCE'}
                </div>
            </button>
            <button
                disabled={isSolvingInternal}
                onClick={() => {
                    setIsFinalReview(false);
                    setCurrentFaceIndex(0);
                    setCaptureState({});
                }}
                className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-all border border-white/5"
            >
                REINITIALIZE_CAPTURE_STREAM
            </button>
        </div>
      </div>
    );
  }

  const currentFace = FACE_ORDER[currentFaceIndex];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-md mx-auto px-1 sm:px-0">
      {/* Fixed Orientation Context - UX Pillar */}
      <div className="w-full bg-[#111111]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-2.5 sm:p-4 flex justify-between items-center px-4 sm:px-6">
        <div className="flex flex-col">
           <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">Fixed Orientation</span>
           <div className="flex gap-3 sm:gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm bg-white" />
                 <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Top (U)</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm bg-[#22C55E]" />
                 <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Front (F)</span>
              </div>
           </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {!isManualMode && (
            <button 
              onClick={toggleCamera}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <SwitchCamera className="w-3 h-3" />
              Flip
            </button>
          )}
          <button 
            onClick={resetCube}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="w-full bg-[#111111] rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden p-3 sm:p-6 space-y-3 sm:space-y-6">
        <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-accent/30 shadow-lg shadow-accent/10">
                        {CAPTURE_STEPS[currentFaceIndex].icon}
                    </div>
                    <div>
                        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{CAPTURE_STEPS[currentFaceIndex].instruction}</h3>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black text-white/50 tracking-widest">
                    {currentFaceIndex + 1} / 6
                </div>
            </div>
            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest leading-relaxed px-1">
              {CAPTURE_STEPS[currentFaceIndex].detail}
            </p>
        </div>

        {/* 6-Face Progress Bar */}
        <div className="grid grid-cols-6 gap-2">
            {FACE_ORDER.map((f, i) => (
                <div 
                    key={f} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                        i < currentFaceIndex ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                        i === currentFaceIndex ? 'bg-accent animate-pulse' : 'bg-white/5'
                    }`} 
                />
            ))}
        </div>

        <div className="relative aspect-square w-full max-w-[280px] sm:max-w-none mx-auto bg-[#0c0c0c] rounded-xl sm:rounded-[2rem] border border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Guide overlay with orientation instructions */}
            {!reviewColors && !isFinalReview && (
              <>
                <div className="absolute top-0 left-0 right-0 p-8 space-y-3 z-30 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{FACE_NAMES[FACE_ORDER[currentFaceIndex]]}</span>
                    </div>
                    <div className="bg-accent/20 border border-accent/40 px-2 py-0.5 rounded text-[8px] font-black text-accent uppercase tracking-widest">
                        Scanning
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest opacity-60 italic">Face Center Color</span>
                       <span className="text-xs text-accent font-black tracking-widest uppercase">{getFaceOrientation(FACE_ORDER[currentFaceIndex]).center}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest opacity-60 italic">Orient (Top Side)</span>
                       <span className="text-xs text-white font-black tracking-widest uppercase">{getFaceOrientation(FACE_ORDER[currentFaceIndex]).top}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="absolute bottom-10 left-6 right-6 z-30 bg-red-500/90 backdrop-blur-md p-4 rounded-2xl flex flex-col gap-2 border border-red-400/50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-white" />
                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">{error.includes('PERMISSION') ? 'Camera Access Blocked' : 'Scanning Conflict'}</p>
                    </div>
                    {error.includes('PERMISSION') && (
                      <p className="text-[8px] font-bold text-white/80 leading-relaxed">
                        To resolve this: Click the camera icon in your browser's address bar and select "Always allow", then refresh. Or switch to Manual Entry below.
                      </p>
                    )}
                    {!error.includes('PERMISSION') && (
                      <p className="text-[9px] font-black text-white uppercase tracking-widest leading-tight">{error}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Camera / Manual Background */}
            {!isManualMode ? (
              <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${reviewColors ? 'opacity-30' : 'opacity-100'}`}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* High-Contrast Grid Overlay */}
                  {!reviewColors && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-2/3 h-2/3 relative border-4 border-accent/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                          {/* Grid Lines */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                              {[...Array(9)].map((_, i) => (
                                  <div key={i} className={`border border-white/20 flex items-center justify-center ${i === 4 ? 'bg-accent/5' : ''}`}>
                                      {i === 4 && (
                                          <div className="relative">
                                              <div className="w-6 h-6 border-2 border-accent/40 rounded-full animate-ping absolute -inset-0" />
                                              <div className="w-6 h-6 border-2 border-accent rounded-full flex items-center justify-center">
                                                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                          
                          {/* Detected Colors Overlay */}
                          {liveColors && !reviewColors && (
                             <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 p-3 opacity-60">
                                 {liveColors.map((c, i) => (
                                     <div key={i} className="rounded-lg shadow-lg border border-black/20" style={{ backgroundColor: COLOR_HEX[c] }} />
                                 ))}
                             </div>
                          )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
                <div className="z-10 flex flex-col items-center gap-4 sm:gap-6 p-6 sm:p-10">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                        <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                    </div>
                    <div className="space-y-1 sm:space-y-2 text-center">
                        <p className="text-[10px] sm:text-[11px] text-white font-black uppercase tracking-widest">Manual Setup</p>
                        <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium max-w-[150px] sm:max-w-[180px] leading-relaxed uppercase tracking-wider">
                           Tap squares to match colors
                        </p>
                    </div>
                </div>
            )}

            {/* Review Overlay */}
            {reviewColors && (
              <div className="absolute inset-0 p-4 sm:p-10 grid grid-cols-3 gap-2 bg-black/80 backdrop-blur-xl z-20">
                <div className="absolute top-2 sm:top-4 left-4 right-4 flex justify-between items-center px-2 sm:px-4">
                    <span className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-widest">Manual Correction</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); undo(); }} 
                            disabled={historyIndex <= 0}
                            className="p-1 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-20 transition-all"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); redo(); }} 
                            disabled={historyIndex >= history.length - 1}
                            className="p-1 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-20 transition-all"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setReviewColors(null)}
                          className="p-1 sm:p-2 hover:bg-white/10 rounded-lg text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {reviewColors.map((color, i) => (
                    <button
                        key={i}
                        onClick={() => cycleColor(reviewColors, i, setReviewColors)}
                        className="w-full aspect-square rounded-xl border border-white/10 shadow-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: COLOR_HEX[color] }}
                    >
                        {i === 4 && <div className="w-2 h-2 bg-white/40 rounded-full mx-auto" />}
                    </button>
                ))}
              </div>
            )}

            {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-40 gap-4">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest font-mono animate-pulse">Synchronizing Matrix...</p>
                </div>
            )}
        </div>

        {/* Global Sticker Validation Bar - Real-time feedback */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 grid grid-cols-3 gap-2">
            {(Object.entries(colorCounts) as [FaceColor, number][]).map(([color, count]) => (
                <div key={color} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5">
                   <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: COLOR_HEX[color] }} />
                   <span className={`text-[9px] font-black tracking-widest ${count === 9 ? 'text-green-500' : count > 9 ? 'text-red-500 font-bold' : 'text-white/40'}`}>
                      {count}/9
                   </span>
                </div>
            ))}
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          {!reviewColors ? (
            <div className="flex gap-3">
              {!isManualMode && (
                <button
                  onClick={captureFrame}
                  className="flex-1 h-14 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture Face
                </button>
              )}
              {isManualMode && (
                 <button
                   onClick={() => {
                     setReviewColors(currentState[currentFace]);
                     setHistory([currentState[currentFace]]);
                     setHistoryIndex(0);
                   }}
                   className="flex-1 h-14 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 className="w-5 h-5" />
                   Confirm Input
                 </button>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setReviewColors(null)}
                className="flex-1 h-14 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={confirmFace}
                className="flex-1 h-14 bg-green-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Face {currentFaceIndex + 1}/6
              </button>
            </div>
          )}
        </div>

        {/* Stability Progress Bar */}
        {!reviewColors && !isManualMode && (
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
              <span>Camera Lock</span>
              <span className={stabilityCounter >= 5 ? 'text-green-500 animate-pulse' : ''}>
                {stabilityCounter >= 15 ? 'READY' : stabilityCounter >= 5 ? 'STABILIZED' : 'HOLD STEADY...'}
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${stabilityCounter >= 5 ? 'bg-green-500' : 'bg-accent'}`}
                    style={{ width: `${(stabilityCounter / 15) * 100}%` }}
                />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
         <button 
           onClick={() => toggleManualMode(false)}
           className={`h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${!isManualMode ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-white/5 text-white/30 border border-white/5'}`}
         >
            <Camera className="w-4 h-4" />
            Scanner
         </button>
         <button 
           onClick={() => toggleManualMode(true)}
           className={`h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isManualMode ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-white/5 text-white/30 border border-white/5'}`}
         >
            <Edit3 className="w-4 h-4" />
            Manual
         </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

