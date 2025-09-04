import React, { useState } from "react";

function App() {
  const [query, setQuery] = useState("trending shorts");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchYouTube = async () => {
    setLoading(true);
    const API_KEY = process.env.REACT_APP_YT_KEY; // Vercel में env variable
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&videoEmbeddable=true&q=${query}&key=${API_KEY}`
      );
      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("YouTube API error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#111", minHeight: "100vh", color: "white" }}>
      {/* Header */}
      <header
        style={{
          padding: "15px",
          backgroundColor: "#000",
          color: "#ff007f",
          fontWeight: "bold",
          fontSize: "24px",
          textAlign: "left",
        }}
      >
        MAHAMAYA
      </header>

      {/* Search bar */}
      <div style={{ padding: "20px", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Search Shorts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "10px",
            width: "70%",
            maxWidth: "400px",
            borderRadius: "6px",
            border: "none",
          }}
        />
        <button
          onClick={searchYouTube}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#ff007f",
            border: "none",
            borderRadius: "6px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {/* Videos */}
      <div style={{ textAlign: "center", paddingBottom: "40px" }}>
        {loading && <p>Loading...</p>}

        {videos.length === 0 && !loading && (
          <p style={{ color: "gray" }}>No videos found</p>
        )}

        {videos.map((video) => (
          <div key={video.id.videoId} style={{ marginBottom: "30px" }}>
            <iframe
              width="315"
              height="560"
              src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&mute=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={video.snippet.title}
              style={{ borderRadius: "10px" }}
            />
            <p style={{ marginTop: "10px", fontSize: "14px" }}>
              {video.snippet.title}
            </p>
            <small style={{ color: "gray" }}>
              {video.snippet.channelTitle}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
