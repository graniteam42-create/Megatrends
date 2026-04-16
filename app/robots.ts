import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // The app is behind a password gate — keep it out of search indexes entirely.
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
