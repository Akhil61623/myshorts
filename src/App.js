import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import "./App.css";

const API_KEY = process.env.REACT_APP_YT_API_KEY; // MUST set in Vercel/.env

function VideoSlide({ video, isActive }) {
  const vid = video?.id?.videoId;
  if (!vid) return null;

  // embed with enablejsapi so we can postMessage commands
  const src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&enablejsapi=1`;

  // We rely on YouTube iframe JS postMessage commands from parent (sent by swiper via mount/active logic)
  // For simplicity here we use autoplay param for active slide and assume browser allows mute-autoplay

  return (
    <div className="slide">
      <iframe
        title={video.snippet?.title || "Short"}
        src={src}
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div className="meta">
        <h4 className="title">{video.snippet?.title}</h4>
        <div className="channel">{video.snippet?.channelTitle}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("trending shorts");
  const [videos, setVideos] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchVideos = async (loadMore = false) => {
    setApiErr("");
    if (!API_KEY) {
      setApiErr("❌ Missing API key (REACT_APP_YT_API_KEY).");
      setVideos([]);
      return;
    }
    setLoading(true);
    try {
      const base = new URL("https://www.googleapis.com/youtube/v3/search");
      base.searchParams.set("part", "snippet");
      base.searchParams.set("type", "video");
      base.searchParams.set("maxResults", "8");
      base.searchParams.set("videoEmbeddable", "true"); // only embeddable
      base.searchParams.set("q", query);
      base.searchParams.set("key", API_KEY);
      if (loadMore && pageToken) base.searchParams.set("pageToken", pageToken);

      const res = await fetch(base);
      const data = await res.json();

      if (data?.error) {
        setApiErr(`${data.error.code}: ${data.error.message}`);
        if (!loadMore) setVideos([]);
      } else {
        const list = Array.isArray(data.items) ? data.items : [];
        setVideos((prev) => (loadMore ? [...prev, ...list] : list));
        setPageToken(data.nextPageToken || null);
        if (!loadMore) setActiveIndex(0);
      }
    } catch (e) {
      setApiErr(String(e));
      if (!loadMore) setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(false);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">MAHAMAYA</div>
        <div className="searchRow">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shorts..."
          />
          <button onClick={() => fetchVideos(false)}>Search</button>
        </div>
      </header>

      {apiErr && <div className="status err">{apiErr}</div>}
      {loading && <div className="status">Loading…</div>}
      {!loading && !apiErr && videos.length === 0 && (
        <div className="status">No videos found</div>
      )}

      {videos.length > 0 && (
        <Swiper
          direction="vertical"
          slidesPerView={1}
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }}
          modules={[Keyboard, Mousewheel]}
          className="shortsSwiper"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onReachEnd={() => {
            if (pageToken && !loading) fetchVideos(true);
          }}
        >
          {videos.map((v, i) => (
            <SwiperSlide key={v.id.videoId}>
              <VideoSlide video={v} isActive={i === activeIndex} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
