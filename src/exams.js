// Exam structures follow each exam's published format. Sections become the "subjects" used across the app,
// topics are the tiles on the heatmap. Links go to the official organisers only.
const S = (name, topics = []) => ({ name, topics });

export const EXAMS = {
  "GRE": {
    sections: [
      S("Verbal Reasoning", ["Reading Comprehension", "Text Completion", "Sentence Equivalence", "Vocabulary"]),
      S("Quantitative Reasoning", ["Arithmetic", "Algebra", "Geometry", "Data Analysis", "Quantitative Comparison"]),
      S("Analytical Writing", ["Analyze an Issue", "Analyze an Argument"]),
    ],
    links: [{ label: "ETS GRE official prep and free practice tests", url: "https://www.ets.org/gre" }],
  },
  "UPSC CSE Prelims": {
    sections: [
      S("GS Paper I", ["Ancient and Medieval History", "Modern History", "Art and Culture", "Geography", "Polity and Governance", "Economy", "Environment and Ecology", "Science and Technology", "Current Affairs"]),
      S("CSAT Paper II", ["Reading Comprehension", "Basic Numeracy", "Logical Reasoning"]),
    ],
    links: [{ label: "UPSC official site", url: "https://upsc.gov.in" }, { label: "NCERT textbooks", url: "https://ncert.nic.in/textbook.php" }],
  },
  "CAT": {
    sections: [
      S("VARC", ["Reading Comprehension", "Para Jumbles", "Para Summary", "Odd Sentence Out"]),
      S("DILR", ["Tables and Charts", "Caselets", "Arrangements", "Games and Tournaments", "Venn and Sets"]),
      S("Quantitative Ability", ["Arithmetic", "Algebra", "Geometry", "Number System", "Modern Maths"]),
    ],
    links: [{ label: "Official CAT site (mock test and info)", url: "https://iimcat.ac.in" }],
  },
  "JEE Main": {
    sections: [
      S("Physics", ["Mechanics", "Thermodynamics", "Electrostatics and Current", "Magnetism and EMI", "Optics", "Modern Physics"]),
      S("Chemistry", ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"]),
      S("Mathematics", ["Algebra", "Calculus", "Coordinate Geometry", "Trigonometry", "Vectors and 3D", "Probability and Statistics"]),
    ],
    links: [{ label: "NTA JEE Main official", url: "https://jeemain.nta.nic.in" }, { label: "NCERT textbooks", url: "https://ncert.nic.in/textbook.php" }],
  },
  "NEET UG": {
    sections: [
      S("Physics", ["Mechanics", "Heat and Thermodynamics", "Electricity and Magnetism", "Optics", "Modern Physics"]),
      S("Chemistry", ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"]),
      S("Biology", ["Diversity and Structure", "Plant Physiology", "Human Physiology", "Genetics and Evolution", "Ecology", "Biotechnology"]),
    ],
    links: [{ label: "NTA NEET UG official", url: "https://neet.nta.nic.in" }, { label: "NCERT textbooks", url: "https://ncert.nic.in/textbook.php" }],
  },
  "SAT": {
    sections: [
      S("Reading and Writing", ["Craft and Structure", "Information and Ideas", "Standard English Conventions", "Expression of Ideas"]),
      S("Math", ["Algebra", "Advanced Math", "Problem Solving and Data Analysis", "Geometry and Trigonometry"]),
    ],
    links: [{ label: "College Board SAT official", url: "https://satsuite.collegeboard.org/sat" }, { label: "Khan Academy SAT prep", url: "https://www.khanacademy.org/test-prep/sat" }],
  },
  "IELTS": {
    sections: [
      S("Listening", ["Form and Note Completion", "Multiple Choice", "Map and Diagram Labelling"]),
      S("Reading", ["True False Not Given", "Matching Headings", "Summary Completion", "Multiple Choice"]),
      S("Writing", ["Task 1 Graph or Letter", "Task 2 Essay"]),
      S("Speaking", ["Part 1 Interview", "Part 2 Cue Card", "Part 3 Discussion"]),
    ],
    links: [{ label: "IELTS official preparation", url: "https://ielts.org" }],
  },
  "Campus Placements": {
    sections: [
      S("Aptitude", ["Quantitative", "Logical Reasoning", "Verbal"]),
      S("Coding", ["Arrays and Strings", "Linked List Stack Queue", "Trees and Graphs", "Recursion and DP", "Sorting and Searching"]),
      S("CS Fundamentals", ["Operating Systems", "DBMS", "Computer Networks", "OOP"]),
      S("Interview", ["HR Questions", "Projects and Resume", "Puzzles"]),
    ],
    links: [],
  },
  // These two have no fixed syllabus, so the student adds their own subjects.
  "University Finals": { custom: true, sections: [], links: [] },
  "Other": { custom: true, sections: [], links: [] },
};

export const EXAM_NAMES = Object.keys(EXAMS);
export const getExam = (name) => EXAMS[name] || EXAMS["Other"];
export const isCustom = (name) => !!getExam(name).custom;
export const linksOf = (name) => getExam(name).links || [];

// Sections for an exam. Custom exams use the student's own subject list, shown as one group.
export function sectionsOf(name, custom = {}) {
  const e = getExam(name);
  return e.custom ? [{ name: "My subjects", topics: custom[name] || [] }] : e.sections;
}
// Flat topic list used by pickers (planner, timer, memory, ask). Never empty, so selects always work.
export const topicsOf = (name, custom = {}) => {
  const list = sectionsOf(name, custom).flatMap((s) => s.topics);
  return list.length ? list : ["General"];
};

export const GOALS = [
  { id: "rank", title: "Get a top rank", note: "Competitive exam with a fixed date" },
  { id: "grades", title: "Improve my grades", note: "Semester exams and coursework" },
  { id: "job", title: "Crack interviews", note: "Placements and technical rounds" },
  { id: "learn", title: "Learn something new", note: "No exam, just steady progress" },
];
