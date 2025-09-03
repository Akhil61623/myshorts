import React, { useState, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import "./App.css";

function App() {
  const [query, setQuery] = useState("funny");
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [likes, setLikes] = useState({});
  const [darkMode, setDarkMode] = useState(true);
  const containerRef = useRef(null);

  const API_KEY = "AIzaSyBe-kkf2csWbMjWp0t8E35z7vRwn1nAq1Q";

  const searchYouTube = async (loadMore = false) => {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "5");
      url.searchParams.set("q", query + " shorts");
      url.searchParams.set("key", API_KEY);
      if (loadMore && pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.items)) {
        setVideos((prev) => (loadMore ? [...prev, ...data.items] : data.items));
        setPageToken(data.nextPageToken || null);
      }
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  const toggleLike = (videoId) => {
    setLikes((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      {/* Header */}
      <div className="header">
        <h2>🎬 Shorts</h2>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search Shorts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={() => searchYouTube(false)}>Search</button>
      </div>

      {/* Categories */}
      <div className="categories">
        {["Funny", "Music", "Gaming", "Tech", "Trending"].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setQuery(cat === "Trending" ? "trending shorts" : cat);
              searchYouTube(false);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shorts Feed */}
      <InfiniteScroll
        dataLength={videos.length}
        next={() => searchYouTube(true)}
        hasMore={!!pageToken}
        loader={<h4 style={{ textAlign: "center" }}>Loading...</h4>}
        scrollThreshold={0.9}
      >
        <div className="shorts-container" ref={containerRef}>
          {videos.map((video) => (
            <div className="short" key={video.id.videoId}>
              <iframe
                src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=0&mute=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.snippet.title}
              ></iframe>

              <div className="overlay">
                <h4>{video.snippet.title}</h4>
                <p>{video.snippet.channelTitle}</p>
              </div>

              <div className="actions">
                <button onClick={() => toggleLike(video.id.videoId)}>
                  {likes[video.id.videoId] ? "❤️" : "🤍"}
                </button>
                <button>💬</button>
                <button
                  onClick={() =>
                    navigator.share
                      ? navigator.share({
                          title: video.snippet.title,
                          url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                        })
                      : alert(
                          "Copy link: " +
                            `https://www.youtube.com/watch?v=${video.id.videoId}`
                        )
                  }
                >
                  🔗
                </button>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}

export default App;
