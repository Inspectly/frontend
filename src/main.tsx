import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppWrapper from "./App.tsx";
import { ListingsProvider } from "./components/ListingsContext.tsx";
import { IssuesProvider } from "./components/IssuesContext.tsx";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <ListingsProvider>
          <IssuesProvider>
            <AppWrapper />
          </IssuesProvider>
        </ListingsProvider>
      </Router>
    </Provider>
  </StrictMode>
);
