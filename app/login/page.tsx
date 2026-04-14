"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ArtworkInfo {
  imageUrl: string;
  title: string;
  artist: string;
}

// Curated list of visually striking Met Museum artwork IDs (paintings with large images)
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
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-mono relative overflow-hidden">
      {/* Artwork background */}
      {art && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${art.imageUrl})`,
            opacity: 0.15,
            filter: "blur(2px)",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] via-transparent to-[#0a0c10]" />

      <div className="relative z-10 w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-[#111827]/90 backdrop-blur-sm border border-[#1e293b] rounded-xl p-8">
          <h1 className="text-[#00e5ff] text-xl font-bold tracking-wider mb-1">TREND COMPASS</h1>
          <p className="text-[#64748b] text-xs tracking-widest uppercase mb-6">Strategic Intelligence System</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#0d1117] border border-[#1e293b] rounded-lg text-[#e0e4ec] text-sm outline-none focus:border-[#00e5ff] mb-4"
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

        {/* Artwork credit */}
        {art && (
          <p className="text-center text-[10px] text-[#475569] mt-4 italic">
            {art.title} — {art.artist} (The Metropolitan Museum of Art)
          </p>
        )}
      </div>
    </div>
  );
}
