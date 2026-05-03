📌 Rubik’s Cube Solver - Frontend

A React-based frontend for a Rubik’s Cube Solver application with real-time scanning, manual input, and 3D visualization using Three.js.

🚀 Tech Stack
React.js
HTML5
CSS3
Three.js
Axios (API calls)
Vercel (Deployment)
✨ Features
📷 Live camera-based cube scanning
🔄 Camera switching & reset controls
✋ Manual cube color input mode
🧩 Visual cube state rendering
🎮 3D Rubik’s Cube visualization (Three.js)
🔁 Step-by-step solving animation
🧭 Interactive controls (rotate, zoom, orientation)
📊 Backend integration for solving logic
📱 Responsive UI design
🧠 Workflow
Scan cube using camera OR input manually
Send cube state to backend API
Receive solving steps (JSON response)
Render solution in 3D cube view
Animate solving sequence step-by-step
🌐 Deployment
Hosted on: Vercel
Backend API: FastAPI (Render)
📂 Project Structure
src/
 ├── components/
 ├── pages/
 ├── scanner/
 ├── cube3d/
 ├── services/api.js
 ├── App.js

⚙️ Setup
npm install
npm start

🔗 API Integration

Backend returns:

{
  "status": "success",
  "solution": ["U", "R", "F", "U'", "L2"]
}

📸 Screenshots

(Add your UI images here)
