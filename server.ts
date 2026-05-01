import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for retrying requests (perfect for Render free tier sleep)
  const axiosInstance = axios.create({
    timeout: 60000, // 60s timeout for cold starts
  });

  const handleSolveRequest = async (url: string, data: any) => {
    try {
      console.log(`[CORTEX_SYNC] Solving Model for Matrix...`);
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error: any) {
      let errorMessage = "Unknown System Error";
      
      if (error.response) {
        errorMessage = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        console.error(`[Proxy Solver Error] (${error.response.status}):`, errorMessage);
      } else {
        errorMessage = error.message;
        console.error(`[Proxy Solver Error] Offline:`, errorMessage);
      }
      throw error;
    }
  };

  // Health Check / Wake-up
  app.get("/api/health", async (req, res) => {
    const apiUrl = "https://cube-solve-application.onrender.com/solve"; // Ping the solve endpoint or root
    try {
      // Basic ping
      const ping = await axiosInstance.get("https://cube-solve-application.onrender.com/", { timeout: 15000 });
      // If we got anything back, the server is alive (even if it's HTML)
      res.json({ status: "online", message: "Remote engine is awake." });
    } catch (error: any) {
      if (error.response) {
        return res.json({ status: "online", message: "Remote engine responded." });
      }
      res.status(503).json({ status: "offline", error: "Remote engine is unreachable." });
    }
  });

  // Solver Proxy
  app.post("/api/solve", async (req, res) => {
    // Force use of Render backend, bypassing any legacy ngrok env vars
    const apiUrl = "https://cube-solve-application.onrender.com/solve";
    
    console.log(`[Proxy] Routing solve request to production engine: ${apiUrl}`);

    try {
      const data = await handleSolveRequest(apiUrl, req.body);
      res.json(data);
    } catch (error: any) {
      console.error(`[Proxy Solver Error] Final failure for ${apiUrl}:`, error.message);
      
      // Detailed logging for 500s
      if (error.response?.status === 500) {
        console.error("[Proxy Solver Error] Remote server crashed. Response data:", 
          typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)
        );
      }

      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.error || error.message || "Remote Solver Engine unavailable" 
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
