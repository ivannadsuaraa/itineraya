/**
 * Category colors for Google Maps pins.
 * Each category gets a distinct hue so users can visually scan.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "#DB4437", // red
  hotel: "#4285F4", // blue
  sight: "#0F9D58", // green
  activity: "#FF6D01", // orange
  nightlife: "#9C27B0", // purple
  transport: "#607D8B", // blue-grey
  shopping: "#E91E63", // pink
  other: "#795548", // brown
};

export function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.other;
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other;
}

export function getCategoryEmoji(category?: string): string {
  switch (category?.toLowerCase()) {
    case "restaurant":
      return "🍽️";
    case "hotel":
      return "🏨";
    case "sight":
      return "📍";
    case "activity":
      return "🎯";
    case "nightlife":
      return "🌙";
    case "transport":
      return "🚗";
    case "shopping":
      return "🛍️";
    default:
      return "📍";
  }
}

/**
 * Light gray map style for a clean, modern look matching the app's aesthetic.
 */
export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a6d8c" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#d6eaf8" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#f5f8fa" }],
  },
];