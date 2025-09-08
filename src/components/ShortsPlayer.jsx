// src/components/ShortsPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
// Optional: uncomment if you set up a socket backend
// import { io } from "socket.io-client";

const DEMO = [
  { id: "x1", title: "Funny Cat", url: "https://www.youtube.com/embed/PhVQWwjZn54", thumbnail: "https://i.ytimg.com/vi/PhVQWwjZn54/hqdefault.jpg", channel: "CatChannel" },
  { id: "x2", title: "Dance Move", url: "https://www.youtube.com/embed/WXeFtVV78dg", thumbnail: "https://i.ytimg.com/vi/WXeFtVV78dg/hqdefault.jpg", channel: "DanceZone" },
  { id: "x3", title: "Comedy Clip", url: "https://www.youtube.com/embed/JvDf7htxvrA", thumbnail: "https://i.ytimg.com/vi/JvDf7htxvrA/hqdefault.jpg", channel: "Laughs" },
];

// If you have a backend socket, set SOCKET_URL to it, otherwise leave null to use demo/polling.
const SOCKET_URL = null; // e.g. "https://your-backend.com" or null

export default function ShortsPlayer({ initial = DEMO }) {
  const [queue, setQueue] = useState(initial.slice()); // array of {id,title,url,thumbnail,channel}
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Optional: connect socket.io if you have a backend that emits 'shorts:batch'
    if (SOCKET_URL) {
      // const socket = io(SOCKET_URL, { transports: ["websocket"] });
      // socket.on("connect", () => console.log("socket connected"));
      // socket.on("shorts:batch", (data) => {
      //   if (!data || !data.items) return;
      //   appendToQueue(data.items);
      // });
      // return () => socket.disconnect();
    } else {
      // No socket: start polling server every 30s for new items (optional)
      const pollInterval = setInterval(() => {
        // tryFetchMore(); // uncomment and implement if you have a REST endpoint
      }, 30000);
      return () => clearInterval(pollInterval);
    }

    return () => { isMounted.current = false; };
  }, []);

  // Helper: append new items (dedup by id)
  function appendToQueue(items = []) {
    setQueue((prev) => {
      const map = new Map(prev.map(i => [i.id, i]));
      items.forEach(it => {
        if (!map.has(it.id)) map.set(it.id, it);
      });
      return Array.from(map.values());
    });
    // prefetch thumbnails for first 3 new items
    items.slice(0, 3).forEach(i => {
      const img = new Image(); img.src = i.thumbnail || thumbFromUrl(i.url);
    });
  }

  // Utility to create thumbnail url from youtube embed if thumbnail missing
  function thumbFromUrl(url) {
    try {
      const m = url.match(/\/embed\/([A-Za-z0-9_-]+)/);
      if (m && m[1]) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
    } catch (e) {}
    return "";
  }

  function onNext() {
    setCurrentIndex((i) => {
      const next = Math.min(i + 1, queue.length - 1);
      return next;
    });
  }

  // If we near the end of queue, auto fetch/generate more (demo)
  useEffect(() => {
    const remaining = queue.length - 1 - currentIndex;
    if (remaining < 3) {
      // try to get more from server or generate demo ones
      fetchMoreDemo();
    }
  }, [currentIndex, queue.length]);

  // Demo: append generated items
  function fetchMoreDemo() {
    // create 5 mock items with unique ids
    const base = Date.now();
    const items = Array.from({ length: 5 }).map((_, idx) => {
      const n = base + idx;
      // rotate through some sample youtube ids to keep playable
      const samples = ["PhVQWwjZn54","WXeFtVV78dg","JvDf7htxvrA","EU3EMbE4iro","DEVbob414SM"];
      const vid = samples[n % samples.length];
      return {
        id: "gen_" + n,
        title: `Auto Short ${n}`,
        url: `https://www.youtube.com/embed/${vid}`,
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        channel: "AutoGen",
      };
    });
    appendToQueue(items);
  }

  // Optional: If you have a REST endpoint to GET more
  async function tryFetchMore() {
    try {
      // replace with your real endpoint
      const res = await fetch("/api/shorts/more");
      if (!res.ok) return;
      const data = await res.json();
      if (data.items) appendToQueue(data.items);
    } catch (e) {
      // ignore
    }
  }

  // Manual load more (button)
  function handleLoadMore() {
    // if you have server: tryFetchMore(); else generate
    tryFetchMore();
    fetchMoreDemo();
  }

  const current = queue[currentIndex];

  if (!current) {
    return <div style={{ textAlign: "center", padding: 24 }}>कोई शॉर्ट उपलब्ध नहीं।</div>;
  }

  // Ensure iframe auto-play on click — mobile restrictions apply
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 12 }}>
        {/* We load iframe for current only (lazy) */}
        <iframe
          ref={iframeRef}
          key={current.id}
          title={current.title}
          src={current.url + "?autoplay=1&rel=0"}
          style={{
            width: "100%",
            maxWidth: 420,
            aspectRatio: "9/16",
            border: 0,
            borderRadius: 12,
            background: "#000",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            /* nothing special */
          }}
        ></iframe>
      </div>

      <h4 style={{ margin: "8px 0 4px 0" }}>{current.title}</h4>
      <div style={{ fontSize: 12, color: "#aaa" }}>{current.channel}</div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 10 }}>
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          style={{ padding: "8px 12px" }}
        >
          Prev
        </button>

        <button onClick={onNext} style={{ padding: "8px 16px" }}>
          Next ▶
        </button>

        <button onClick={handleLoadMore} style={{ padding: "8px 12px" }}>
          Load more
        </button>
      </div>

      {/* Up next thumbnails */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
        {queue.slice(currentIndex + 1, currentIndex + 6).map((q) => (
          <div key={q.id} style={{ textAlign: "center", width: 80 }}>
            <img
              src={q.thumbnail || thumbFromUrl(q.url)}
              alt={q.title}
              width={80}
              height={140}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div style={{ fontSize: 11, color: "#ddd", marginTop: 6 }}>
              {q.title.length > 20 ? q.title.slice(0, 18) + "…" : q.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
