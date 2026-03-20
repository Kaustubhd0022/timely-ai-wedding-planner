import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

const DEFAULT_VENDORS = [
  {
    name: "The Royal Ballroom",
    rating: 4.9,
    address: "Marine Drive, Mumbai",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    description: "Iconic luxury venue with breathtaking ocean views.",
    why_choose: "Legendary service and most prestigious location in the city."
  },
  {
    name: "Lumina Photography",
    rating: 4.8,
    address: "Bandra West, Mumbai",
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80",
    description: "Award-winning cinematic wedding storytellers.",
    why_choose: "Industry-leading expertise in high-fashion wedding aesthetics."
  },
  {
    name: "Golden Crust Catering",
    rating: 4.7,
    address: "Juhu, Mumbai",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    description: "Gourmet fusion menus for the modern palate.",
    why_choose: "Unmatched presentations and five-star ingredient quality."
  },
  {
    name: "Ethereal Blooms",
    rating: 4.9,
    address: "Colaba, Mumbai",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    description: "Bespoke floral installations and decor mastery.",
    why_choose: "Exotic floral imports and celebrity-trusted design team."
  },
  {
    name: "Velvet Strokes Makeup",
    rating: 4.8,
    address: "Worli, Mumbai",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
    description: "Premium bridal transformations and HD artistry.",
    why_choose: "Long-wear specialization and customized skin-matching techniques."
  }
];

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("API triggered: /api/vendors/search");
  try {
    const { city, category } = await req.json();
    console.log(`[VENDOR SEARCH] City: ${city}, Category: ${category}`);

    if (!city || !category) {
      return NextResponse.json({ error: "City and Category are required" }, { status: 400 });
    }

    if (!GOOGLE_KEY || !process.env.GROQ_API_KEY) {
      console.warn("[VENDOR SEARCH] API keys missing (Google or Groq). Using default vendors.");
      return NextResponse.json(DEFAULT_VENDORS);
    }

    // 1. Geocode City
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();
    console.log("[VENDOR SEARCH] Geocode status:", geocodeData.status);

    let lat = 19.0760; // Default Mumbai
    let lng = 72.8777;
    
    if (geocodeData.status === "OK") {
      lat = geocodeData.results[0].geometry.location.lat;
      lng = geocodeData.results[0].geometry.location.lng;
    }

    // 2. Search Vendors (Places Text Search)
    const categoryQuery = category === "All" ? "Wedding Vendors" : `Wedding ${category}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${categoryQuery} in ${city}`)}&location=${lat},${lng}&radius=100000&key=${GOOGLE_KEY}`;
    
    let searchRes = await fetch(searchUrl);
    let searchData = await searchRes.json();
    console.log("[VENDOR SEARCH] Places response status:", searchData.status);

    // 3. Fallback if no results
    if (searchData.status === "ZERO_RESULTS" || !searchData.results?.length) {
      console.log("[VENDOR SEARCH] Zero results found. Retrying with Mumbai.");
      const fallbackCity = "Mumbai";
      const fallbackUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${categoryQuery} in ${fallbackCity}`)}&key=${GOOGLE_KEY}`;
      searchRes = await fetch(fallbackUrl);
      searchData = await searchRes.json();
    }

    const rawVendors = searchData.results?.slice(0, 10) || [];

    // 4. AI Enrichment
    const enrichedVendors = await Promise.all(rawVendors.map(async (v: any) => {
      try {
        const prompt = `You are a wedding planning expert.
Vendor Name: ${v.name}
Rating: ${v.rating}
Category: ${category}
City: ${city}

Generate:
1. A short 1-line description (max 15 words)
2. A compelling 'why choose this vendor' line (max 15 words)

Output ONLY valid JSON:
{ "description": "...", "why_choose": "..." }`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "mixtral-8x7b-32768",
          temperature: 0.5,
          response_format: { type: "json_object" },
        });

        const aiData = JSON.parse(completion.choices[0]?.message?.content || "{}");
        
        let image = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";
        if (v.photos?.[0]?.photo_reference) {
          image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${v.photos[0].photo_reference}&key=${GOOGLE_KEY}`;
        }

        return {
          id: v.place_id,
          name: v.name,
          rating: v.rating || 0,
          total_reviews: v.user_ratings_total || 0,
          address: v.formatted_address,
          image,
          category: category === "All" ? "Wedding Expert" : category,
          description: aiData.description || "Top-rated wedding service in the region.",
          why_choose: aiData.why_choose || "Highly recommended for their professional approach and quality."
        };
      } catch (err) {
        console.error("AI Enrichment Error for", v.name, err);
        return {
           id: v.place_id,
           name: v.name,
           rating: v.rating || 0,
           total_reviews: v.user_ratings_total || 0,
           address: v.formatted_address,
           image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
           category: category === "All" ? "Wedding Expert" : category,
           description: "Highly rated wedding vendor.",
           why_choose: "Known for excellent service and reliable wedding delivery."
        };
      }
    }));

    // 5. Ensure minimum 5 vendors
    let finalSelection = enrichedVendors;
    if (finalSelection.length < 5) {
      console.log(`[VENDOR SEARCH] Only ${finalSelection.length} results. Supplementing with defaults.`);
      const remainingNeeded = 5 - finalSelection.length;
      finalSelection = [...finalSelection, ...DEFAULT_VENDORS.slice(0, remainingNeeded)];
    }

    console.log(`[VENDOR SEARCH] Returning ${finalSelection.length} vendors.`);
    return NextResponse.json(finalSelection);
  } catch (error) {
    console.error("Vendor Search Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
