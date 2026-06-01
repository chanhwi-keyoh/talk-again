import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { EmergencyProvider } from "./components/EmergencyProvider";
import { EmotionProvider } from "./components/EmotionProvider";
import { I18nProvider } from "./components/I18nProvider";
import { PersonaProvider } from "./components/PersonaProvider";
import { VoicePrefProvider } from "./components/VoicePrefProvider";
import "./styles/globals.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("#root element missing from index.html");
}

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <VoicePrefProvider>
        <EmotionProvider>
          <PersonaProvider>
            <EmergencyProvider>
              <App />
            </EmergencyProvider>
          </PersonaProvider>
        </EmotionProvider>
      </VoicePrefProvider>
    </I18nProvider>
  </StrictMode>,
);
