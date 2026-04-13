"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center font-mono">
      <form onSubmit={handleSubmit} className="bg-[#111827] border border-[#1e293b] rounded-xl p-8 w-full max-w-sm">
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
    </div>
  );
}
