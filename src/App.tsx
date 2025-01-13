import React, { useState, useEffect } from "react";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Disable the preloader after 3 seconds
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <Preloader />}
      <div
        className={`transition-opacity duration-500 ${
          !loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <Header />
        <Home />
      </div>
    </>
  );
}

export default App;
