import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { PromotionProvider } from "./pages/context/PromotionContext";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Automatically rewrite any hardcoded localhost:5000 API requests to the production backend on Render
const BACKEND_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http://localhost:5000")) {
    config.url = config.url.replace("http://localhost:5000", BACKEND_URL);
  }
  return config;
});

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <PromotionProvider>
      <App />
    </PromotionProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

reportWebVitals();