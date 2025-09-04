import React, { useState, useEffect } from "react";

function App() {
  const [query, setQuery] = useState("trending shorts");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Environment variable (Vercel / .env file)
  const API_KEY = process.env.REACT_APP_YT_API_KEY;

  const searchYouTube = async () => {
    setApiError("");
    if (!API_KEY) {
      setApiError("❌ Missing API key (REACT_APP_YT_API_KEY).");
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&type=video&maxResults=10` +
        `&videoEmbeddable=any` + // "true" भी कर सकते हो
        `&q=${encodeURIComponent(query)}&key=${API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data?.error) {
        setApiError(`${data.error.code}: ${data.error.message}`);
        setVideos([]);
      } else {
        setVideos(Array.isArray(data.items) ? data.items : []);
      }
    } catch (e) {
      setApiError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // Load trending shorts on first render
  useEffect(() => {
    searchYouTube();
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
      <header
        style={{
          padding: "16px 20px",
          background: "#000",
          color: "#ff007f",
          fontWeight: 800,
          fontSize: 26,
        }}
      >
        MAHAMAYA
      </header>

      {/* Search Bar */}
      <div
        style={{
          padding: "18px",
          display: "flex",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Shorts..."
          style={{
            width: "70%",
            maxWidth: 500,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#0e0e0e",
            color: "#fff",
          }}
        />
        <button
          onClick={searchYouTube}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#ff007f",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {/* Status messages */}
      {loading && <p style={{ textAlign: "center", color: "#aaa" }}>Loading…</p>}
      {apiError && <p style={{ textAlign: "center", color: "#f66" }}>{apiError}</p>}
      {!loading && !apiError && videos.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>No videos found</p>
      )}

      {/* Video List */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          gap: 24,
          paddingBottom: 40,
        }}
      >
        {videos.map((v) => (
          <div key={v.id.videoId}>
            <iframe
              width="315"
              height="560"
              src={`https://www.youtube.com/embed/${v.id.videoId}?autoplay=1&mute=1`}
              title={v.snippet.title}
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 12 }}
            />
            <p style={{ maxWidth: 340, textAlign: "center", opacity: 0.9 }}>
              {v.snippet.title}
            </p>
            <small style={{ color: "gray" }}>{v.snippet.channelTitle}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
