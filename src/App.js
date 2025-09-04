import React, { useState, useRef, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import "./App.css";

function VideoCard({ video }) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // जो वीडियो viewport में 60% से ज्यादा आए, वही play; बाहर जाए तो pause
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const iframe = iframeRef.current;
          if (!iframe) return;
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            // Play + mute (mobile autoplay rule)
            iframe.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "mute", args: [] }),
              "*"
            );
            iframe.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "playVideo", args: [] }),
              "*"
            );
          } else {
            iframe.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
              "*"
            );
          }
        });
      },
      { threshold: [0, 0.6, 1] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const vid = video.id.videoId;
  const src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&enablejsapi=1`;

  return (
    <div className="short" ref={containerRef}>
      <iframe
        ref={iframeRef}
        src={src}
        title={video.snippet.title}
        frameBorder="0"
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="overlay">
        <h4>{video.snippet.title}</h4>
        <p>{video.snippet.channelTitle}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("trending shorts");
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState(null);

  const API_KEY = process.env.REACT_APP_YT_KEY || "YOUR_FALLBACK_KEY";

  const fetchVideos = async (loadMore = false) => {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "8");
      url.searchParams.set("q", query);
      url.searchParams.set("key", API_KEY);
      if (loadMore && pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setVideos((prev) => (loadMore ? [...prev, ...data.items] : data.items));
        setPageToken(data.nextPageToken || null);
      } else {
        setVideos([]);
        setPageToken(null);
      }
    } catch (e) {
      console.error(e);
      setVideos([]);
    }
  };

  // पेज खुलते ही ऑटो-फेच + autoplay शुरू
  useEffect(() => {
    fetchVideos(false);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="app dark">
      {/* Sticky Header */}
      <header className="topbar">
        <div className="brand">महामाया स्टेशनरी</div>
        <div className="searchRow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shorts…"
          />
          <button onClick={() => fetchVideos(false)}>Search</button>
        </div>
      </header>

      {/* Shorts Feed */}
      <InfiniteScroll
        dataLength={videos.length}
        next={() => fetchVideos(true)}
        hasMore={!!pageToken}
        loader={<div className="loader">Loading…</div>}
        scrollThreshold={0.9}
      >
        <div className="shorts-container">
          {videos.map((v) => (
            <VideoCard key={v.id.videoId} video={v} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}
