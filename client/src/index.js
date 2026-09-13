import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { PromotionProvider } from "./pages/context/PromotionContext";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Automatically route all API calls to your production Render backend, or fallback to localhost during local dev
const BACKEND_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

// 1. Rewrite Axios calls
axios.defaults.baseURL = BACKEND_URL;
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("http://localhost:5000")) {
    config.url = config.url.replace("http://localhost:5000", BACKEND_URL);
  }
  return config;
});

// 2. Rewrite native window.fetch calls (used in roleauth.jsx and login pages)
const originalFetch = window.fetch;
window.fetch = function (resource, init) {
  if (typeof resource === "string" && resource.startsWith("http://localhost:5000")) {
    resource = resource.replace("http://localhost:5000", BACKEND_URL);
  } else if (resource instanceof Request && resource.url.startsWith("http://localhost:5000")) {
    resource = new Request(resource.url.replace("http://localhost:5000", BACKEND_URL), resource);
  }
  return originalFetch.call(this, resource, init);
};

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