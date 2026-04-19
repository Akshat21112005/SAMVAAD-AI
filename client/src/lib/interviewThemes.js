export const INTERVIEW_THEME_MAP = {
  dsa: {
    id: "dsa",
    label: "DSA Arena",
    eyebrow: "Code + reasoning round",
    accent: "#ff7a18",
    accentSoft: "#ffb36a",
    glow: "rgba(255, 122, 24, 0.24)",
    border: "rgba(255, 160, 93, 0.26)",
    interviewerName: "Judge Loop",
    interviewerRole: "Algorithm interviewer",
    briefing:
      "Ship a working solution, explain the approach clearly, and make tradeoffs visible.",
    scoreFocus: ["Correctness", "Complexity", "Edge cases", "Communication"],
    roomNotes: [
      "Hidden tests validate actual behavior before AI review.",
      "Clean reasoning matters even when the code passes.",
      "Use samples to sanity-check assumptions before submitting.",
    ],
  },
  hr: {
    id: "hr",
    label: "HR Story Round",
    eyebrow: "People + motivation round",
    accent: "#2ec27e",
    accentSoft: "#8be0b1",
    glow: "rgba(46, 194, 126, 0.22)",
    border: "rgba(96, 226, 160, 0.24)",
    interviewerName: "Aarohi",
    interviewerRole: "People operations interviewer",
    briefing:
      "Use concrete stories, real ownership, and clear impact instead of generic claims.",
    scoreFocus: ["Clarity", "Ownership", "Self-awareness", "Impact"],
    roomNotes: [
      "Favor STAR structure without sounding memorized.",
      "Use measurable outcomes when you can.",
      "Show how you think, not just what happened.",
    ],
  },
  tech: {
    id: "tech",
    label: "Technical Concepts",
    eyebrow: "Concept + tradeoff round",
    accent: "#ff9f43",
    accentSoft: "#ffd08a",
    glow: "rgba(255, 159, 67, 0.24)",
    border: "rgba(255, 184, 110, 0.24)",
    interviewerName: "Raghav",
    interviewerRole: "Senior engineering interviewer",
    briefing:
      "Demonstrate depth, compare options, and explain why one approach fits better.",
    scoreFocus: ["Depth", "Tradeoffs", "Accuracy", "Examples"],
    roomNotes: [
      "Start with fundamentals before jumping into advanced details.",
      "Tradeoffs usually matter more than definitions.",
      "Use real systems or bugs you have seen when possible.",
    ],
  },
  "system-design": {
    id: "system-design",
    label: "System Design",
    eyebrow: "Architecture + scale round",
    accent: "#24b9ff",
    accentSoft: "#8ad9ff",
    glow: "rgba(36, 185, 255, 0.24)",
    border: "rgba(110, 216, 255, 0.24)",
    interviewerName: "Meera",
    interviewerRole: "Staff systems interviewer",
    briefing:
      "Frame the system, prioritize components, and justify scale, resilience, and cost choices.",
    scoreFocus: ["Scope framing", "Scalability", "Reliability", "Tradeoffs"],
    roomNotes: [
      "Clarify assumptions before committing to an architecture.",
      "Move from API and data model to scaling and failure modes.",
      "Say what you would defer in version one.",
    ],
  },
  behavioural: {
    id: "behavioural",
    label: "Behavioural Deep Dive",
    eyebrow: "Leadership + judgment round",
    accent: "#ff5fa2",
    accentSoft: "#ff9dc4",
    glow: "rgba(255, 95, 162, 0.22)",
    border: "rgba(255, 142, 192, 0.24)",
    interviewerName: "Naina",
    interviewerRole: "Leadership assessor",
    briefing:
      "Tell grounded stories that surface decision-making, collaboration, and learning.",
    scoreFocus: ["Decision quality", "Influence", "Reflection", "Results"],
    roomNotes: [
      "Avoid vague team language when you owned a decision.",
      "Show tension, not just the happy path.",
      "Reflection is strongest when it changes your next action.",
    ],
  },
  aptitude: {
    id: "aptitude",
    label: "Aptitude & Core CS",
    eyebrow: "Reasoning + fundamentals round",
    accent: "#9a6cff",
    accentSoft: "#c4a8ff",
    glow: "rgba(154, 108, 255, 0.23)",
    border: "rgba(184, 152, 255, 0.24)",
    interviewerName: "Dev",
    interviewerRole: "Assessment facilitator",
    briefing:
      "Balance speed with precision and keep your reasoning legible under time pressure.",
    scoreFocus: ["Reasoning", "Accuracy", "Recall", "Pacing"],
    roomNotes: [
      "Short structured answers often outperform long unfocused ones.",
      "Name the concept first, then apply it.",
      "Manage pace so the final questions still get attention.",
    ],
  },
};

export function getInterviewTheme(typeId) {
  return INTERVIEW_THEME_MAP[typeId] || INTERVIEW_THEME_MAP.hr;
}
