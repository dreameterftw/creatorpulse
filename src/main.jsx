import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"
import { initAppCheck } from "./firebase/appCheck"
import "./index.css"

// Initialize App Check before any Firestore calls.
// Safe to call even if VITE_RECAPTCHA_SITE_KEY is not set (logs a warning and skips).
initAppCheck()

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
