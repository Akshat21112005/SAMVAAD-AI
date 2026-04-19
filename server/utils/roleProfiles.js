import { QUESTION_BANK } from "./questionBank.js";

const ROLE_PROFILES = [
  {
    key: "frontend",
    matchers: ["frontend", "front-end", "react", "ui", "ux", "web developer"],
    techThemes: [
      "component architecture",
      "state management",
      "performance optimization",
      "accessibility",
      "rendering lifecycle",
      "design systems",
      "browser debugging",
      "API integration on the client",
    ],
    dsaTopics: ["strings", "arrays", "stack", "sliding-window", "hashmap"],
  },
  {
    key: "backend",
    matchers: ["backend", "back-end", "api", "node", "java developer", "server"],
    techThemes: [
      "API design",
      "database indexing",
      "caching",
      "concurrency",
      "observability",
      "distributed systems tradeoffs",
      "authentication and authorization",
      "failure handling",
    ],
    dsaTopics: ["hashmap", "graphs", "heap", "intervals", "sorting", "design"],
  },
  {
    key: "full-stack",
    matchers: ["full stack", "full-stack", "mern", "mean"],
    techThemes: [
      "end-to-end architecture",
      "API contracts",
      "frontend-backend coordination",
      "data consistency",
      "performance bottlenecks across the stack",
      "deployment workflows",
      "authentication flows",
      "product tradeoffs",
    ],
    dsaTopics: ["arrays", "hashmap", "graphs", "sorting", "strings", "design"],
  },
  {
    key: "data-science",
    matchers: ["data scientist", "ml", "machine learning", "ai engineer"],
    techThemes: [
      "feature engineering",
      "model evaluation",
      "experiment design",
      "data leakage prevention",
      "training-serving skew",
      "model monitoring",
      "data preprocessing pipelines",
      "tradeoffs between accuracy and latency",
    ],
    dsaTopics: ["arrays", "sorting", "heap", "dynamic-programming", "graphs"],
  },
  {
    key: "data-engineering",
    matchers: ["data engineer", "analytics engineer", "etl", "pipeline"],
    techThemes: [
      "batch versus streaming",
      "data modeling",
      "schema evolution",
      "orchestration",
      "partitioning",
      "late-arriving data",
      "data quality checks",
      "warehouse performance",
    ],
    dsaTopics: ["heap", "sorting", "graphs", "hashmap", "intervals"],
  },
  {
    key: "devops",
    matchers: ["devops", "sre", "site reliability", "cloud", "platform engineer"],
    techThemes: [
      "incident response",
      "infrastructure as code",
      "deployment reliability",
      "monitoring and alerting",
      "capacity planning",
      "network debugging",
      "resilience engineering",
      "cost-performance tradeoffs",
    ],
    dsaTopics: ["graphs", "heap", "intervals", "design", "arrays"],
  },
  {
    key: "mobile",
    matchers: ["android", "ios", "mobile", "flutter", "react native"],
    techThemes: [
      "offline-first behavior",
      "battery and performance constraints",
      "mobile app architecture",
      "network retries",
      "local persistence",
      "crash debugging",
      "release pipelines",
      "responsive UI behavior",
    ],
    dsaTopics: ["arrays", "dynamic-programming", "strings", "trees", "hashmap"],
  },
  {
    key: "qa",
    matchers: ["qa", "test engineer", "quality assurance", "sdet", "automation engineer"],
    techThemes: [
      "test strategy",
      "automation architecture",
      "flaky test diagnosis",
      "regression prevention",
      "API and UI test coverage",
      "performance testing",
      "risk-based prioritization",
      "release confidence metrics",
    ],
    dsaTopics: ["strings", "arrays", "stack", "hashmap", "sorting"],
  },
  {
    key: "security",
    matchers: ["security", "cyber", "appsec", "security engineer"],
    techThemes: [
      "threat modeling",
      "secure coding",
      "identity and access management",
      "incident handling",
      "vulnerability assessment",
      "logging and detection",
      "defense in depth",
      "secrets management",
    ],
    dsaTopics: ["strings", "graphs", "hashmap", "sorting", "arrays"],
  },
  {
    key: "product",
    matchers: ["product manager", "product", "pm"],
    techThemes: [
      "requirements quality",
      "tradeoff decisions",
      "metrics definition",
      "stakeholder alignment",
      "delivery risk management",
      "prioritization frameworks",
      "feedback loops",
      "technical decision communication",
    ],
    dsaTopics: ["arrays", "sorting", "hashmap"],
  },
  {
    key: "software-engineer",
    matchers: ["software", "sde", "engineer", "developer"],
    techThemes: [
      "APIs and contracts",
      "debugging strategy",
      "data modeling",
      "scalability tradeoffs",
      "testing strategy",
      "system performance",
      "clean code and maintainability",
      "production incident diagnosis",
    ],
    dsaTopics: ["arrays", "hashmap", "graphs", "heap", "strings", "dynamic-programming"],
  },
];

const GENERIC_PROFILE = {
  key: "generic",
  techThemes: [
    "problem solving in your domain",
    "architecture tradeoffs",
    "debugging strategy",
    "collaboration with cross-functional teams",
    "quality and testing",
    "performance tuning",
    "production readiness",
    "decision-making under constraints",
  ],
  dsaTopics: ["arrays", "hashmap", "strings", "sorting", "graphs"],
};

export function resolveRoleProfile(jobRole = "Software Engineer") {
  const normalized = String(jobRole || "")
    .toLowerCase()
    .replace(/[^a-z0-9+\-/#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return { ...GENERIC_PROFILE, displayRole: "Software Engineer" };
  }

  const matched =
    ROLE_PROFILES.find((profile) =>
      profile.matchers.some((matcher) => normalized.includes(matcher))
    ) || GENERIC_PROFILE;

  return {
    ...matched,
    displayRole: jobRole,
  };
}

export function buildRoleAwareTechBank(jobRole = "Software Engineer") {
  const profile = resolveRoleProfile(jobRole);
  const themes = profile.techThemes.slice(0, 8);

  const templates = [
    (theme) =>
      `How would you approach ${theme} in a ${profile.displayRole} role?`,
    (theme) =>
      `What tradeoffs matter most when handling ${theme} as a ${profile.displayRole}?`,
    (theme) =>
      `Describe a real debugging or design workflow you would use for ${theme} in this role.`,
    (theme) =>
      `What mistakes do teams commonly make around ${theme}, and how would you prevent them?`,
    (theme) =>
      `How would you measure success and reliability for ${theme} in a ${profile.displayRole} environment?`,
  ];

  return themes.flatMap((theme, themeIndex) =>
    templates.map((template, templateIndex) => ({
      id: `tech-${profile.key}-${themeIndex + 1}-${templateIndex + 1}`,
      question: template(theme),
      expectedKeyPoints: [
        `Role-specific understanding of ${theme}`,
        "Tradeoff awareness",
        "Concrete engineering examples",
      ],
      followUpQuestions: [
        `What would change about your answer if scale or complexity doubled around ${theme}?`,
      ],
    }))
  );
}

const ROLE_FOUNDATIONS = {
  frontend: [
    "browser rendering and performance",
    "state management tradeoffs",
    "accessibility and semantics",
    "client-side caching",
    "web security basics",
  ],
  backend: [
    "API contracts and versioning",
    "database indexing and query performance",
    "caching and consistency",
    "concurrency control",
    "authentication and authorization",
  ],
  "full-stack": [
    "API contracts across frontend and backend",
    "data consistency across the stack",
    "deployment and rollback flows",
    "observability for user journeys",
    "end-to-end performance",
  ],
  "data-science": [
    "model evaluation and validation",
    "feature engineering",
    "data leakage prevention",
    "latency versus accuracy tradeoffs",
    "monitoring model drift",
  ],
  "data-engineering": [
    "batch versus streaming pipelines",
    "data quality guarantees",
    "partitioning and file layout",
    "schema evolution",
    "orchestration and retries",
  ],
  devops: [
    "incident response",
    "infrastructure as code",
    "observability and alerting",
    "deployment safety",
    "capacity planning",
  ],
  mobile: [
    "offline-first behavior",
    "battery and memory constraints",
    "network retries and sync",
    "app lifecycle management",
    "mobile release workflows",
  ],
  qa: [
    "test pyramid tradeoffs",
    "flaky test diagnosis",
    "API versus UI automation",
    "risk-based test planning",
    "release confidence metrics",
  ],
  security: [
    "secure coding practices",
    "identity and access control",
    "threat modeling",
    "vulnerability management",
    "logging and detection",
  ],
  product: [
    "requirement quality",
    "prioritization tradeoffs",
    "metrics design",
    "stakeholder alignment",
    "delivery risk management",
  ],
  "software-engineer": [
    "system performance",
    "clean code",
    "testing strategy",
    "debugging workflows",
    "scalability tradeoffs",
  ],
  generic: [
    "problem solving in your domain",
    "debugging under uncertainty",
    "quality and testing",
    "performance tradeoffs",
    "production readiness",
  ],
};

const ROLE_SYSTEMS = {
  frontend: [
    "a design system platform for multiple products",
    "a frontend observability dashboard for web vitals",
    "a component preview and release workflow",
    "a CMS-driven personalized landing page system",
  ],
  backend: [
    "a multi-tenant API platform",
    "a high-volume event ingestion service",
    "a distributed rate limiting platform",
    "a resilient background job processing system",
  ],
  "full-stack": [
    "an end-to-end collaboration product",
    "a dashboard product with realtime updates",
    "a customer support platform across web and API",
    "a feature-flag driven SaaS application",
  ],
  "data-science": [
    "an experimentation platform for model variants",
    "a real-time model inference service",
    "a feature store with online and offline access",
    "a monitoring system for model drift and quality",
  ],
  "data-engineering": [
    "a streaming analytics pipeline",
    "a warehouse ingestion and transformation platform",
    "a data quality and lineage service",
    "a backfill-safe ETL orchestration system",
  ],
  devops: [
    "a deployment platform with progressive rollout support",
    "a centralized observability stack",
    "a secrets and configuration management service",
    "a self-service internal platform for engineering teams",
  ],
  mobile: [
    "an offline-capable messaging app backend and sync flow",
    "a mobile release and crash-monitoring pipeline",
    "a push notification delivery system",
    "a content sync architecture for unreliable networks",
  ],
  qa: [
    "a test automation platform for product teams",
    "a release quality gate system",
    "a flaky-test detection and quarantine service",
    "a cross-browser and device test infrastructure",
  ],
  security: [
    "a secrets rotation platform",
    "an application security scanning pipeline",
    "an identity and access review system",
    "a threat-detection event processing system",
  ],
  product: [
    "a decision-support analytics platform",
    "a metrics pipeline for product health",
    "a roadmap prioritization workflow system",
    "a customer feedback synthesis platform",
  ],
  "software-engineer": [
    "a scalable collaboration platform",
    "a code execution service for interviews",
    "a notification and workflow system",
    "a multi-region content delivery platform",
  ],
  generic: [
    "a workflow platform for your domain",
    "an observability and reporting system",
    "a collaboration platform with scale constraints",
    "a quality and monitoring pipeline",
  ],
};

function getRoleFoundationTopics(profile) {
  return ROLE_FOUNDATIONS[profile.key] || ROLE_FOUNDATIONS.generic;
}

function getRoleSystemScenarios(profile) {
  return ROLE_SYSTEMS[profile.key] || ROLE_SYSTEMS.generic;
}

function adaptQuestionToRole(question, profile, mode) {
  const base = String(question || "").replace(/this role/gi, profile.displayRole);

  if (base.toLowerCase().includes(profile.displayRole.toLowerCase())) return base;

  if (mode === "hr") {
    return `${base.replace(/\?$/, "")} in the context of a ${profile.displayRole} position?`;
  }
  if (mode === "behavioural") {
    return `${base.replace(/\?$/, "")} while working as a ${profile.displayRole}?`;
  }
  return `${base.replace(/\?$/, "")} for a ${profile.displayRole} role?`;
}

function buildRoleAwareHrBank(jobRole = "Software Engineer") {
  const profile = resolveRoleProfile(jobRole);
  return (QUESTION_BANK.hr || []).map((item, index) => ({
    ...item,
    id: `hr-${profile.key}-${index + 1}`,
    question: adaptQuestionToRole(item.question, profile, "hr"),
    expectedKeyPoints: [
      ...item.expectedKeyPoints,
      `Evidence relevant to a ${profile.displayRole} role`,
    ],
  }));
}

function buildRoleAwareBehaviouralBank(jobRole = "Software Engineer") {
  const profile = resolveRoleProfile(jobRole);
  return (QUESTION_BANK.behavioural || []).map((item, index) => ({
    ...item,
    id: `beh-${profile.key}-${index + 1}`,
    question: adaptQuestionToRole(item.question, profile, "behavioural"),
    expectedKeyPoints: [
      ...item.expectedKeyPoints,
      `Role-relevant stakeholder or project context for ${profile.displayRole}`,
    ],
  }));
}

function buildRoleAwareAptitudeBank(jobRole = "Software Engineer") {
  const profile = resolveRoleProfile(jobRole);
  const topics = getRoleFoundationTopics(profile);

  const templates = [
    (topic) => `What are the most important fundamentals behind ${topic} for a ${profile.displayRole}?`,
    (topic) => `What common failure modes appear in ${topic}, and how would you prevent them in this role?`,
    (topic) => `How would you explain the tradeoffs in ${topic} to another ${profile.displayRole} interviewer?`,
  ];

  return topics.flatMap((topic, topicIndex) =>
    templates.map((template, templateIndex) => ({
      id: `apt-${profile.key}-${topicIndex + 1}-${templateIndex + 1}`,
      question: template(topic),
      expectedKeyPoints: [
        `Correct fundamentals for ${topic}`,
        "Tradeoff awareness",
        `Role-specific application for ${profile.displayRole}`,
      ],
      followUpQuestions: [
        `What metric or signal would tell you ${topic} is becoming a problem in production?`,
      ],
    }))
  );
}

function buildRoleAwareSystemDesignBank(jobRole = "Software Engineer") {
  const profile = resolveRoleProfile(jobRole);
  const scenarios = getRoleSystemScenarios(profile);

  return scenarios.flatMap((scenario, index) => [
    {
      id: `sd-${profile.key}-${index + 1}-1`,
      question: `Design ${scenario} for a ${profile.displayRole} team.`,
      expectedKeyPoints: ["Core components", "Scaling", "Failure handling", "Role-specific tradeoffs"],
      followUpQuestions: [`What would be the hardest operational risk in ${scenario}?`],
    },
    {
      id: `sd-${profile.key}-${index + 1}-2`,
      question: `How would you make ${scenario} observable, safe to evolve, and cost-aware for a ${profile.displayRole} organization?`,
      expectedKeyPoints: ["Observability", "Reliability", "Cost control", "Evolution strategy"],
      followUpQuestions: [`What would you build first and what would you defer?`],
    },
  ]);
}

export function buildRoleAwareInterviewBank(interviewType, jobRole = "Software Engineer") {
  if (interviewType === "tech") return buildRoleAwareTechBank(jobRole);
  if (interviewType === "hr") return buildRoleAwareHrBank(jobRole);
  if (interviewType === "behavioural") return buildRoleAwareBehaviouralBank(jobRole);
  if (interviewType === "aptitude") return buildRoleAwareAptitudeBank(jobRole);
  if (interviewType === "system-design") return buildRoleAwareSystemDesignBank(jobRole);
  return QUESTION_BANK[interviewType] || QUESTION_BANK.hr;
}
