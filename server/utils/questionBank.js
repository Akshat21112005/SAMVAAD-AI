const buildQuestion = (id, question, expectedKeyPoints, followUpQuestions = []) => ({
  id,
  question,
  expectedKeyPoints,
  followUpQuestions,
});

export const QUESTION_BANK = {
  hr: [
    buildQuestion(
      "hr-1",
      "Tell me about yourself and how your recent work prepared you for this role.",
      ["Clear narrative", "Relevant experience", "Why this role makes sense"],
      ["What do you want the interviewer to remember most?", "What part of your background is most transferable?"]
    ),
    buildQuestion(
      "hr-2",
      "Describe a time you disagreed with a teammate. How did you handle it?",
      ["Conflict resolution", "Respectful communication", "Concrete outcome"],
      ["What would you do differently now?"]
    ),
    buildQuestion(
      "hr-3",
      "What kind of work environment helps you perform at your best?",
      ["Self-awareness", "Collaboration preferences", "Healthy expectations"],
      ["How do you adapt when the environment changes?"]
    ),
    buildQuestion(
      "hr-4",
      "Why do you want to join this company right now?",
      ["Company motivation", "Role alignment", "Specificity"],
      ["What would make you stay long term?"]
    ),
    buildQuestion(
      "hr-5",
      "Tell me about a project you are proud of.",
      ["Ownership", "Impact", "Metrics or evidence"],
      ["What tradeoff did you make?"]
    ),
    buildQuestion(
      "hr-6",
      "Describe a failure or setback and what you learned from it.",
      ["Honesty", "Reflection", "Growth"],
      ["How did that change your process?"]
    ),
    buildQuestion(
      "hr-7",
      "How do you prioritize when several urgent tasks arrive at once?",
      ["Prioritization logic", "Communication", "Decision-making"],
      ["How do you protect quality under pressure?"]
    ),
    buildQuestion(
      "hr-8",
      "What feedback have you received repeatedly, and how have you responded to it?",
      ["Coachability", "Action taken", "Self-awareness"],
      ["What feedback are you still working on?"]
    ),
    buildQuestion(
      "hr-9",
      "Describe a time you led without formal authority.",
      ["Influence", "Initiative", "Team outcome"],
      ["How did you earn trust?"]
    ),
    buildQuestion(
      "hr-10",
      "How do you stay motivated when progress feels slow?",
      ["Resilience", "Habits", "Practical examples"],
      ["How do you avoid burnout?"]
    ),
    buildQuestion(
      "hr-11",
      "What are your top strengths for this role?",
      ["Role fit", "Evidence", "Specific examples"],
      ["Which strength are you investing in most right now?"]
    ),
    buildQuestion(
      "hr-12",
      "Where do you see your career in the next three years?",
      ["Direction", "Realism", "Alignment with role"],
      ["What would success look like after year one?"]
    ),
  ],
  tech: [
    buildQuestion(
      "tech-1",
      "Explain the difference between horizontal and vertical scaling with a real production example.",
      ["Definitions", "Tradeoffs", "Example architecture"],
      ["When would you prefer one over the other?"]
    ),
    buildQuestion(
      "tech-2",
      "How would you design an API that is easy to evolve without breaking consumers?",
      ["Versioning", "Contracts", "Backward compatibility"],
      ["What would you log and monitor?"]
    ),
    buildQuestion(
      "tech-3",
      "What happens from typing a URL in the browser to seeing a page render?",
      ["DNS", "TCP/TLS", "HTTP", "Rendering"],
      ["Where does caching show up in the path?"]
    ),
    buildQuestion(
      "tech-4",
      "How do indexing strategies affect database read and write performance?",
      ["Index basics", "Tradeoffs", "Examples"],
      ["How would you debug a slow query?"]
    ),
    buildQuestion(
      "tech-5",
      "What are race conditions and how do you prevent them in distributed systems?",
      ["Definition", "Locking/idempotency", "Consistency"],
      ["What if low latency matters more than strict ordering?"]
    ),
    buildQuestion(
      "tech-6",
      "Explain eventual consistency in plain language and where it is acceptable.",
      ["Definition", "Tradeoff", "Use case"],
      ["When is eventual consistency a bad idea?"]
    ),
    buildQuestion(
      "tech-7",
      "How would you debug a memory leak in a web application?",
      ["Profiling", "Reproduction", "Root cause isolation"],
      ["How would you prevent regressions?"]
    ),
    buildQuestion(
      "tech-8",
      "Describe the CAP theorem and how it influences architecture decisions.",
      ["C/A/P", "Tradeoffs", "Examples"],
      ["What does this mean for user experience?"]
    ),
    buildQuestion(
      "tech-9",
      "How do you choose between SQL and NoSQL for a new product?",
      ["Data model", "Scale patterns", "Consistency needs"],
      ["How might your choice change over time?"]
    ),
    buildQuestion(
      "tech-10",
      "What are the most important qualities of maintainable code?",
      ["Readability", "Testability", "Changeability"],
      ["How do teams enforce these qualities?"]
    ),
    buildQuestion(
      "tech-11",
      "Explain caching strategies you have used and the bugs they introduced.",
      ["Cache-aside/write-through", "Invalidation", "Lessons"],
      ["How did you detect stale data?"]
    ),
    buildQuestion(
      "tech-12",
      "What metrics would you monitor for a backend service after a new release?",
      ["Latency", "Errors", "Traffic", "Saturation"],
      ["How would you structure rollback decisions?"]
    ),
  ],
  "system-design": [
    buildQuestion(
      "sd-1",
      "Design a URL shortener that supports analytics and high availability.",
      ["Core components", "Storage", "Scaling", "Analytics"],
      ["How would you prevent collisions?"]
    ),
    buildQuestion(
      "sd-2",
      "Design a chat system for one-to-one and group messaging.",
      ["Realtime transport", "Storage", "Presence", "Ordering"],
      ["How would offline delivery work?"]
    ),
    buildQuestion(
      "sd-3",
      "Design an interview practice platform like SAMVAAD-AI.",
      ["Services", "Data flows", "AI usage", "Scalability"],
      ["Where would you isolate expensive workloads?"]
    ),
    buildQuestion(
      "sd-4",
      "Design a rate limiting service used by many microservices.",
      ["Algorithms", "Storage", "Distributed coordination"],
      ["How do you keep it low latency?"]
    ),
    buildQuestion(
      "sd-5",
      "Design a file upload system for large video content.",
      ["Multipart upload", "Retries", "CDN", "Security"],
      ["How would you scan uploads safely?"]
    ),
    buildQuestion(
      "sd-6",
      "Design a leaderboard service for millions of users.",
      ["Ranking model", "Storage", "Caching", "Freshness"],
      ["How would you support per-region rankings?"]
    ),
    buildQuestion(
      "sd-7",
      "Design a notification system for email, SMS, and in-app alerts.",
      ["Fan-out", "Preferences", "Retries", "Observability"],
      ["How would you prevent noisy duplicates?"]
    ),
    buildQuestion(
      "sd-8",
      "Design an online code execution service for interviews.",
      ["Sandboxing", "Queues", "Isolation", "Limits"],
      ["How would you defend against abuse?"]
    ),
    buildQuestion(
      "sd-9",
      "Design a recommendation service for curated interview resources.",
      ["Signals", "Personalization", "Cold start"],
      ["How would you measure quality?"]
    ),
    buildQuestion(
      "sd-10",
      "Design a search system for large technical documentation.",
      ["Indexing", "Ranking", "Freshness", "Filters"],
      ["How would semantic search fit in?"]
    ),
    buildQuestion(
      "sd-11",
      "Design a scheduling system for mock interviews across time zones.",
      ["Time zones", "Availability", "Conflict handling"],
      ["How would reminders be delivered reliably?"]
    ),
    buildQuestion(
      "sd-12",
      "Design a metrics pipeline for product, infra, and AI evaluation data.",
      ["Ingestion", "Storage", "Aggregation", "Dashboards"],
      ["How do you balance cost and retention?"]
    ),
  ],
  behavioural: [
    buildQuestion(
      "beh-1",
      "Tell me about a time you had to earn trust quickly.",
      ["Context", "Actions", "Outcome"],
      ["What signal told you trust was growing?"]
    ),
    buildQuestion(
      "beh-2",
      "Describe a time you made a decision with incomplete information.",
      ["Judgment", "Tradeoffs", "Risk management"],
      ["How did you communicate uncertainty?"]
    ),
    buildQuestion(
      "beh-3",
      "Tell me about a time you raised the quality bar for a team.",
      ["Standards", "Influence", "Impact"],
      ["How did you avoid slowing delivery too much?"]
    ),
    buildQuestion(
      "beh-4",
      "Describe a time you had to say no to a request from a stakeholder.",
      ["Prioritization", "Communication", "Relationship management"],
      ["What alternative did you offer?"]
    ),
    buildQuestion(
      "beh-5",
      "Tell me about a moment you had to learn something new under pressure.",
      ["Learning strategy", "Execution", "Outcome"],
      ["What would you prepare earlier next time?"]
    ),
    buildQuestion(
      "beh-6",
      "Describe a time you improved a process that frustrated people.",
      ["Problem framing", "Initiative", "Measured improvement"],
      ["How did you win adoption?"]
    ),
    buildQuestion(
      "beh-7",
      "Tell me about a time you took ownership beyond your formal role.",
      ["Ownership", "Initiative", "Cross-team collaboration"],
      ["What made you step in?"]
    ),
    buildQuestion(
      "beh-8",
      "Describe a difficult bug or incident and how you handled the pressure.",
      ["Calm under stress", "Diagnosis", "Postmortem mindset"],
      ["What did you change afterward?"]
    ),
    buildQuestion(
      "beh-9",
      "Tell me about a time you advocated for the user when it was inconvenient.",
      ["Customer focus", "Tradeoffs", "Influence"],
      ["How did you justify the extra effort?"]
    ),
    buildQuestion(
      "beh-10",
      "Describe a time you had to rebuild momentum after a project stalled.",
      ["Leadership", "Execution", "Communication"],
      ["How did you reset expectations?"]
    ),
    buildQuestion(
      "beh-11",
      "Tell me about a time you received tough feedback from someone senior.",
      ["Humility", "Response", "Improvement"],
      ["How did the relationship change after that?"]
    ),
    buildQuestion(
      "beh-12",
      "Describe a time you helped a teammate succeed even when it was not your priority.",
      ["Collaboration", "Empathy", "Team impact"],
      ["How did you balance your own deadlines?"]
    ),
  ],
  aptitude: [
    buildQuestion(
      "apt-1",
      "What is a deadlock? Name one necessary condition and one prevention strategy.",
      ["Definition", "Conditions or prevention", "Example"],
      ["How does ordering locks help?"]
    ),
    buildQuestion(
      "apt-2",
      "Explain ACID properties of a database transaction in one sentence each.",
      ["Atomicity", "Consistency", "Isolation", "Durability"],
      ["Which property is most often relaxed in NoSQL?"]
    ),
    buildQuestion(
      "apt-3",
      "Difference between TCP and UDP — when would you choose each?",
      ["Reliability vs speed", "Use cases"],
      ["Where does QUIC fit conceptually?"]
    ),
    buildQuestion(
      "apt-4",
      "What is normalization? Why might you denormalize on purpose?",
      ["1NF–3NF basics", "Read vs write tradeoff"],
      ["Give a concrete analytics example"]
    ),
    buildQuestion(
      "apt-5",
      "Describe polymorphism and give an example in OOP.",
      ["Definition", "Runtime vs compile-time", "Example"],
      ["How does it help testing?"]
    ),
    buildQuestion(
      "apt-6",
      "If a sorted array is rotated, how can you find the minimum in better than O(n)?",
      ["Binary search idea", "Invariant"],
      ["What if duplicates exist?"]
    ),
    buildQuestion(
      "apt-7",
      "What is virtual memory and why do operating systems use paging?",
      ["Abstraction", "Paging vs fragmentation", "TLB mention"],
      ["What is thrashing?"]
    ),
    buildQuestion(
      "apt-8",
      "Explain HTTP vs HTTPS at a high level.",
      ["TLS role", "Certificates", "Threat model"],
      ["What does HSTS do?"]
    ),
    buildQuestion(
      "apt-9",
      "You have 9 balls, one heavier. Minimum weighings on a balance scale?",
      ["Information theory / divide", "Answer reasoning"],
      ["Generalize to N balls"]
    ),
    buildQuestion(
      "apt-10",
      "What is a race condition? How do mutexes and semaphores differ?",
      ["Definition", "Primitives", "Example"],
      ["When is a lock too coarse?"]
    ),
    buildQuestion(
      "apt-11",
      "Big-O: compare O(n log n) vs O(n²) for n = 10⁶ — rough intuition.",
      ["Scaling", "Constants vs asymptotics"],
      ["When does cache locality dominate?"]
    ),
    buildQuestion(
      "apt-12",
      "SOLID: pick two principles and explain with a short example.",
      ["Named principles", "Concrete example"],
      ["Which principle is most violated in legacy codebases?"]
    ),
  ],
};
