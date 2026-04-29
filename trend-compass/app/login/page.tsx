'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1117] border border-[#1e293b] rounded-xl p-8 w-full max-w-sm flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold text-[#00e5ff] font-[family-name:var(--font-heading)] tracking-tight">
          Trend Compass
        </h1>
        <p className="text-[#94a3b8] text-sm">Enter password to continue</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="bg-[#111827] border border-[#1e293b] rounded-lg px-4 py-3 text-[#e0e4ec] placeholder:text-[#64748b] focus:outline-none focus:border-[#00e5ff] font-[family-name:var(--font-mono)]"
          autoFocus
        />
        {error && <p className="text-[#ff1744] text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00e5ff] text-[#0a0c10] font-semibold rounded-lg py-3 hover:bg-[#00b8d4] transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
