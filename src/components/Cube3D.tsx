import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CubeState, MOVE_AXIS } from '../utils/cubeUtils';

const COLORS: Record<string, string> = {
  white: '#FFFFFF',
  yellow: '#FACC15', // Vibrant Yellow
  red: '#EF4444',    // Vibrant Red
  orange: '#F97316', // Vibrant Orange
  blue: '#3B82F6',   // Vibrant Blue
  green: '#22C55E',  // Vibrant Green
  black: '#18181B',  // Slate 900
};

const PIECE_SIZE = 0.96;
const PIECE_RADIUS = 0.12;

interface PieceProps {
  position: [number, number, number];
  colors: {
    top: string;
    bottom: string;
    front: string;
    back: string;
    left: string;
    right: string;
  };
  dimmed?: boolean;
}

const Piece: React.FC<PieceProps> = ({ position, colors, dimmed }) => {
  const getFaceColor = (color: string) => {
    if (dimmed) return "#151515"; // Very dark gray instead of pure black for visibility
    return "#ffffff"; // Pure white for active rotating pieces
  };

  return (
    <group position={position}>
      <RoundedBox args={[PIECE_SIZE, PIECE_SIZE, PIECE_SIZE]} radius={PIECE_RADIUS} smoothness={6}>
        <meshStandardMaterial attach="material-0" color={getFaceColor(colors.right)} roughness={0.05} metalness={0.1} />
        <meshStandardMaterial attach="material-1" color={getFaceColor(colors.left)} roughness={0.05} metalness={0.1} />
        <meshStandardMaterial attach="material-2" color={getFaceColor(colors.top)} roughness={0.05} metalness={0.1} />
        <meshStandardMaterial attach="material-3" color={getFaceColor(colors.bottom)} roughness={0.05} metalness={0.1} />
        <meshStandardMaterial attach="material-4" color={getFaceColor(colors.front)} roughness={0.05} metalness={0.1} />
        <meshStandardMaterial attach="material-5" color={getFaceColor(colors.back)} roughness={0.05} metalness={0.1} />
      </RoundedBox>
      <mesh>
        <boxGeometry args={[PIECE_SIZE - 0.02, PIECE_SIZE - 0.02, PIECE_SIZE - 0.02]} />
        <meshStandardMaterial color={dimmed ? "#0a0a0a" : "#111111"} roughness={1} />
      </mesh>
    </group>
  );
};

interface Cube3DProps {
  state: CubeState;
  currentMove?: string;
  showArrow?: boolean;
  highlightMove?: boolean;
  onMoveComplete?: () => void;
  instant?: boolean;
  fov?: number;
}

interface CubeSceneProps {
  state: CubeState;
  currentMove?: string;
  showArrow?: boolean;
  highlightMove?: boolean;
  onMoveComplete?: () => void;
  instant?: boolean;
  fov?: number;
}

const CubeScene: React.FC<CubeSceneProps> = ({ state, currentMove, showArrow = true, highlightMove = false, onMoveComplete, instant = false, fov = 55 }) => {
  const pivotRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const [prevMove, setPrevMove] = useState<string | null>(null);
  const rotationProgress = useRef(0);

  // Generate pieces from state
  const pieces = useMemo(() => {
    const p: PieceProps[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;

          p.push({
            position: [x, y, z],
            colors: {
              top: y === 1 ? state.U[(z + 1) * 3 + (x + 1)] : 'black',
              bottom: y === -1 ? state.D[(1 - z) * 3 + (x + 1)] : 'black',
              front: z === 1 ? state.F[(1 - y) * 3 + (x + 1)] : 'black',
              back: z === -1 ? state.B[(1 - y) * 3 + (1 - x)] : 'black',
              left: x === -1 ? state.L[(1 - y) * 3 + (1 - z)] : 'black',
              right: x === 1 ? state.R[(1 - y) * 3 + (z + 1)] : 'black',
            },
          });
        }
      }
    }
    return p;
  }, [state]);

  const moveInfo = currentMove ? MOVE_AXIS[currentMove] : null;

  useEffect(() => {
    if (currentMove && currentMove !== prevMove) {
      if (instant) {
        setPrevMove(currentMove);
        onMoveComplete?.();
        return;
      }
      setAnimating(true);
      setPrevMove(currentMove);
      rotationProgress.current = 0;
      if (pivotRef.current) {
        pivotRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [currentMove, prevMove, instant, onMoveComplete]);

  useFrame((_, delta) => {
    if (animating && moveInfo && pivotRef.current) {
      // Very fast rotation speed
      const speed = currentMove?.includes('2') ? 8 : 10;
      const target = currentMove?.includes('2') ? Math.PI : Math.PI / 2;
      
      rotationProgress.current += speed * delta;
      
      const limitedProgress = Math.min(rotationProgress.current, target);
      
      const t = Math.min(limitedProgress / target, 1);
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const currentRotation = easedT * target;

      const axisVec = new THREE.Vector3(
        moveInfo.axis === 'x' ? 1 : 0,
        moveInfo.axis === 'y' ? 1 : 0,
        moveInfo.axis === 'z' ? 1 : 0
      );

      pivotRef.current.rotation.set(0, 0, 0);
      pivotRef.current.rotateOnWorldAxis(axisVec, currentRotation * moveInfo.direction);

      if (rotationProgress.current >= target) {
        setAnimating(false);
        setTimeout(() => onMoveComplete?.(), 50);
      }
    }
  });

  const axisIndex = moveInfo?.axis === 'x' ? 0 : moveInfo?.axis === 'y' ? 1 : 2;
  const isMoving = (pos: [number, number, number]) => {
    if (!moveInfo) return false;
    return Math.round(pos[axisIndex]) === moveInfo.layer;
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4.5, 6.5]} fov={fov} />
      <OrbitControls 
        enablePan={false} 
        enableRotate={true}
        enableZoom={true}
        minDistance={5} 
        maxDistance={15} 
        autoRotate={false}
      />
      
      <ambientLight intensity={1.2} />
      <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[10, 5, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, 5, -10]} intensity={0.5} />
      
      {/* Static Group */}
      <group>
        {pieces.filter(p => !animating || !isMoving(p.position)).map((piece, i) => (
          <Piece key={`static-${i}`} {...piece} dimmed={highlightMove && (animating || currentMove !== undefined) && !isMoving(piece.position)} />
        ))}
      </group>

      {/* Rotating Pivot Group */}
      <group ref={pivotRef}>
        {animating && pieces.filter(p => isMoving(p.position)).map((piece, i) => (
          <Piece key={`moving-${i}`} {...piece} />
        ))}
      </group>
    </>
  );
};

export const Cube3D: React.FC<Cube3DProps> = React.memo((props) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas shadows>
        <CubeScene {...props} />
      </Canvas>
    </div>
  );
});
