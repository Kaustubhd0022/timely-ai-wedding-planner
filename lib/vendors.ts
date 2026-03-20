export interface Location {
  lat: number;
  lng: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  total_reviews: number;
  address: string;
  location: Location;
  image_url?: string;
}

// Haversine formula to calculate distance in km between two lat/lng coordinates
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(loc2.lat - loc1.lat);
  const dLon = deg2rad(loc2.lng - loc1.lng); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Ranking system
// score = (rating * 0.5) + (log(review_count) * 0.3) + (proximity_score * 0.2)
export function calculateVendorScore(vendor: Vendor, userLocation: Location): number {
  const distance = calculateDistance(userLocation, vendor.location);
  
  // Normalize proximity score (approximate: 0 distance = 10 score, 100km distance = 0 score)
  // Max distance considered is 100km, so 100 - distance is our base.
  let proximityScore = 10 * (1 - (distance / 100));
  if (proximityScore < 0) proximityScore = 0;

  // Assuming max rating is 5. Multiply by 2 out of 10 for consistency, or just use rating (0-5)
  // Let's use the explicit multipliers but assume rating is 0-5 and review count can be anything.
  const ratingScore = vendor.rating * 0.5; // max 2.5
  const reviewScore = Math.log10(Math.max(1, vendor.total_reviews)) * 0.3; // max ~0.9 for 1000 reviews
  const proxScore = proximityScore * 0.2; // max 2.0

  return ratingScore + reviewScore + proxScore;
}

// Get vendors within radius and sorted by score
export function getRecommendedVendors(userLocation: Location, category?: string, radiusKm: number = 100): (Vendor & { distance: number; score: number })[] {
  let filtered = MOCK_VENDORS;
  
  if (category && category !== "All") {
    filtered = filtered.filter(v => v.category === category);
  }

  const enhanced = filtered.map(v => ({
    ...v,
    distance: calculateDistance(userLocation, v.location),
    score: calculateVendorScore(v, userLocation)
  }));

  // Filter by distance and sort by score descending
  return enhanced
    .filter(v => v.distance <= radiusKm)
    .sort((a, b) => b.score - a.score);
}

// New York default center: [40.7128, -74.0060]
export const MOCK_VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Lumina Studio",
    category: "Photographer",
    rating: 4.9,
    total_reviews: 342,
    address: "123 Madison Ave, New York, NY",
    location: { lat: 40.7150, lng: -74.0010 },
    image_url: "https://images.unsplash.com/photo-1537151377170-9c19a791bbea?w=800&q=80"
  },
  {
    id: "v2",
    name: "Golden Crust Catering",
    category: "Caterer",
    rating: 4.7,
    total_reviews: 128,
    address: "456 Lexington Ave, New York, NY",
    location: { lat: 40.7500, lng: -73.9800 },
    image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80"
  },
  {
    id: "v3",
    name: "Petals & Promises",
    category: "Decorator",
    rating: 4.8,
    total_reviews: 256,
    address: "789 Broadway, Brooklyn, NY",
    location: { lat: 40.6900, lng: -73.9500 },
    image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80"
  },
  {
    id: "v4",
    name: "Blushing Beauty Co.",
    category: "Makeup Artist",
    rating: 5.0,
    total_reviews: 89,
    address: "321 5th Ave, New York, NY",
    location: { lat: 40.7400, lng: -73.9900 },
    image_url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80"
  },
  {
    id: "v5",
    name: "The Grand Astor",
    category: "Venue",
    rating: 4.6,
    total_reviews: 512,
    address: "555 Park Ave, New York, NY",
    location: { lat: 40.7600, lng: -73.9700 },
    image_url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"
  },
  {
    id: "v6",
    name: "Captured Moments",
    category: "Photographer",
    rating: 4.5,
    total_reviews: 145,
    address: "Jersey City, NJ",
    location: { lat: 40.7281, lng: -74.0776 },
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80"
  },
  {
    id: "v7",
    name: "Hudson River Manor",
    category: "Venue",
    rating: 4.9,
    total_reviews: 180,
    address: "Hoboken, NJ",
    location: { lat: 40.7439, lng: -74.0323 },
    image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
  },
  // A vendor that's too far (Philadelphia area) to test 100km filter
  {
    id: "v8",
    name: "Philly Dream Events",
    category: "Venue",
    rating: 4.8,
    total_reviews: 200,
    address: "Philadelphia, PA",
    location: { lat: 39.9525, lng: -75.1652 },
    image_url: "https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?w=800&q=80" // Approx 130km away from NYC
  }
];
