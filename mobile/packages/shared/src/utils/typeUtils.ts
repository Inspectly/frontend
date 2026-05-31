export const normalizeIssueType = (type: string): string => {
  if (!type) return type;
  const typeMap: Record<string, string> = {
    electrician: "electrical",
    plumber: "plumbing",
    painter: "painting",
    cleaner: "cleaning",
  };
  const normalized = typeMap[type.toLowerCase()];
  return normalized || type;
};

export const normalizeAndCapitalize = (type?: string | null): string => {
  if (!type) return "General";
  const normalized = normalizeIssueType(type);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

/**
 * Maps an issue type to an Ionicons glyph name (used with @expo/vector-icons).
 */
export const getIssueTypeIonicon = (type?: string | null): string => {
  if (!type) return "construct-outline";
  const normalized = normalizeIssueType(type).toLowerCase();
  const iconMap: Record<string, string> = {
    plumbing: "water-outline",
    electrical: "flash-outline",
    hvac: "thermometer-outline",
    roofing: "home-outline",
    painting: "color-fill-outline",
    structural: "business-outline",
    foundation: "business-outline",
    heating: "flame-outline",
    cooling: "snow-outline",
    landscaping: "leaf-outline",
    security: "shield-outline",
    interior: "bed-outline",
    exterior: "hammer-outline",
    appliance: "construct-outline",
    general: "construct-outline",
  };
  return iconMap[normalized] || "construct-outline";
};

export type Severity = "high" | "medium" | "low";

/**
 * Severity -> Ionicon + hex color (mirrors the web marketplace card).
 */
export const getSeverityConfig = (severity?: string | null): { icon: string; color: string } => {
  switch ((severity || "").toLowerCase()) {
    case "high":
      return { icon: "warning", color: "#ef4444" };
    case "low":
      return { icon: "information-circle", color: "#3b82f6" };
    case "medium":
    default:
      return { icon: "alert-circle", color: "#f97316" };
  }
};
