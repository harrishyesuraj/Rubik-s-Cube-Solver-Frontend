import { CubeState, cubeStateTo3x3Matrix, validateCube, solveCube, isSolved, cubeStateToFacelets } from "../utils/cubeUtils";

let isSolving = false;

/**
 * This service is designed to connect to your custom AI Cloud (e.g., Google Colab).
 * It sends the 6-face color matrix as a 3x3 nested array for each face.
 */
export async function getSolutionFromRemoteAI(state: CubeState): Promise<string[]> {
  if (isSolving) {
    console.warn("[Solver] Solve already in progress. Waiting for previous request...");
    // Instead of returning [], which looks like a solved cube, we wait or throw.
    // For now, let's just throw a specific error that the UI can handle or ignore.
    throw new Error("ALREADY_SOLVING");
  }

  // 1. Check if already solved
  if (isSolved(state)) {
    console.log("[Solver] Cube is already solved. Returning empty sequence.");
    return [];
  }

  // 2. Strict validation
  const validationErrors = validateCube(state);
  if (validationErrors.length > 0) {
    throw new Error(`INVALID_CUBE: ${validationErrors[0]}`);
  }

  isSolving = true;
  const apiUrl = "/api/solve";

  try {
    const cubeString = cubeStateToFacelets(state);
    console.info(`[Solver] Cube String: ${cubeString}`);
    
    const facesMatrix = cubeStateTo3x3Matrix(state);
    const payload = { faces: facesMatrix };
    
    console.info("[Solver] Dispatching payload to AI Engine:", JSON.stringify(payload, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Remote Engine Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[Solver] Remote AI solution received:", data);
    
    if (data.error) {
      // If the error message indicates an unsolvable state, we should NOT attempt local solving
      // as it will likely hang the UI thread with the same logic.
      const isUnsolvable = data.error.toLowerCase().includes("invalid") || 
                           data.error.toLowerCase().includes("unsolvable") ||
                           data.message?.toLowerCase().includes("unsolvable");
      
      const err = new Error(data.error);
      (err as any).isUnsolvable = isUnsolvable;
      throw err;
    }

    const solution = data.solution || data.moves;
    if (solution === undefined) {
      throw new Error("Invalid response format from engine.");
    }
    return solution;
  } catch (error: any) {
    // If it's the "already solving" error, don't clear the flag and just propagate
    if (error.message === "ALREADY_SOLVING") throw error;

    // If remote explicitly said it's impossible, don't try local solver (it's the crash cause)
    if (error.isUnsolvable) {
      console.error("[Solver] Remote confirmed unsolvable state. Skipping local backup to prevent freeze.");
      throw error;
    }

    console.info("[Solver] Activating local Kociemba backup solver due to connection/transient error:", error.message);
    const startTime = Date.now();
    try {
      // Defer to allow UI to breathe
      await new Promise(resolve => setTimeout(resolve, 300));
      const solution = solveCube(state);
      console.info(`[Solver] Local solver succeeded in ${Date.now() - startTime}ms`);
      return solution;
    } catch (localError: any) {
      const isImpossible = localError.message.includes("Impossible") || localError.message.includes("Matrix Unstable");
      const finalMsg = isImpossible 
        ? localError.message 
        : `Detection Error: ${error.message}. Internal Logic Error: ${localError.message}`;
        
      console.error(`[Solver] Solve sequence failed. Time taken: ${Date.now() - startTime}ms. Reason: ${finalMsg}`);
      throw new Error(finalMsg);
    }
  } finally {
    isSolving = false;
  }
}
