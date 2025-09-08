import React from "react";
import ShortsPlayer from "./components/ShortsPlayer";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="topbar">
        <div className="brand">MAHAMAYA</div>
      </header>

      {/* Main */}
      <main>
        <div className="status">Scroll and tap to play shorts 🎬</div>

        <section style={{ display: "flex", justifyContent: "center", padding: "8px" }}>
          <div style={{ width: "360px" }}>
            <ShortsPlayer />
          </div>
        </section>
      </main>
    </div>
  );
}
