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
  "Fire Technology and Safety": [],
  "General Department": []
};

const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_SECTIONS);
const DEPARTMENTS = ALL_DEPARTMENTS;
const CORE_DEPARTMENTS = ALL_DEPARTMENTS.filter(dept => dept !== "General Department");

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

/**
 * Calculates current college academic year (e.g. '2026-2027').
 * In standard academic calendar, new academic session begins in June (month index 5).
 * @param {Date} [date=new Date()]
 * @returns {string} Formatted academic year string
 */
const getCurrentAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 5 = June
  return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

/**
 * Checks if department is General Department.
 * @param {string} department
 * @returns {boolean}
 */
const isGeneralDepartment = (department) => {
  return (department || "").trim().toLowerCase() === "general department";
};

module.exports = {
  DEPARTMENT_SECTIONS,
  DEPARTMENTS,
  ALL_DEPARTMENTS,
  CORE_DEPARTMENTS,
  requiresSection,
  getAllowedSections,
  getCurrentAcademicYear,
  isGeneralDepartment
};
