import React, { useState } from "react";

const demoVideos = [
  { id: "x1", title: "Funny Cat", url: "https://www.youtube.com/embed/PhVQWwjZn54" },
  { id: "x2", title: "Dance Move", url: "https://www.youtube.com/embed/WXeFtVV78dg" },
  { id: "x3", title: "Comedy Clip", url: "https://www.youtube.com/embed/JvDf7htxvrA" },
];

export default function ShortsPlayer() {
  const [index, setIndex] = useState(0);
  const video = demoVideos[index];

  const nextVideo = () => {
    setIndex((prev) => (prev + 1) % demoVideos.length);
  };

  return (
    <div className="shorts-player" style={{ textAlign: "center" }}>
      <iframe
        title={video.title}
        src={video.url}
        style={{
          width: "100%",
          maxWidth: "420px",
          aspectRatio: "9/16",
          border: "0",
          borderRadius: "12px",
          background: "#000",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>

      <h4>{video.title}</h4>
      <button onClick={nextVideo} style={{ marginTop: "12px", padding: "8px 16px" }}>
        Next ▶
      </button>
    </div>
  );
}
