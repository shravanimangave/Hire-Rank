export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  recommendation: "shortlist" | "maybe" | "reject";
  skills: { name: string; score: number }[];
  strengths: string[];
  missingSkills: string[];
  risks: string[];
  experience: number;
  education: string;
  aiExplanation: string;
  confidence: number;
  radarData: { category: string; value: number }[];
}

export const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    role: "Senior Frontend Engineer",
    score: 92,
    recommendation: "shortlist",
    skills: [
      { name: "React", score: 95 },
      { name: "TypeScript", score: 90 },
      { name: "System Design", score: 85 },
      { name: "Leadership", score: 88 },
      { name: "Communication", score: 92 },
    ],
    strengths: ["React Expert", "Team Leadership", "System Design", "Mentoring"],
    missingSkills: ["GraphQL", "Rust"],
    risks: ["May require higher compensation"],
    experience: 8,
    education: "M.S. Computer Science, Stanford",
    aiExplanation: "Sarah demonstrates exceptional frontend expertise with 8 years of progressive experience. Her leadership background at two high-growth startups positions her well for a senior role. Strong cultural fit indicators from her collaborative project history.",
    confidence: 94,
    radarData: [
      { category: "Technical", value: 93 },
      { category: "Experience", value: 90 },
      { category: "Leadership", value: 88 },
      { category: "Culture Fit", value: 85 },
      { category: "Communication", value: 92 },
      { category: "Problem Solving", value: 89 },
    ],
  },
  {
    id: "2",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    role: "Full Stack Developer",
    score: 78,
    recommendation: "shortlist",
    skills: [
      { name: "Node.js", score: 88 },
      { name: "React", score: 82 },
      { name: "PostgreSQL", score: 75 },
      { name: "AWS", score: 70 },
      { name: "Python", score: 65 },
    ],
    strengths: ["Full Stack", "API Design", "Cloud Infrastructure"],
    missingSkills: ["Kubernetes", "CI/CD Pipelines", "TypeScript"],
    risks: ["Limited team lead experience", "Short tenure at last company"],
    experience: 5,
    education: "B.S. Software Engineering, MIT",
    aiExplanation: "Marcus brings solid full-stack capabilities with strong backend focus. His API design skills are above average. Some gaps in DevOps and infrastructure could be addressed with onboarding.",
    confidence: 82,
    radarData: [
      { category: "Technical", value: 80 },
      { category: "Experience", value: 72 },
      { category: "Leadership", value: 60 },
      { category: "Culture Fit", value: 78 },
      { category: "Communication", value: 75 },
      { category: "Problem Solving", value: 82 },
    ],
  },
  {
    id: "3",
    name: "Priya Patel",
    email: "priya.p@email.com",
    role: "Backend Engineer",
    score: 65,
    recommendation: "maybe",
    skills: [
      { name: "Java", score: 78 },
      { name: "Spring Boot", score: 72 },
      { name: "MongoDB", score: 60 },
      { name: "Docker", score: 55 },
      { name: "REST APIs", score: 80 },
    ],
    strengths: ["Java Expertise", "API Development", "Testing"],
    missingSkills: ["React", "TypeScript", "Cloud Services", "Microservices"],
    risks: ["No frontend experience", "Limited cloud exposure"],
    experience: 3,
    education: "B.Tech Computer Science, IIT Delhi",
    aiExplanation: "Priya has strong Java fundamentals but lacks the frontend and cloud experience required for this role. She could grow into the position with mentorship but may need 3-6 months of ramp-up time.",
    confidence: 71,
    radarData: [
      { category: "Technical", value: 68 },
      { category: "Experience", value: 55 },
      { category: "Leadership", value: 45 },
      { category: "Culture Fit", value: 72 },
      { category: "Communication", value: 65 },
      { category: "Problem Solving", value: 70 },
    ],
  },
  {
    id: "4",
    name: "Alex Rivera",
    email: "alex.r@email.com",
    role: "Junior Developer",
    score: 42,
    recommendation: "reject",
    skills: [
      { name: "HTML/CSS", score: 70 },
      { name: "JavaScript", score: 50 },
      { name: "React", score: 35 },
      { name: "Git", score: 45 },
      { name: "SQL", score: 30 },
    ],
    strengths: ["Eager to Learn", "Design Sense"],
    missingSkills: ["TypeScript", "Node.js", "Testing", "System Design", "Cloud"],
    risks: ["Very junior", "No production experience", "Significant skills gap"],
    experience: 1,
    education: "Bootcamp Graduate, General Assembly",
    aiExplanation: "Alex shows potential but lacks the technical depth required for this senior-level position. The skills gap is too significant for the current team's capacity to mentor. Would be better suited for a junior role.",
    confidence: 88,
    radarData: [
      { category: "Technical", value: 40 },
      { category: "Experience", value: 25 },
      { category: "Leadership", value: 20 },
      { category: "Culture Fit", value: 65 },
      { category: "Communication", value: 55 },
      { category: "Problem Solving", value: 45 },
    ],
  },
  {
    id: "5",
    name: "Emma Larsson",
    email: "emma.l@email.com",
    role: "Senior Full Stack Engineer",
    score: 85,
    recommendation: "shortlist",
    skills: [
      { name: "React", score: 88 },
      { name: "Node.js", score: 85 },
      { name: "TypeScript", score: 90 },
      { name: "AWS", score: 78 },
      { name: "PostgreSQL", score: 82 },
    ],
    strengths: ["TypeScript Expert", "Full Stack", "Agile", "Code Review"],
    missingSkills: ["Machine Learning"],
    risks: ["Relocating from Europe"],
    experience: 7,
    education: "M.S. Computer Science, KTH Stockholm",
    aiExplanation: "Emma is an excellent full-stack candidate with deep TypeScript knowledge and broad cloud experience. Her relocation timeline may affect start date but her technical profile is a strong match.",
    confidence: 90,
    radarData: [
      { category: "Technical", value: 88 },
      { category: "Experience", value: 85 },
      { category: "Leadership", value: 75 },
      { category: "Culture Fit", value: 80 },
      { category: "Communication", value: 85 },
      { category: "Problem Solving", value: 87 },
    ],
  },
];

