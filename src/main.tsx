
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { AuthProvider } from "./contexts/AuthContext";

import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
