import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppWrapper from "./App.tsx";
import { CartProvider } from "./components/cartContext.tsx";
import { ListingsProvider } from "./components/ListingsContext.tsx";
import { IssuesProvider } from "./components/IssuesContext.tsx";
import { BrowserRouter as Router } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <ListingsProvider>
        <IssuesProvider>
          <CartProvider>
            <AppWrapper />
          </CartProvider>
        </IssuesProvider>
      </ListingsProvider>
    </Router>
  </StrictMode>
);
