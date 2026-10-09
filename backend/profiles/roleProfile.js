'use strict';

/**
 * Deterministic, curated role profiles.
 *
 * To add a role, add one entry to `roleProfiles`:
 *   'Role Name': { aliases: [...], skills: [...], sections: [...], actionWords: [...], keywords: [...] }
 * Nothing else needs to change: matching, ATS scoring and the API pick it up.
 */

const { normalizeKey } = require('../utils/helpers');

const COMMON_SECTIONS = ['Education', 'Projects', 'Experience', 'Skills', 'Certifications'];

// Used when the AI generates a profile for a role that has no curated entry.
const DEFAULT_SECTIONS = ['Education', 'Experience', 'Projects', 'Skills', 'Certifications'];
const DEFAULT_ACTION_WORDS = ['Developed', 'Designed', 'Implemented', 'Managed', 'Created'];

const roleProfiles = {
  'Software Engineer': {
    aliases: ['Software Developer', 'SDE'],
    skills: ['C++', 'Java', 'Python', 'JavaScript', 'DSA', 'OOP', 'DBMS', 'OS', 'CN', 'Git', 'GitHub'],
    sections: COMMON_SECTIONS,
    actionWords: ['Built', 'Developed', 'Implemented', 'Designed', 'Optimized', 'Created', 'Led'],
    keywords: ['software development', 'algorithms', 'system design', 'problem solving'],
  },
  'Frontend Developer': {
    aliases: ['Front End Developer', 'Frontend Engineer', 'Front End Engineer'],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Redux', 'Tailwind', 'Bootstrap', 'Git', 'GitHub'],
    sections: COMMON_SECTIONS,
    actionWords: ['Built', 'Developed', 'Designed', 'Created', 'Implemented', 'Optimized'],
    keywords: ['responsive design', 'UI development', 'web performance', 'component-based architecture'],
  },
  'Backend Developer': {
    aliases: ['Back End Developer', 'Backend Engineer', 'Back End Engineer'],
    skills: ['Node', 'Express', 'Java', 'Python', 'Django', 'Flask', 'Spring', 'SQL', 'MongoDB', 'PostgreSQL', 'Git', 'Docker'],
    sections: COMMON_SECTIONS,
    actionWords: ['Built', 'Developed', 'Implemented', 'Optimized', 'Designed', 'Managed'],
    keywords: ['REST APIs', 'database design', 'server-side development', 'authentication'],
  },
  'Data Analyst': {
    aliases: [],
    skills: ['SQL', 'Excel', 'Python', 'Pandas', 'NumPy', 'Power BI', 'Tableau', 'Statistics', 'Data Visualization'],
    sections: COMMON_SECTIONS,
    actionWords: ['Analyzed', 'Created', 'Built', 'Visualized', 'Reported', 'Improved'],
    keywords: ['data cleaning', 'dashboards', 'reporting', 'exploratory data analysis'],
  },
  'Electrical Engineer': {
    aliases: ['Electrical Engineering'],
    skills: [
      'Electrical Machines',
      'Power Systems',
      'Power Electronics',
      'Circuit Analysis',
      'Control Systems',
      'MATLAB',
      'Simulink',
      'PLC',
      'AutoCAD',
      'Electrical Design',
    ],
    sections: COMMON_SECTIONS,
    actionWords: ['Designed', 'Developed', 'Analyzed', 'Tested', 'Implemented', 'Maintained'],
    keywords: ['circuit design', 'power distribution', 'simulation', 'industrial automation'],
  },
};

/**
 * Extra spellings that count as a match for a term (key = lowercase term).
 * ATS matching is whole-word, so "MySQL" would not match "SQL" without this.
 */
const termAliases = {
  // skills
  node: ['NodeJS'],
  express: ['ExpressJS'],
  javascript: ['JS', 'ECMAScript'],
  react: ['ReactJS'],
  tailwind: ['TailwindCSS'],
  mongodb: ['Mongo'],
  postgresql: ['Postgres'],
  sql: ['MySQL', 'PostgreSQL', 'Postgres', 'SQL Server', 'SQLite', 'T-SQL', 'PL/SQL'],
  'c++': ['CPP'],
  git: ['GitHub', 'GitLab'],
  dsa: ['Data Structures', 'Data Structures and Algorithms'],
  oop: ['Object Oriented', 'Object-Oriented'],
  dbms: ['Database Management System', 'Database Management Systems'],
  os: ['Operating System', 'Operating Systems'],
  cn: ['Computer Networks', 'Computer Networking'],
  'power bi': ['PowerBI'],
  statistics: ['Statistical'],
  'data visualization': ['Data Visualisation'],
  'electrical machines': ['Electrical Machine'],
  'power systems': ['Power System'],
  'control systems': ['Control System'],
  plc: ['PLCs'],
  // sections
  education: ['Academic Background', 'Academics'],
  experience: ['Work History', 'Employment', 'Internship', 'Internships'],
  projects: ['Project'],
  skills: ['Technologies', 'Tech Stack'],
  certifications: ['Certification', 'Certificates', 'Certificate'],
  // action words
  built: ['Building'],
  developed: ['Developing'],
  created: ['Creating'],
  implemented: ['Implementing'],
  designed: ['Designing'],
  optimized: ['Optimised', 'Optimizing'],
  managed: ['Managing'],
  led: ['Leading'],
  analyzed: ['Analysed', 'Analyzing'],
  visualized: ['Visualised', 'Visualizing'],
  tested: ['Testing'],
  maintained: ['Maintaining'],
  improved: ['Improving'],
};

// Lookup of every canonical name and alias -> canonical role name.
const roleNameIndex = new Map();
for (const [roleName, profile] of Object.entries(roleProfiles)) {
  roleNameIndex.set(normalizeKey(roleName), roleName);
  for (const alias of profile.aliases) roleNameIndex.set(normalizeKey(alias), roleName);
}

/** Returns { roleName, profile } for a curated role (or alias), else null. */
function findRoleProfile(detectedRole) {
  const key = normalizeKey(detectedRole);
  if (!key) return null;

  const roleName = roleNameIndex.get(key);
  return roleName ? { roleName, profile: roleProfiles[roleName] } : null;
}

function getTermAliases(term) {
  return termAliases[String(term).toLowerCase().trim()] || [];
}

const getSupportedRoles = () => Object.keys(roleProfiles);

module.exports = {
  roleProfiles,
  findRoleProfile,
  getTermAliases,
  getSupportedRoles,
  DEFAULT_SECTIONS,
  DEFAULT_ACTION_WORDS,
};
