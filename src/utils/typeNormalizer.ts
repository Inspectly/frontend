import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faTint,
  faWind,
  faBolt,
  faHouse,
  faPaintRoller,
  faWrench,
  faFire,
  faTree,
  faShieldAlt,
  faCouch,
  faHammer,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Normalizes vendor occupation names to consistent issue type names
 * Example: "electrician" → "electrical", "plumber" → "plumbing"
 */
export const normalizeIssueType = (type: string): string => {
  if (!type) return type;
  
  const typeMap: Record<string, string> = {
    'electrician': 'electrical',
    'plumber': 'plumbing',
    'painter': 'painting',
    'cleaner': 'cleaning',
  };
  
  const normalized = typeMap[type.toLowerCase()];
  return normalized || type;
};

/**
 * Normalizes and capitalizes issue type for display
 * Example: "electrician" → "Electrical"
 */
export const normalizeAndCapitalize = (type: string): string => {
  const normalized = normalizeIssueType(type);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

/**
 * Get icon for an issue type
 */
export const getIssueTypeIcon = (type?: string | null): IconDefinition => {
  if (!type) return faWrench;
  const normalizedType = normalizeIssueType(type).toLowerCase();
  
  const iconMap: Record<string, IconDefinition> = {
    plumbing: faTint,
    electrical: faBolt,
    hvac: faWind,
    roofing: faHouse,
    painting: faPaintRoller,
    structural: faBuilding,
    foundation: faBuilding,
    heating: faFire,
    cooling: faWind,
    landscaping: faTree,
    security: faShieldAlt,
    interior: faCouch,
    exterior: faHammer,
    appliance: faWrench,
  };
  
  return iconMap[normalizedType] || faWrench;
};
