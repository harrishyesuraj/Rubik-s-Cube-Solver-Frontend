<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/046f4e40-56d4-47de-9d2e-6a69a070e6f7" />

***
```markdown
# 📌 Rubik’s Cube Solver - Frontend

A React-based frontend for a Rubik’s Cube Solver application featuring real-time scanning, manual input, and immersive 3D visualization using Three.js.

## 🚀 Tech Stack

*   **React.js** - UI framework
*   **HTML5 & CSS3** - Markup and styling
*   **Three.js** - 3D rendering and animation
*   **Axios** - HTTP client for API calls
*   **Vercel** - Hosting and deployment

## ✨ Features

*   **📷 Live Scanning:** Real-time, camera-based cube scanning.
*   **🔄 Camera Controls:** Switch between cameras and reset views easily.
*   **✋ Manual Mode:** Input cube colors manually if scanning is not preferred.
*   **🧩 State Rendering:** Accurate visual representation of the cube's current state.
*   **🎮 3D Visualization:** Interactive 3D Rubik’s Cube powered by Three.js.
*   **🔁 Step-by-Step Animation:** Watch the solve sequence animate move-by-move.
*   **🧭 Interactive Controls:** Rotate, zoom, and change the orientation of the 3D cube.
*   **📊 Backend Integration:** Seamless communication with the solving logic API.
*   **📱 Responsive Design:** Optimized UI for both desktop and mobile devices.

## 🧠 Workflow

1.  **Input State:** Scan the cube using your device's camera OR input the colors manually.
2.  **Process Data:** Send the current cube state to the backend API.
3.  **Receive Solution:** Receive the precise solving steps via a JSON response.
4.  **Visualize:** Render the calculated solution in the 3D cube view.
5.  **Animate:** Play back the solving sequence step-by-step.

## 🌐 Deployment

*   **Frontend Hosting:** [Vercel](https://vercel.com/)
*   **Backend API:** FastAPI hosted on [Render](https://render.com/)

##⚙️ Setup

To run this project locally, follow these steps:
Clone the repository and navigate to the project directory.

Install the dependencies:
Bash
npm install

Start the development server:
Bash
npm start

##🔗 API Integration

The frontend communicates with a FastAPI backend. Below is an example of a successful response when requesting a solution:

Response Format:

JSON
{
  "status": "success",
  "solution": ["U", "R", "F", "U'", "L2"]
}

<img width="1364" height="767" alt="image" src="https://github.com/user-attachments/assets/354d5a3a-b9ff-4b69-8b41-dd42213778f4" />


Live camera scanning interface.

Interactive 3D step-by-step solving animation.
