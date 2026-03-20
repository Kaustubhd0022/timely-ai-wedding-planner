import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(req: Request) {
  try {
    const { city, category } = await req.json();

    if (!city || !category) {
      return NextResponse.json({ error: "City and Category are required" }, { status: 400 });
    }

    // 1. Geocode City
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

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

    // 3. Fallback if no results
    if (searchData.status === "ZERO_RESULTS" || !searchData.results?.length) {
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
        
        // Construct Place Image URL
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
          why_choose: aiData.why_choose || "Highly recommended for their professional approach and quality.",
          score: v.rating || 0,
          distance: 10 // Placeholder for proximity search context
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
           why_choose: "Known for excellent service and reliable wedding delivery.",
           score: v.rating || 0,
           distance: 10
        };
      }
    }));

    return NextResponse.json(enrichedVendors);
  } catch (error) {
    console.error("Vendor Search Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
