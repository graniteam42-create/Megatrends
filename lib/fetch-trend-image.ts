/**
 * Fetch a unique landscape image from Pexels for a trend name.
 * Returns null if the API is unavailable or no results found.
 */
export async function fetchTrendImage(
  trendName: string
): Promise<{ url: string; thumb: string; credit: string } | null> {
  try {
    // Build a short search query from the trend name (first 3 meaningful words)
    const query = trendName
      .replace(/[&]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join(" ");

    const res = await fetch(`/api/images?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.photos?.length) return null;

    // Pick a random photo from the top 5 results for variety
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    return photo;
  } catch {
    return null;
  }
}
