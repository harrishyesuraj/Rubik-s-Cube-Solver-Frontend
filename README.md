# 📌 Rubik’s Cube Solver - Frontend

A modern React-based frontend for a Rubik’s Cube Solver application. This project enables real-time cube scanning, manual input, and an interactive 3D visualization using Three.js.

---

## 🚀 Tech Stack

* **React.js**
* **HTML5**
* **CSS3**
* **Three.js**
* **Axios** (API calls)
* **Vercel** (Deployment)

---

## ✨ Features

* 📷 Live camera-based cube scanning
* 🔄 Camera switching & reset controls
* ✋ Manual cube color input mode
* 🧩 Visual cube state rendering
* 🎮 3D Rubik’s Cube visualization (Three.js)
* 🔁 Step-by-step solving animation
* 🧭 Interactive controls (rotate, zoom, orientation)
* 📊 Backend integration for solving logic
* 📱 Fully responsive UI

---

## 🧠 Workflow

1. Scan the cube using the camera **OR** input colors manually
2. Send the cube state to the backend API
3. Receive solving steps (JSON response)
4. Render the solution in the 3D cube view
5. Animate the solving sequence step-by-step

---

## 🌐 Deployment

* **Frontend**: Vercel
* **Backend API**: FastAPI (hosted on Render)

---

## 🤖 AI Assistance

This project was developed with the assistance of AI tools for:

* Code structuring and optimization
* Debugging and problem-solving
* UI/UX improvement suggestions
* Documentation support

---

## ⚙️ Setup Instructions

```bash
# Install dependencies
npm install

# Start development server
npm start
```

---

## 🔗 API Integration

The backend API returns a response in the following format:

```json
{
  "status": "success",
  "solution": ["U", "R", "F", "U'", "L2"]
}
```

* Each move represents a standard Rubik’s Cube notation
* The frontend parses and animates these moves

---

## 📸 Screenshots

<img width="1365" height="767" alt="image" src="https://github.com/user-attachments/assets/b7c065f6-7fc1-418d-9b07-866487899582" />

---

## 📌 Future Improvements

* 🔍 Improve cube detection accuracy
* ⚡ Optimize 3D rendering performance
* 🎯 Add solving speed control
* 🌙 Dark mode UI
