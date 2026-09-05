import React from "react";

import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App";

import reportWebVitals from "./reportWebVitals";

import "@fortawesome/fontawesome-free/css/all.min.css";

import { PromotionProvider } from "./pages/context/PromotionContext";

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

reportWebVitals();