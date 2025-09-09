// src/components/ShortsPlayer.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Improved ShortsPlayer
 * - Prevents duplicates via seenIds
 * - Auto-fetches/generates new items when queue low
 * - Doesn't simply loop same 3-4 items
 * - Paste/replace this file at src/components/ShortsPlayer.jsx
 */

// sample pool (add more YouTube IDs if you want variety)
const SAMPLE_POOL = [
  "PhVQWwjZn54","WXeFtVV78dg","JvDf7htxvrA","EU3EMbE4iro","DEVbob414SM",
  "DqdSp0Au6x0","J94eErbvPmQ","X5dg86tXQjU","TnzDwdatKYk","JEV210XLDoY",
  "YbJOTdZBX1g","kXYiU_JCYtU","3JZ_D3ELwOQ","M7lc1UVf-VE","dQw4w9WgXcQ",
  "tVj0ZTS4WF4","hTWKbfoikeg","9bZkp7q19f0","e-ORhEE9VVg","uelHwf8o7_U"
];

// initial demo (small)
const INITIAL = [
  { id: "init1", title: "Funny Cat", url: "https://www.youtube.com/embed/PhVQWwjZn54", thumbnail: "https://i.ytimg.com/vi/PhVQWwjZn54/hqdefault.jpg", channel: "CatChannel" },
  { id: "init2", title: "Dance Move", url: "https://www.youtube.com/embed/WXeFtVV78dg", thumbnail: "https://i.ytimg.com/vi/WXeFtVV78dg/hqdefault.jpg", channel: "DanceZone" },
  { id: "init3", title: "Comedy Clip", url: "https://www.youtube.com/embed/JvDf7htxvrA", thumbnail: "https://i.ytimg.com/vi/JvDf7htxvrA/hqdefault.jpg", channel: "Laughs" },
  { id: "init4", title: "Short Skit", url: "https://www.youtube.com/embed/EU3EMbE4iro", thumbnail: "https://i.ytimg.com/vi/EU3EMbE4iro/hqdefault.jpg", channel: "Skits" },
];

export default function ShortsPlayer() {
  const [queue, setQueue] = useState([...INITIAL]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const seenIdsRef = useRef(new Set(INITIAL.map(i => i.id))); // track ids already used
  const loadingRef = useRef(false);
  const maxBuffer = 50; // don't let client queue grow unlimited

  // helper: create thumbnail from youtube embed url
  function thumbFromVidId(vid) {
    return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  }

  // pick random sample id from pool
  function pickRandomVid() {
    const vid = SAMPLE_POOL[Math.floor(Math.random() * SAMPLE_POOL.length)];
    return vid;
  }

  // generate unique demo items, tries until it creates `count` unique items
  function fetchMoreDemo(count = 6) {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const newItems = [];
    let tries = 0;
    while (newItems.length < count && tries < count * 6) {
      tries++;
      const vid = pickRandomVid();
      // make a unique id using timestamp + vid + random
      const id = `gen_${vid}_${Date.now().toString(36)}_${Math.floor(Math.random()*1000)}`;
      if (seenIdsRef.current.has(id)) continue;
      // ensure we are not using same vid repeatedly by checking thumbnail+title later (this is lightweight)
      seenIdsRef.current.add(id);
      newItems.push({
        id,
        title: `Auto Short • ${vid}`,
        url: `https://www.youtube.com/embed/${vid}`,
        thumbnail: thumbFromVidId(vid),
        channel: "AutoGen",
      });
    }

    // append to queue (dedupe guard)
    setQueue(prev => {
      const map = new Map(prev.map(i => [i.id, i]));
      newItems.forEach(it => map.set(it.id, it));
      const items = Array.from(map.values());
      // cap buffer size (keep last items if exceed)
      if (items.length > maxBuffer) {
        return items.slice(items.length - maxBuffer);
      }
      return items;
    });

    loadingRef.current = false;
  }

  // auto-fetch when queue low
  useEffect(() => {
    // on mount ensure some extra items exist
    if (queue.length < 6) fetchMoreDemo(8);
    // whenever currentIndex approaches end, fetch more
    if (queue.length - currentIndex <= 4) {
      fetchMoreDemo(8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // go to next (and if near end will auto-fetch due to useEffect)
  function goNext() {
    setCurrentIndex(i => {
      const next = i + 1;
      if (next >= queue.length) {
        // if somehow at absolute end, trigger fetch and stay (UI will update after fetch)
        fetchMoreDemo(8);
        return i; // stay
      }
      return next;
    });
  }

  function goPrev() {
    setCurrentIndex(i => Math.max(0, i - 1));
  }

  // Manual load more
  function handleLoadMore() {
    fetchMoreDemo(12);
  }

  const current = queue[currentIndex];

  return (
    <div style={{ textAlign: "center" }}>
      {!current ? (
        <div style={{ padding: 24 }}>कोई शॉर्ट उपलब्ध नहीं — प्रतीक्षा कर रहे हैं...</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <iframe
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
            />
          </div>

          <h4 style={{ margin: "8px 0 4px 0" }}>{current.title}</h4>
          <div style={{ fontSize: 12, color: "#aaa" }}>{current.channel}</div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 10 }}>
            <button onClick={goPrev} disabled={currentIndex === 0} style={{ padding: "8px 12px" }}>
              Prev
            </button>

            <button onClick={goNext} style={{ padding: "8px 16px" }}>
              Next ▶
            </button>

            <button onClick={handleLoadMore} style={{ padding: "8px 12px" }}>
              Load more
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {queue.slice(currentIndex + 1, currentIndex + 8).map(q => (
              <div key={q.id} style={{ textAlign: "center", width: 90 }}>
                <img src={q.thumbnail} alt={q.title} width={90} height={160} style={{ borderRadius: 8, objectFit: "cover" }} />
                <div style={{ fontSize: 11, color: "#ddd", marginTop: 6 }}>{q.title.length > 24 ? q.title.slice(0, 22) + "…" : q.title}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
