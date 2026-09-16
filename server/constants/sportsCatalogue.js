/**
 * Standard Indian school/college sports particulars catalogue.
 * Used to seed SportsEvent documents via migration + served via API
 * so the client can select event types per sports edition (academicYear).
 *
 * No Festival model in Phase 1 — grouping is by academicYear + eventStatus.
 */

const SPORTS_CATALOGUE = [
  // Track
  { key: "100m", eventName: "100m Sprint", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "200m", eventName: "200m Sprint", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "400m", eventName: "400m Race", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "800m", eventName: "800m Race", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "1500m", eventName: "1500m Race", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "1600m", eventName: "1600m Race", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "5000m", eventName: "5000m Race", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "110m-hurdles", eventName: "110m Hurdles", category: "Track", eventType: "Individual", gender: "Mixed" },
  { key: "4x100-relay", eventName: "4x100m Relay", category: "Track", eventType: "Team", gender: "Mixed" },
  // Field
  { key: "long-jump", eventName: "Long Jump", category: "Field", eventType: "Individual", gender: "Mixed" },
  { key: "high-jump", eventName: "High Jump", category: "Field", eventType: "Individual", gender: "Mixed" },
  { key: "shot-put", eventName: "Shot Put", category: "Field", eventType: "Individual", gender: "Mixed" },
  { key: "discus", eventName: "Discus Throw", category: "Field", eventType: "Individual", gender: "Mixed" },
  { key: "javelin", eventName: "Javelin Throw", category: "Field", eventType: "Individual", gender: "Mixed" },
  // Outdoor / Team games
  { key: "kabaddi", eventName: "Kabaddi", category: "Outdoor", eventType: "Team", gender: "Mixed" },
  { key: "kho-kho", eventName: "Kho-Kho", category: "Outdoor", eventType: "Team", gender: "Mixed" },
  { key: "volleyball", eventName: "Volleyball", category: "Team Game", eventType: "Team", gender: "Mixed" },
  { key: "football", eventName: "Football", category: "Team Game", eventType: "Team", gender: "Mixed" },
  { key: "cricket", eventName: "Cricket", category: "Team Game", eventType: "Team", gender: "Mixed" },
  { key: "badminton-singles", eventName: "Badminton Singles", category: "Indoor", eventType: "Individual", gender: "Mixed" },
  { key: "badminton-doubles", eventName: "Badminton Doubles", category: "Indoor", eventType: "Team", gender: "Mixed" },
  { key: "chess", eventName: "Chess", category: "Indoor", eventType: "Individual", gender: "Mixed" },
  { key: "carrom", eventName: "Carrom", category: "Indoor", eventType: "Individual", gender: "Mixed" },
  { key: "table-tennis", eventName: "Table Tennis", category: "Indoor", eventType: "Individual", gender: "Mixed" },
];

const RESULT_VALUES = ["FIRST", "SECOND", "THIRD", "PARTICIPATED", "FAILED", "DISQUALIFIED", "DID_NOT_PARTICIPATE"];

// Excel columns for result import (multi-event per file)
const RESULT_IMPORT_COLUMNS = [
  "AdmissionNo",
  "EventName",
  "House",
  "Rank",
];

module.exports = { SPORTS_CATALOGUE, RESULT_VALUES, RESULT_IMPORT_COLUMNS };
