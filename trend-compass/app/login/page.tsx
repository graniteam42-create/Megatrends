"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ArtworkInfo {
  imageUrl: string;
  title: string;
  artist: string;
}

const ARTWORK_IDS = [
  436535, 438817, 437853, 436528, 437329, 436840, 438012, 437980,
  435809, 436573, 437869, 435882, 436105, 437984, 435621, 438722,
  437133, 436106, 435976, 436524, 435888, 437879, 436965, 437321,
  438816, 436483, 436947, 437526, 437436, 438474,
];

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [art, setArt] = useState<ArtworkInfo | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = ARTWORK_IDS[Math.floor(Math.random() * ARTWORK_IDS.length)];
    fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.primaryImage) {
          setArt({
            imageUrl: data.primaryImage,
            title: data.title || "",
            artist: data.artistDisplayName || "Unknown artist",
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex font-mono relative overflow-hidden">
      {/* Full artwork background - high visibility */}
      {art && (
        <>
          <img
            src={art.imageUrl}
            alt=""
            onLoad={() => setImgLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 0.8 : 0, transition: "opacity 1.5s ease-in" }}
          />
          {/* Gradient only on the left 40% where the form sits */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0a0c10 25%, #0a0c10cc 35%, transparent 55%)" }} />
          {/* Subtle vignette at very top and bottom edges only */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0a0c10 0%, transparent 15%, transparent 85%, #0a0c10 100%)" }} />
        </>
      )}

      {/* Left-aligned form */}
      <div className="relative z-10 flex flex-col justify-center px-12 py-16 w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-[#111827]/80 backdrop-blur-md border border-[#1e293b] rounded-xl p-8">
          <h1 className="text-[#00e5ff] text-xl font-bold tracking-wider mb-1">TREND COMPASS</h1>
          <p className="text-[#94a3b8] text-xs tracking-widest uppercase mb-6">Strategic Intelligence System</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#0d1117]/80 border border-[#1e293b] rounded-lg text-[#e0e4ec] text-sm outline-none focus:border-[#00e5ff] mb-4"
            autoFocus
          />
          {error && <p className="text-[#ff1744] text-xs mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00e5ff] text-[#0a0c10] font-semibold rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>

        {art && (
          <p className="text-[11px] text-[#64748b] mt-4 leading-relaxed">
            <span className="italic">{art.title}</span> — {art.artist}
            <br />
            <span className="text-[10px] text-[#475569]">The Metropolitan Museum of Art</span>
          </p>
        )}
      </div>
    </div>
  );
}
