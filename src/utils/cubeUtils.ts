import Cube from 'cubejs';

// Initialize the solver
Cube.initSolver();

export type FaceColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

export interface CubeState {
  U: FaceColor[];
  R: FaceColor[];
  F: FaceColor[];
  D: FaceColor[];
  L: FaceColor[];
  B: FaceColor[];
}

export const INITIAL_STATE: CubeState = {
  U: Array(9).fill('white'),
  R: Array(9).fill('red'),
  F: Array(9).fill('green'),
  D: Array(9).fill('yellow'),
  L: Array(9).fill('orange'),
  B: Array(9).fill('blue'),
};

// Mapping constants removed in favor of dynamic center-based mapping to ensure physical consistency.

export function cubeStateTo3x3Matrix(state: CubeState) {
  const result: Record<string, string[][]> = {};
  const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  const COLOR_TO_BACKEND_INITIAL: Record<FaceColor, string> = {
    white: 'W',
    yellow: 'Y',
    red: 'R',
    orange: 'O',
    blue: 'B',
    green: 'G',
  };

  faces.forEach(face => {
    const flatColors = state[face];
    const matrix: string[][] = [];
    for (let i = 0; i < 3; i++) {
      const row = flatColors.slice(i * 3, i * 3 + 3).map(c => COLOR_TO_BACKEND_INITIAL[c] || 'W');
      matrix.push(row);
    }
    result[face] = matrix;
  });

  return result;
}

const COLOR_MAP: Record<FaceColor, string> = {
  white: 'U',
  red: 'R',
  green: 'F',
  yellow: 'D',
  orange: 'L',
  blue: 'B',
};

export function cubeStateToFacelets(state: CubeState): string {
  const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  // Create a mapping from color to face symbol based on the center piece of each face
  // In Kociemba notation, the center sticker of a face defines that face.
  const colorToFaceSymbol: Record<string, string> = {};
  faces.forEach(face => {
    colorToFaceSymbol[state[face][4]] = face;
  });

  // Ensure every color present on the cube has a mapping, otherwise fallback to something safe
  // though validateCube should catch cases where centers are not unique
  return faces.map(f => state[f].map(c => colorToFaceSymbol[c] || 'U').join('')).join('');
}

export function validateCube(state: CubeState): string[] {
  const errors: string[] = [];
  const colorCounts: Record<FaceColor, number> = {
    white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0,
  };

  const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  // Count colors
  faces.forEach(face => {
    state[face].forEach(color => {
      colorCounts[color]++;
    });
  });

  // Verify counts
  Object.entries(colorCounts).forEach(([color, count]) => {
    if (count !== 9) {
      errors.push(`${color.toUpperCase()} distribution error: ${count}/9 stickers.`);
    }
  });

  // Check centers are unique
  const centerColors = faces.map(f => state[f][4]);
  const uniqueCenters = new Set(centerColors);
  if (uniqueCenters.size !== 6) {
    errors.push('INVALID CORE: Centers must have unique colors. Check standard orientation.');
  }

  return errors;
}

export const MOVE_NAMES: Record<string, string> = {
  'U': 'TOP face Clockwise',
  'U\'': 'TOP face Counter-Clockwise',
  'U2': 'TOP face 180 degrees',
  'D': 'BOTTOM face Clockwise',
  'D\'': 'BOTTOM face Counter-Clockwise',
  'D2': 'BOTTOM face 180 degrees',
  'L': 'LEFT face Clockwise',
  'L\'': 'LEFT face Counter-Clockwise',
  'L2': 'LEFT face 180 degrees',
  'R': 'RIGHT face Clockwise',
  'R\'': 'RIGHT face Counter-Clockwise',
  'R2': 'RIGHT face 180 degrees',
  'F': 'FRONT face Clockwise',
  'F\'': 'FRONT face Counter-Clockwise',
  'F2': 'FRONT face 180 degrees',
  'B': 'BACK face Clockwise',
  'B\'': 'BACK face Counter-Clockwise',
  'B2': 'BACK face 180 degrees',
};

export function getMoveDescription(move: string): string {
  return MOVE_NAMES[move] || move;
}

export function isSolved(state: CubeState): boolean {
  const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  
  // 1. Check if all stickers on each face match the face's center sticker
  for (const face of faces) {
    const faceColors = state[face];
    const centerColor = faceColors[4];
    if (faceColors.some(color => color !== centerColor)) {
      return false;
    }
  }

  // 2. Verify color distribution (each color must have exactly 9 stickers)
  const colorCounts: Record<string, number> = {
    white: 0, yellow: 0, red: 0, orange: 0, blue: 0, green: 0,
  };
  faces.forEach(f => state[f].forEach(c => colorCounts[c]++));
  
  // Also check if any counts are weird (should all be 9)
  const isUniformCounts = Object.values(colorCounts).every(count => count === 9);
  if (!isUniformCounts) return false;

  // 3. Verify standard color scheme relationships (simplified)
  // E.g. Opposing centers should not be adjacent or same
  const centerColors = faces.map(f => state[f][4]);
  const centerSet = new Set(centerColors);
  if (centerSet.size !== 6) return false;

  return true;
}

export function solveCube(state: CubeState): string[] {
  if (isSolved(state)) {
    return [];
  }

  const validationErrors = validateCube(state);
  if (validationErrors.length > 0) {
    throw new Error(`Matrix Unstable: ${validationErrors[0]}`);
  }

  const facelets = cubeStateToFacelets(state);
  try {
    const cube = Cube.fromString(facelets);
    // Use a depth limit (22 is the standard God's number + some buffer) 
    // to prevent infinite searches on some edge-case impossible states
    const solution = cube.solve(22);
    return solution.split(' ').filter(m => m.length > 0);
  } catch (error) {
    console.error("[CubeUtils] Solver failed or reached depth limit:", error);
    throw new Error('Impossible Physical State: The current color arrangement cannot be solved. This usually happens if stickers were moved or if a face was scanned/entered incorrectly (e.g., mismatched corners).');
  }
}

// Move mapping for 3D animation
export const MOVE_AXIS: Record<string, { axis: 'x' | 'y' | 'z'; direction: number; layer: number }> = {
  U: { axis: 'y', direction: -1, layer: 1 },
  "U'": { axis: 'y', direction: 1, layer: 1 },
  U2: { axis: 'y', direction: -1, layer: 1 },
  D: { axis: 'y', direction: 1, layer: -1 },
  "D'": { axis: 'y', direction: -1, layer: -1 },
  D2: { axis: 'y', direction: 1, layer: -1 },
  L: { axis: 'x', direction: 1, layer: -1 },
  "L'": { axis: 'x', direction: -1, layer: -1 },
  L2: { axis: 'x', direction: 1, layer: -1 },
  R: { axis: 'x', direction: -1, layer: 1 },
  "R'": { axis: 'x', direction: 1, layer: 1 },
  R2: { axis: 'x', direction: -1, layer: 1 },
  F: { axis: 'z', direction: -1, layer: 1 },
  "F'": { axis: 'z', direction: 1, layer: 1 },
  F2: { axis: 'z', direction: -1, layer: 1 },
  B: { axis: 'z', direction: 1, layer: -1 },
  "B'": { axis: 'z', direction: -1, layer: -1 },
  B2: { axis: 'z', direction: 1, layer: -1 },
};

export function applyMove(state: CubeState, move: string): CubeState {
  if (!move) return state; // Safety check
  const facelets = cubeStateToFacelets(state);
  const cube = Cube.fromString(facelets);
  cube.move(move);
  const newFacelets = cube.asString();
  
  const newState: any = {};
  const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (let i = 0; i < 6; i++) {
    const start = i * 9;
    const colors = newFacelets.slice(start, start + 9).split('').map(c => {
      if (c === 'U') return 'white';
      if (c === 'R') return 'red';
      if (c === 'F') return 'green';
      if (c === 'D') return 'yellow';
      if (c === 'L') return 'orange';
      if (c === 'B') return 'blue';
      return 'white';
    });
    newState[faces[i]] = colors;
  }
  return newState as CubeState;
}
