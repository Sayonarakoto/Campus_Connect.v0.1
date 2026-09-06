// constants/academicConfig.js

/**
 * Mapping of departments to their academic sections.
 * In St. Mary's Polytechnic College, Mechanical Engineering has an expanded intake
 * split into two divisions: Mech-A and Mech-B. Other departments operate as single divisions.
 */
const DEPARTMENT_SECTIONS = {
  "Mechanical Engineering": ["Mech-A", "Mech-B"],
  "Computer Engineering": [],
  "Automobile Engineering": [],
  "Electrical and Electronics Engineering": [],
  "Civil Engineering": [],
  "Fire Technology and Safety": []
};

const DEPARTMENTS = Object.keys(DEPARTMENT_SECTIONS);

/**
 * Checks if a given department requires section assignment.
 * @param {string} department
 * @returns {boolean}
 */
const requiresSection = (department) => {
  return (
    Array.isArray(DEPARTMENT_SECTIONS[department]) &&
    DEPARTMENT_SECTIONS[department].length > 0
  );
};

/**
 * Returns allowed sections for a given department.
 * @param {string} department
 * @returns {string[]}
 */
const getAllowedSections = (department) => {
  return DEPARTMENT_SECTIONS[department] || [];
};

module.exports = {
  DEPARTMENT_SECTIONS,
  DEPARTMENTS,
  requiresSection,
  getAllowedSections
};
