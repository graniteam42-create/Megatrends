// Curated trend images from Pexels (free, no API key needed for direct URLs)
// Using w=1280 for crisp banner images, w=200&h=80 for wider landscape thumbs.

export const TREND_IMAGES: Record<string, { url: string; thumb: string; credit: string }> = {
  "t1":  { url: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // AI - server room
  "t2":  { url: "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Gold bars
  "t3":  { url: "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Nuclear / energy
  "t4":  { url: "https://images.pexels.com/photos/3476860/pexels-photo-3476860.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/3476860/pexels-photo-3476860.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Geopolitics - world map
  "t5":  { url: "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Demographics - elderly care
  "t6":  { url: "https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Cybersecurity
  "t7":  { url: "https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Commodities - gold/metals
  "t8":  { url: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Synthetic biology - lab
  "t9":  { url: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },  // Bridge states - emerging markets
  "t10": { url: "https://images.pexels.com/photos/929385/pexels-photo-929385.jpeg?auto=compress&cs=tinysrgb&w=1280", thumb: "https://images.pexels.com/photos/929385/pexels-photo-929385.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop", credit: "Pexels" },   // Carbon - industrial
};

// Fallback images for AI-added custom trends, matched by keyword in trend name/description
const FALLBACK_IMAGES: { keywords: string[]; url: string; thumb: string }[] = [
  { keywords: ["ai", "artificial", "machine learning", "automation", "robot", "compute"],
    url: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["gold", "silver", "metal", "commodity", "monetary", "asset", "hard asset"],
    url: "https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["energy", "nuclear", "solar", "wind", "power", "grid", "climate", "electric", "green"],
    url: "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["defense", "military", "geopolit", "war", "security", "nato", "reshoring"],
    url: "https://images.pexels.com/photos/3476860/pexels-photo-3476860.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/3476860/pexels-photo-3476860.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["health", "aging", "demographic", "pharma", "medical", "biotech", "longevity"],
    url: "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["cyber", "trust", "verification", "identity", "deepfake", "zero-trust"],
    url: "https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["bio", "gene", "crispr", "dna", "synthetic", "genomic"],
    url: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["emerging", "frontier", "india", "mexico", "vietnam", "bridge", "developing"],
    url: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["carbon", "capture", "co2", "pollution", "industrial"],
    url: "https://images.pexels.com/photos/929385/pexels-photo-929385.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/929385/pexels-photo-929385.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["crypto", "bitcoin", "blockchain", "defi", "token", "digital currency"],
    url: "https://images.pexels.com/photos/844127/pexels-photo-844127.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/844127/pexels-photo-844127.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["space", "satellite", "orbit", "launch", "aerospace"],
    url: "https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["water", "scarcity", "drought", "desalination", "irrigation"],
    url: "https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
  { keywords: ["food", "agriculture", "farming", "supply chain", "logistics"],
    url: "https://images.pexels.com/photos/2132171/pexels-photo-2132171.jpeg?auto=compress&cs=tinysrgb&w=1280",
    thumb: "https://images.pexels.com/photos/2132171/pexels-photo-2132171.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop" },
];

// Default generic image for trends that don't match any keyword
const DEFAULT_TREND_IMAGE = {
  url: "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1280",
  thumb: "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop",
  credit: "Pexels",
};

/**
 * Get image for any trend — seed trends use hardcoded images,
 * custom trends use keyword matching against name + description.
 */
export function getTrendImage(trendId: string, name: string, description?: string): { url: string; thumb: string; credit: string } | undefined {
  // Use hardcoded image if available
  if (TREND_IMAGES[trendId]) return TREND_IMAGES[trendId];

  // For custom trends, try keyword matching
  const text = `${name} ${description || ""}`.toLowerCase();
  for (const fallback of FALLBACK_IMAGES) {
    if (fallback.keywords.some((kw) => text.includes(kw))) {
      return { ...fallback, credit: "Pexels" };
    }
  }

  // Default generic image
  return DEFAULT_TREND_IMAGE;
}
