import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];
}
