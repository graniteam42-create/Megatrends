"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Visit {
  ts: string;
  city: string;
  country: string;
  region: string;
  lat: number | null;
  lng: number | null;
  ua: string;
}

export default function VisitLog({ onClose }: { onClose: () => void }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    fetch("/api/visits")
      .then((r) => r.json())
      .then((data) => {
        setVisits(data.visits || []);
        if (data.error) setError(data.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !mapRef.current || mapInstance.current) return;

    const geoVisits = visits.filter((v) => v.lat !== null && v.lng !== null);

    const map = L.map(mapRef.current, {
      center: [30, 10],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: '<div style="width:10px;height:10px;border-radius:50%;background:#00e5ff;border:2px solid #0d1117;box-shadow:0 0 8px #00e5ff88;"></div>',
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    geoVisits.forEach((v) => {
      const marker = L.marker([v.lat!, v.lng!], { icon }).addTo(map);
      const time = new Date(v.ts).toLocaleString();
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:12px;color:#e0e4ec;background:#111827;padding:8px;border-radius:6px;border:1px solid #1e293b;min-width:180px;">
          <div style="color:#00e5ff;font-weight:bold;margin-bottom:4px;">${v.city}, ${v.country}</div>
          <div style="color:#94a3b8;">${time}</div>
        </div>`,
        { className: "dark-popup" }
      );
    });

    if (geoVisits.length > 0) {
      const bounds = L.latLngBounds(geoVisits.map((v) => [v.lat!, v.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [loading, visits]);

  const locationCounts: Record<string, number> = {};
  visits.forEach((v) => {
    const key = `${v.city}, ${v.country}`;
    locationCounts[key] = (locationCounts[key] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0c10]/90 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#111827] to-[#0f1623] border border-[#1e293b] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#111827] border-b border-[#1e293b] px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-[15px] font-bold text-[#00e5ff]">Visit Log</h3>
            <span className="text-[11px] text-[#475569] font-mono">{visits.length} visits recorded</span>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#e0e4ec] text-lg px-2">X</button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-5 h-5 border-2 border-[#1e293b] border-t-[#00e5ff] rounded-full animate-spin" />
              <p className="mt-3 text-[13px] text-[#0ea5e9]">Loading visits...</p>
            </div>
          ) : error && visits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-[#94a3b8]">No visits recorded yet.</p>
              <p className="text-[11px] text-[#475569] mt-2">Visits will appear once Vercel KV is configured.</p>
            </div>
          ) : (
            <>
              {/* Map */}
              <div ref={mapRef} className="w-full h-[320px] rounded-lg border border-[#1e293b] mb-5" style={{ background: "#0d1117" }} />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-[#0d1117] border border-[#1e293b] rounded-lg p-3 text-center">
                  <span className="text-[22px] font-bold font-mono text-[#00e5ff]">{visits.length}</span>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Total Visits</p>
                </div>
                <div className="bg-[#0d1117] border border-[#1e293b] rounded-lg p-3 text-center">
                  <span className="text-[22px] font-bold font-mono text-[#c084fc]">{Object.keys(locationCounts).length}</span>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Unique Locations</p>
                </div>
                <div className="bg-[#0d1117] border border-[#1e293b] rounded-lg p-3 text-center">
                  <span className="text-[22px] font-bold font-mono text-[#00e676]">{new Set(visits.map((v) => v.country)).size}</span>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Countries</p>
                </div>
              </div>

              {/* Visit table */}
              <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8]">Time</th>
                      <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8]">City</th>
                      <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8]">Country</th>
                      <th className="px-3 py-2 text-left uppercase tracking-widest font-mono text-[11px] text-[#94a3b8]">Coords</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.slice(0, 100).map((v, i) => (
                      <tr key={i} className="border-b border-[#1e293b] hover:bg-white/[0.03]">
                        <td className="px-3 py-2 font-mono text-[#94a3b8] whitespace-nowrap">{new Date(v.ts).toLocaleString()}</td>
                        <td className="px-3 py-2 text-[#cbd5e1]">{v.city}{v.region ? `, ${v.region}` : ""}</td>
                        <td className="px-3 py-2 text-[#cbd5e1]">{v.country}</td>
                        <td className="px-3 py-2 font-mono text-[#475569] text-[11px]">
                          {v.lat !== null ? `${v.lat.toFixed(2)}, ${v.lng!.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
