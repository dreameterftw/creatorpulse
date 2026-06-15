import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"
import { CreatorProvider } from "./context/CreatorContext"
import { initAppCheck } from "./firebase/appCheck"
import "./index.css"

initAppCheck()

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CreatorProvider>
        <App />
      </CreatorProvider>
    </AuthProvider>
  </React.StrictMode>
)
