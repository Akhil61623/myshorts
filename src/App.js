import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import "./App.css";

const API_KEY = process.env.REACT_APP_YT_API_KEY; // Vercel/.env में रखें

// --- Single Video Slide: active होने पर play, नहीं तो pause ---
function VideoSlide({ video, isActive }) {
  const iframeRef = useRef(null);
  const vid = video?.id?.videoId;

  // YouTube Iframe Player API commands via postMessage
  const send = (func) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  };

  useEffect(() => {
    // active slide → mute + play; inactive → pause
    if (isActive) {
      // थोड़ी देर बाद play, ताकि iframe ready हो जाए
      const t = setTimeout(() => {
        send("mute");
        send("playVideo");
      }, 400);
      return () => clearTimeout(t);
    } else {
      send("pauseVideo");
    }
    // eslint-disable-next-line
  }, [isActive]);

  if (!vid) return null;

  // Shorts layout (vertical), autoplay+mute+playsinline+enablejsapi
  const src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&playsinline=1&controls=0&rel=0&enablejsapi=1`;

  return (
    <div className="slide">
      <iframe
        ref={iframeRef}
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
      setApiErr("Missing API key: REACT_APP_YT_API_KEY");
      return;
    }
    setLoading(true);
    try {
      const base = new URL("https://www.googleapis.com/youtube/v3/search");
      base.searchParams.set("part", "snippet");
      base.searchParams.set("type", "video");
      base.searchParams.set("maxResults", "8");
      // embeddable filter रखें; अगर results कम हों तो 'any' कर सकते हैं
      base.searchParams.set("videoEmbeddable", "true");
      base.searchParams.set("q", query);
      base.searchParams.set("key", API_KEY);
      if (loadMore && pageToken) base.searchParams.set("pageToken", pageToken);

      const res = await fetch(base);
      const data = await res.json();

      if (data?.error) {
        setApiErr(`${data.error.code}: ${data.error.message}`);
        if (!loadMore) setVideos([]);
        setPageToken(null);
      } else {
        const list = Array.isArray(data.items) ? data.items : [];
        setVideos((prev) => (loadMore ? [...prev, ...list] : list));
        setPageToken(data.nextPageToken || null);
        if (!loadMore) setActiveIndex(0); // नई search पर पहले slide से
      }
    } catch (e) {
      setApiErr(String(e));
      if (!loadMore) setVideos([]);
      setPageToken(null);
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
      {/* Header */}
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

      {/* Status */}
      {apiErr && <div className="status err">{apiErr}</div>}
      {loading && <div className="status">Loading…</div>}
      {!loading && !apiErr && videos.length === 0 && (
        <div className="status">No videos found</div>
      )}

      {/* Vertical Swiper (full screen) */}
      {videos.length > 0 && (
        <Swiper
          direction="vertical"
          slidesPerView={1}
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }}
          modules={[Keyboard, Mousewheel]}
          className="shortsSwiper"
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          // नीचे scroll करने पर और लाएं (edge पर पहुँचें तो)
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
