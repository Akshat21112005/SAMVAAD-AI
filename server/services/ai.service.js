import { createHash } from "crypto";
import InterviewSession from "../models/session.model.js";
import User from "../models/user.model.js";
import { GFG_CURATED_PROBLEMS } from "../utils/gfgCurated.js";
import { fetchRandomCodeforcesProblem } from "./codeforces.service.js";
import { PROMPTS } from "../utils/prompts.js";
import { DSA_TEST_SPECS } from "../utils/dsaTestSpecs.js";
import { invokeLlmText } from "./llm.service.js";
import { getExpandedProblemPool } from "../utils/problemCatalog.js";
import { buildRoleAwareInterviewBank, resolveRoleProfile } from "../utils/roleProfiles.js";
import {
  analyzeCodeQuality,
  scoreComplexity,
  scoreTimeManagement,
} from "../utils/dsaRubric.js";
import { createLogger, previewText } from "../utils/logger.js";

const ALL_PROBLEMS = getExpandedProblemPool();
const logger = createLogger("ai-service");
const ENABLE_EXTERNAL_ROLE_SEARCH =
  String(process.env.ENABLE_EXTERNAL_ROLE_SEARCH || "false").toLowerCase() === "true";
const ENABLE_LLM_INTRO_SUMMARY =
  String(process.env.ENABLE_LLM_INTRO_SUMMARY || "false").toLowerCase() === "true";
const ENABLE_LLM_NEXT_QUESTION =
  String(process.env.ENABLE_LLM_NEXT_QUESTION || "false").toLowerCase() === "true";

const sanitizeText = (value = "", maxLength = 50_000) =>
  String(value)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const stableHash = (value) =>
  createHash("sha1").update(String(value || "")).digest("hex");

const cloneValue = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const createMemoCache = ({ ttlMs, maxEntries = 250 }) => {
  const store = new Map();
  const inFlight = new Map();

  const prune = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (!entry || entry.expiresAt <= now) {
        store.delete(key);
      }
    }

    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value;
      if (!oldestKey) break;
      store.delete(oldestKey);
    }
  };

  return {
    async getOrCompute(key, factory) {
      prune();

      const cached = store.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cloneValue(cached.value);
      }

      if (inFlight.has(key)) {
        return cloneValue(await inFlight.get(key));
      }

      const promise = Promise.resolve(factory())
        .then((value) => {
          store.set(key, {
            value: cloneValue(value),
            expiresAt: Date.now() + ttlMs,
          });
          return value;
        })
        .finally(() => {
          inFlight.delete(key);
        });

      inFlight.set(key, promise);
      return cloneValue(await promise);
    },
  };
};

const roleResearchCache = createMemoCache({
  ttlMs: Number(process.env.ROLE_RESEARCH_CACHE_TTL_MS || 30 * 60 * 1000),
  maxEntries: Number(process.env.ROLE_RESEARCH_CACHE_MAX || 200),
});

const questionBundleCache = createMemoCache({
  ttlMs: Number(process.env.QUESTION_POOL_CACHE_TTL_MS || 15 * 60 * 1000),
  maxEntries: Number(process.env.QUESTION_POOL_CACHE_MAX || 200),
});

const introSummaryCache = createMemoCache({
  ttlMs: Number(process.env.INTRO_SUMMARY_CACHE_TTL_MS || 60 * 60 * 1000),
  maxEntries: Number(process.env.INTRO_SUMMARY_CACHE_MAX || 500),
});

const parseModelJson = (text) => {
  if (!text) return null;
  const trimmed = String(text).trim();
  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (blockMatch ? blockMatch[1] : trimmed).trim();
  try {
    return JSON.parse(raw);
  } catch {
    try {
      const loose = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      return loose ? JSON.parse(loose[1]) : null;
    } catch {
      return null;
    }
  }
};

const callLlm = async ({ system, prompt, maxTokens = 1500 }) => {
  try {
    return await invokeLlmText({ system, prompt, maxTokens });
  } catch {
    return null;
  }
};

const buildRoleResearchCacheKey = ({ interviewType, difficulty, jobRole }) =>
  `${interviewType}:${difficulty}:${sanitizeText(jobRole, 160).toLowerCase()}`;

const buildQuestionBundleCacheKey = ({ interviewType, difficulty, jobRole, desiredPoolSize }) =>
  `${buildRoleResearchCacheKey({ interviewType, difficulty, jobRole })}:${Math.max(desiredPoolSize, 12)}`;

const sampleFrom = (items, count) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
};

const uniqueList = (items, max = 10) =>
  [...new Set((items || []).map((item) => sanitizeText(item, 240)).filter(Boolean))].slice(0, max);

const QUESTION_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "being",
  "between",
  "could",
  "explain",
  "their",
  "there",
  "these",
  "those",
  "under",
  "which",
  "while",
  "would",
  "your",
  "what",
  "when",
  "where",
  "have",
  "with",
  "from",
  "into",
  "this",
  "that",
  "them",
  "they",
  "role",
  "interview",
  "candidate",
  "tell",
  "describe",
  "walk",
  "through",
  "would",
  "should",
  "using",
  "used",
]);

const tokenizeQuestion = (value = "") =>
  sanitizeText(value, 500)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !QUESTION_STOPWORDS.has(token));

const questionFingerprint = (value = "") => tokenizeQuestion(value).join(" ");

const questionSimilarity = (left = "", right = "") => {
  const normalizedLeft = questionFingerprint(left);
  const normalizedRight = questionFingerprint(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const shorterLength = Math.min(normalizedLeft.length, normalizedRight.length);
  if (
    shorterLength >= 24 &&
    (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft))
  ) {
    return 0.96;
  }

  const leftTokens = new Set(normalizedLeft.split(" ").filter(Boolean));
  const rightTokens = new Set(normalizedRight.split(" ").filter(Boolean));
  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });

  return overlap / Math.max(1, Math.min(leftTokens.size, rightTokens.size));
};

export const areQuestionsTooSimilar = (left = "", right = "") =>
  questionSimilarity(left, right) >= 0.72;

const dedupeQuestionPool = (questions = [], minimumCount = 0, fallbackQuestions = []) => {
  const kept = [];

  const appendUniqueQuestions = (items = []) => {
    items.forEach((item) => {
      if (!item?.question) return;
      if (kept.some((existing) => areQuestionsTooSimilar(existing.question, item.question))) return;

      kept.push({
        ...item,
        followUpQuestions: uniqueList(
          (item.followUpQuestions || []).filter(
            (followUp) => !areQuestionsTooSimilar(followUp, item.question)
          ),
          2
        ),
      });
    });
  };

  appendUniqueQuestions(questions);
  if (kept.length < minimumCount) appendUniqueQuestions(fallbackQuestions);

  return kept;
};

const sampleWithWrap = (items, count) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length >= count) return sampleFrom(items, count);

  const selected = [...items];
  let cursor = 0;
  while (selected.length < count) {
    const base = items[cursor % items.length];
    selected.push({
      ...base,
      id: `${base.id || "q"}-alt-${cursor + 1}`,
      question: base.question,
      followUpQuestions: Array.isArray(base.followUpQuestions) ? [...base.followUpQuestions] : [],
    });
    cursor += 1;
  }
  return selected;
};

const computeWeightage = (difficulty, index) => {
  const baseMap = {
    easy: 7,
    medium: 10,
    hard: 13,
  };
  return Math.max(6, (baseMap[difficulty] || 10) + (index % 3) - 1);
};

const normalizeWeights = (questions) => {
  const total = questions.reduce((sum, question) => sum + question.weightage, 0) || 1;
  let normalizedTotal = 0;

  const normalized = questions.map((question, index) => {
    if (index === questions.length - 1) {
      const finalWeight = 100 - normalizedTotal;
      return { ...question, weightage: finalWeight };
    }

    const weightage = Math.max(6, Math.round((question.weightage / total) * 100));
    normalizedTotal += weightage;
    return { ...question, weightage };
  });

  const adjustedTotal = normalized.reduce((sum, question) => sum + question.weightage, 0);
  if (adjustedTotal !== 100 && normalized.length > 0) {
    normalized[normalized.length - 1].weightage += 100 - adjustedTotal;
  }
  return normalized;
};

const generateQuestionsLocally = (interviewType, difficulty, jobRole, count = 10) => {
  const bank = buildRoleAwareInterviewBank(interviewType, jobRole);
  const selected = sampleWithWrap(bank, count);

  return normalizeWeights(
    selected.map((question, index) => ({
      ...question,
      type: interviewType,
      difficulty,
      question: question.question.replace(/this role/gi, jobRole || "this role"),
      weightage: computeWeightage(difficulty, index),
      timeAllotted: Math.min(300, Math.max(90, 120 + index * 12)),
    }))
  );
};

const buildRolePromptHint = (jobRole) => {
  const profile = resolveRoleProfile(jobRole);
  return `The candidate is targeting the role "${profile.displayRole}". Focus on themes like ${profile.techThemes
    .slice(0, 5)
    .join(", ")}. Every question must clearly fit this role. Do not ask generic software-engineer questions unless they clearly fit the role.`;
};

const buildLocalRoleResearchContext = ({ interviewType, difficulty, jobRole }) => {
  const profile = resolveRoleProfile(jobRole);
  const focusAreas = uniqueList(profile.techThemes, 8);
  return {
    displayRole: profile.displayRole,
    profileKey: profile.key,
    interviewType,
    difficulty,
    summary: `Target role: ${profile.displayRole}. Focus the ${interviewType} interview on ${focusAreas
      .slice(0, 5)
      .join(", ")}.`,
    responsibilities: uniqueList(
      focusAreas.map((item) => `Own or reason about ${item} in a ${profile.displayRole} context.`),
      6
    ),
    skills: uniqueList([...focusAreas, ...(profile.dsaTopics || [])], 8),
    focusAreas,
    evaluationSignals: uniqueList(
      [
        "Role relevance",
        "Depth of reasoning",
        "Tradeoff awareness",
        "Concrete examples",
        "Communication clarity",
      ],
      6
    ),
    searchInsights: [],
    searchProvider: "local",
  };
};

const fetchJson = async (url, options = {}, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      logger.warn("fetch_json:non_ok", {
        url,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return null;
    }
    const json = await response.json();
    logger.debug("fetch_json:success", {
      url,
      durationMs: Date.now() - startedAt,
    });
    return json;
  } catch (error) {
    logger.warn("fetch_json:failed", {
      url,
      durationMs: Date.now() - startedAt,
      error: error?.message || error,
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const fetchBraveRoleSearch = async (jobRole) => {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent(`${jobRole} role responsibilities skills interview expectations`);
  const data = await fetchJson(`https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  const results = data?.web?.results || [];
  return results.slice(0, 5).map((item) =>
    sanitizeText(`${item.title || ""}: ${item.description || ""}`, 280)
  );
};

const fetchTavilyRoleSearch = async (jobRole) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const data = await fetchJson("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${jobRole} role responsibilities skills interview expectations`,
      topic: "general",
      search_depth: "basic",
      max_results: 5,
      include_raw_content: false,
    }),
  });

  const results = Array.isArray(data?.results) ? data.results : [];
  const insights = uniqueList(
    results.map((item) =>
      sanitizeText(
        `${item.title || item.url || "Search result"}: ${
          item.content || item.snippet || item.raw_content || ""
        }`,
        280
      )
    ),
    5
  );
  logger.info("role_search:tavily", {
    jobRole,
    resultCount: insights.length,
  });
  return insights;
};

const fetchSerpApiRoleSearch = async (jobRole) => {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const query = encodeURIComponent(`${jobRole} responsibilities skills interview`);
  const data = await fetchJson(
    `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${apiKey}&num=5`
  );

  const results = data?.organic_results || [];
  const insights = results.slice(0, 5).map((item) =>
    sanitizeText(`${item.title || ""}: ${item.snippet || ""}`, 280)
  );
  logger.info("role_search:serpapi", {
    jobRole,
    resultCount: insights.length,
  });
  return insights;
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fetchDuckDuckGoRoleSearch = async (jobRole) => {
  const query = encodeURIComponent(`${jobRole} role responsibilities skills interview expectations`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) return [];
    const html = await response.text();
    const results = [];
    const regex =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>)([\s\S]*?)(?:<\/a>|<\/div>)/gi;

    let match;
    while ((match = regex.exec(html)) && results.length < 5) {
      const title = stripHtml(match[1]);
      const snippet = stripHtml(match[2]);
      const combined = sanitizeText(`${title}: ${snippet}`, 280);
      if (combined) results.push(combined);
    }

    const insights = uniqueList(results, 5);
    logger.info("role_search:duckduckgo", {
      jobRole,
      resultCount: insights.length,
    });
    return insights;
  } catch (error) {
    logger.warn("role_search:duckduckgo_failed", {
      jobRole,
      error: error?.message || error,
    });
    return [];
  } finally {
    clearTimeout(timer);
  }
};

const fetchRoleSearchInsights = async (jobRole) => {
  if (!ENABLE_EXTERNAL_ROLE_SEARCH) {
    return {
      insights: [],
      provider: "local",
    };
  }

  logger.info("role_search:start", { jobRole });
  const tavily = await fetchTavilyRoleSearch(jobRole);
  if (tavily.length > 0) {
    return {
      insights: tavily,
      provider: "tavily",
    };
  }

  const brave = await fetchBraveRoleSearch(jobRole);
  if (brave.length > 0) {
    return {
      insights: brave,
      provider: "brave",
    };
  }

  const serp = await fetchSerpApiRoleSearch(jobRole);
  if (serp.length > 0) {
    return {
      insights: serp,
      provider: "serpapi",
    };
  }

  const duckduckgo = await fetchDuckDuckGoRoleSearch(jobRole);
  if (duckduckgo.length > 0) {
    return {
      insights: duckduckgo,
      provider: "duckduckgo",
    };
  }

  return {
    insights: [],
    provider: "local",
  };
};

const buildRoleResearchContext = async ({ interviewType, difficulty, jobRole }) => {
  const cacheKey = buildRoleResearchCacheKey({ interviewType, difficulty, jobRole });

  return roleResearchCache.getOrCompute(cacheKey, async () => {
    const local = buildLocalRoleResearchContext({ interviewType, difficulty, jobRole });
    const { insights, provider } = await fetchRoleSearchInsights(jobRole);
    const searchInsights = uniqueList(insights, 6);
    logger.info("role_research:context_built", {
      interviewType,
      difficulty,
      jobRole,
      searchProvider: provider,
      searchInsightCount: searchInsights.length,
      externalSearchEnabled: ENABLE_EXTERNAL_ROLE_SEARCH,
    });

    const prompt = `ROLE: ${jobRole}
INTERVIEW TYPE: ${interviewType}
DIFFICULTY: ${difficulty}
LOCAL ROLE THEMES: ${(local.focusAreas || []).join(", ")}
LOCAL RESPONSIBILITIES: ${(local.responsibilities || []).join(" | ")}
OPTIONAL SEARCH INSIGHTS:
${searchInsights.length > 0 ? searchInsights.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None available"}

Return a JSON object only.`;

    const text = await callLlm({
      system: PROMPTS.ROLE_RESEARCH_SYSTEM,
      prompt,
      maxTokens: 1400,
    });

    const parsed = parseModelJson(text);
    if (!parsed || typeof parsed !== "object") {
      return {
        ...local,
        searchInsights,
        searchProvider: provider,
      };
    }

    return {
      ...local,
      summary: sanitizeText(parsed.summary || local.summary, 600),
      responsibilities: uniqueList(parsed.responsibilities || local.responsibilities, 8),
      skills: uniqueList(parsed.skills || local.skills, 8),
      focusAreas: uniqueList(parsed.focusAreas || local.focusAreas, 8),
      evaluationSignals: uniqueList(parsed.evaluationSignals || local.evaluationSignals, 8),
      searchInsights: uniqueList(parsed.searchInsights || searchInsights, 6),
      searchProvider: provider,
    };
  });
};

const sanitizeQuestionItem = (item, fallback, interviewType, difficulty, jobRole, index) => ({
  id: sanitizeText(item?.id || fallback?.id || `${interviewType}-${index + 1}`, 80),
  question: sanitizeText(
    isQuestionRoleAware(item?.question, jobRole)
      ? item.question
      : fallback?.question || item?.question || "",
    1000
  ),
  type: interviewType,
  difficulty: item?.difficulty || fallback?.difficulty || difficulty,
  weightage: Number(item?.weightage) || fallback?.weightage || computeWeightage(difficulty, index),
  expectedKeyPoints: uniqueList(item?.expectedKeyPoints || fallback?.expectedKeyPoints || [], 6),
  timeAllotted: Number(item?.timeAllotted) || fallback?.timeAllotted || 150,
  followUpQuestions: uniqueList(item?.followUpQuestions || fallback?.followUpQuestions || [], 2),
});

const buildQuestionPoolAgent = async ({ interviewType, difficulty, jobRole, roleResearch }) => {
  const localPool = generateQuestionsLocally(interviewType, difficulty, jobRole, 18);
  logger.info("question_pool:start", {
    interviewType,
    difficulty,
    jobRole,
    localPoolSize: localPool.length,
    searchProvider: roleResearch?.searchProvider,
  });
  const prompt = `ROLE BRIEF SUMMARY: ${roleResearch.summary}
ROLE RESPONSIBILITIES: ${(roleResearch.responsibilities || []).join(" | ")}
ROLE SKILLS: ${(roleResearch.skills || []).join(" | ")}
ROLE FOCUS AREAS: ${(roleResearch.focusAreas || []).join(" | ")}
SEARCH INSIGHTS: ${(roleResearch.searchInsights || []).join(" | ") || "None"}
INTERVIEW TYPE: ${interviewType}
DIFFICULTY: ${difficulty}
TARGET ROLE: ${jobRole}

Generate 18 role-specific candidate questions as JSON only.`;

  const text = await callLlm({
    system: PROMPTS.QUESTION_POOL_SYSTEM,
    prompt,
    maxTokens: 3200,
  });
  const parsed = parseModelJson(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    logger.warn("question_pool:llm_fallback_local", {
      interviewType,
      difficulty,
      jobRole,
    });
    return localPool;
  }

  const merged = parsed.slice(0, 18).map((item, index) =>
    sanitizeQuestionItem(item, localPool[index], interviewType, difficulty, jobRole, index)
  );
  const deduped = dedupeQuestionPool(merged, 12, localPool).slice(0, 18);
  logger.info("question_pool:generated", {
    interviewType,
    difficulty,
    jobRole,
    llmCount: parsed.length,
    finalCount: deduped.length,
  });
  return deduped.length >= 10 ? deduped : localPool;
};

const buildFollowupAgent = async ({ questionPool, roleResearch, jobRole }) => {
  const fallbackMap = new Map(
    questionPool.map((item) => [
      item.id,
      uniqueList(item.followUpQuestions || [], 2),
    ])
  );

  const prompt = `TARGET ROLE: ${jobRole}
ROLE SUMMARY: ${roleResearch.summary}
QUESTION POOL:
${questionPool
  .map((item) => `- ${item.id}: ${item.question}`)
  .join("\n")}

Return follow-ups as JSON only.`;

  const text = await callLlm({
    system: PROMPTS.FOLLOWUP_SYSTEM,
    prompt,
    maxTokens: 2600,
  });
  const parsed = parseModelJson(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    logger.warn("followups:llm_fallback_local", {
      jobRole,
      questionPoolSize: questionPool.length,
    });
    return questionPool;
  }

  const followupMap = new Map(
    parsed.map((item) => [item?.id, uniqueList(item?.followUpQuestions || [], 2)])
  );

  const withFollowups = questionPool.map((item) => ({
    ...item,
    followUpQuestions: uniqueList(
      (
        followupMap.get(item.id)?.length > 0
          ? followupMap.get(item.id)
          : fallbackMap.get(item.id) || []
      ).filter((followUp) => !areQuestionsTooSimilar(followUp, item.question)),
      2
    ),
  }));
  logger.info("followups:generated", {
    jobRole,
    questionPoolSize: questionPool.length,
  });
  return withFollowups;
};

const buildOrderAgent = async ({ questionPool, interviewType, difficulty, jobRole, roleResearch }) => {
  const fallbackOrder = normalizeWeights(
    dedupeQuestionPool(questionPool, 10)
      .slice(0, 10)
      .map((item, index) => ({
      ...item,
      weightage: computeWeightage(difficulty, index),
      timeAllotted: Math.min(300, Math.max(90, 120 + index * 12)),
      }))
  );

  const prompt = `TARGET ROLE: ${jobRole}
INTERVIEW TYPE: ${interviewType}
DIFFICULTY: ${difficulty}
ROLE SUMMARY: ${roleResearch.summary}
QUESTION POOL:
${questionPool
  .map((item) => `- ${item.id}: ${item.question}`)
  .join("\n")}

Choose and order the best 10 questions as JSON only.`;

  const text = await callLlm({
    system: PROMPTS.QUESTION_ORDER_SYSTEM,
    prompt,
    maxTokens: 2200,
  });
  const parsed = parseModelJson(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    logger.warn("question_order:llm_fallback_local", {
      interviewType,
      difficulty,
      jobRole,
    });
    return fallbackOrder;
  }

  const byId = new Map(questionPool.map((item) => [item.id, item]));
  const ordered = parsed
    .slice(0, 10)
    .map((item, index) => {
      const base = byId.get(item?.id);
      if (!base) return null;
      return {
        ...base,
        weightage: Number(item?.weightage) || computeWeightage(difficulty, index),
        timeAllotted: Number(item?.timeAllotted) || Math.min(300, Math.max(90, 120 + index * 12)),
      };
    })
    .filter(Boolean);

  const dedupedOrdered = dedupeQuestionPool(ordered, 10, fallbackOrder).slice(0, 10);
  logger.info("question_order:selected", {
    interviewType,
    difficulty,
    jobRole,
    finalCount: dedupedOrdered.length,
  });
  return dedupedOrdered.length === 10 ? normalizeWeights(dedupedOrdered) : fallbackOrder;
};

const extractKeywordSet = (value = "") =>
  new Set(
    sanitizeText(value, 1000)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4)
  );

const countSharedKeywords = (sourceText = "", targetText = "") => {
  const source = extractKeywordSet(sourceText);
  const target = extractKeywordSet(targetText);
  let count = 0;
  source.forEach((token) => {
    if (target.has(token)) count += 1;
  });
  return count;
};

const buildIntroSummaryLocally = ({ candidateName, answer, jobRole }) => {
  const cleaned = sanitizeText(answer, 1600);
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ").slice(0, 320);
  const keywords = [...extractKeywordSet(cleaned)].slice(0, 8);
  return {
    summary:
      summary ||
      `${candidateName || "The candidate"} introduced themselves for the ${jobRole} interview.`,
    experienceSignals: keywords.slice(0, 4),
    strengthSignals: keywords.slice(4, 7),
    riskSignals: [],
    followupHooks: keywords.slice(0, 5),
  };
};

export const summarizeIntroMemory = async ({ candidateName, answer, jobRole }) => {
  const local = buildIntroSummaryLocally({ candidateName, answer, jobRole });
  if (!ENABLE_LLM_INTRO_SUMMARY) {
    return local;
  }

  const cacheKey = stableHash(`${candidateName}|${jobRole}|${sanitizeText(answer, 2400)}`);
  return introSummaryCache.getOrCompute(cacheKey, async () => {
    const prompt = `CANDIDATE NAME: ${candidateName || "Candidate"}
TARGET ROLE: ${jobRole}
INTRODUCTION:
${sanitizeText(answer, 2200)}

Return strict JSON only.`;

    const text = await callLlm({
      system: PROMPTS.INTRO_SUMMARY_SYSTEM,
      prompt,
      maxTokens: 900,
    });
    const parsed = parseModelJson(text);
    if (!parsed || typeof parsed !== "object") return local;

    return {
      summary: sanitizeText(parsed.summary || local.summary, 320),
      experienceSignals: uniqueList(parsed.experienceSignals || local.experienceSignals, 6),
      strengthSignals: uniqueList(parsed.strengthSignals || local.strengthSignals, 6),
      riskSignals: uniqueList(parsed.riskSignals || local.riskSignals, 6),
      followupHooks: uniqueList(parsed.followupHooks || local.followupHooks, 6),
    };
  });
};

const buildQuestionSelectionHeuristic = ({
  questionPool,
  askedQuestionIds = [],
  askedQuestions = [],
  memory = {},
  roleResearch = {},
  evaluations = {},
  currentQuestionIndex = 0,
  difficulty = "medium",
}) => {
  const asked = new Set(askedQuestionIds);
  const previousEvaluations = Object.values(evaluations || {});
  const averageScore =
    previousEvaluations.length > 0
      ? previousEvaluations.reduce((sum, item) => sum + (Number(item?.percentageScore) || 0), 0) /
        previousEvaluations.length
      : 72;
  const gapSignals = uniqueList([
    ...(memory?.pendingFocusAreas || []),
    ...previousEvaluations.flatMap((item) => item?.missedPoints || []),
    ...(roleResearch?.focusAreas || []),
  ]);
  const introSignals = uniqueList([
    memory?.introSummary || "",
    ...(memory?.introSignals?.followupHooks || []),
    ...(memory?.introSignals?.experienceSignals || []),
  ]);
  const askedQuestionTexts = uniqueList([
    ...(questionPool || []).filter((item) => asked.has(item.id)).map((item) => item.question),
    ...(askedQuestions || []).map((item) => item?.question || ""),
  ], 30);
  const askedQuestionsText = askedQuestionTexts.join(" ");

  const scored = (questionPool || [])
    .filter(
      (item) =>
        !asked.has(item.id) &&
        !askedQuestionTexts.some((askedQuestion) => areQuestionsTooSimilar(item.question, askedQuestion))
    )
    .map((question, index) => {
      let score = Math.random();
      score += countSharedKeywords(question.question, gapSignals.join(" ")) * 1.3;
      score += countSharedKeywords(question.question, introSignals.join(" ")) * 0.8;
      score -= countSharedKeywords(question.question, askedQuestionsText) * 0.7;

      if (currentQuestionIndex <= 1) {
        if (/tell me|describe|prepared you|approach/i.test(question.question)) score += 2;
      } else if (averageScore < 65) {
        if (/debug|mistakes|prevent|tradeoff|failure|risk/i.test(question.question)) score += 2;
      } else if (currentQuestionIndex >= 5) {
        if (/scale|design|evolve|reliability|observability|tradeoff/i.test(question.question)) score += 2;
      }

      if (difficulty === "hard" && /design|tradeoff|scal|consisten|distributed/i.test(question.question)) {
        score += 1.2;
      }

      score += Math.max(0, 1 - index * 0.02);

      return {
        question,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.question);
};

export const chooseNextInterviewQuestion = async ({
  questionPool,
  askedQuestionIds = [],
  askedQuestions = [],
  memory = {},
  roleResearch = {},
  evaluations = {},
  currentQuestionIndex = 0,
  difficulty = "medium",
  jobRole = "Software Engineer",
}) => {
  const heuristic = buildQuestionSelectionHeuristic({
    questionPool,
    askedQuestionIds,
    askedQuestions,
    memory,
    roleResearch,
    evaluations,
    currentQuestionIndex,
    difficulty,
  });

  const shortlist = heuristic.slice(0, 6);
  if (shortlist.length === 0) {
    logger.warn("next_question:no_shortlist", {
      currentQuestionIndex,
      jobRole,
    });
    return null;
  }

  if (!ENABLE_LLM_NEXT_QUESTION) {
    logger.info("next_question:selected_by_heuristic", {
      currentQuestionIndex,
      jobRole,
      selectedQuestionId: shortlist[0]?.id,
      selectedQuestionPreview: previewText(shortlist[0]?.question || "", 220),
      llmSelectionEnabled: false,
    });
    return {
      question: shortlist[0],
      reason: "Selected by heuristic coverage of role gaps and prior answers.",
      focus: uniqueList(memory?.pendingFocusAreas || roleResearch?.focusAreas || [], 4),
    };
  }

  const prompt = `TARGET ROLE: ${jobRole}
CURRENT QUESTION INDEX: ${currentQuestionIndex + 1}
INTRO SUMMARY: ${memory?.introSummary || "None"}
INTRO SIGNALS: ${(memory?.introSignals?.followupHooks || []).join(" | ") || "None"}
PENDING FOCUS AREAS: ${(memory?.pendingFocusAreas || []).join(" | ") || "None"}
RECENT EVALUATIONS:
${Object.entries(evaluations || {})
  .slice(-4)
  .map(([id, item]) => `- ${id}: ${item?.percentageScore || 0}% | missed: ${(item?.missedPoints || []).join(", ") || "none"}`)
  .join("\n") || "None"}

SHORTLIST:
${shortlist.map((item) => `- ${item.id}: ${item.question}`).join("\n")}

Return strict JSON only.`;

  const text = await callLlm({
    system: PROMPTS.NEXT_QUESTION_SYSTEM,
    prompt,
    maxTokens: 700,
  });
  const parsed = parseModelJson(text);
  if (parsed?.id) {
    const selected = shortlist.find((item) => item.id === parsed.id);
    if (selected) {
      logger.info("next_question:selected_by_llm", {
        currentQuestionIndex,
        jobRole,
        selectedQuestionId: selected.id,
        selectedQuestionPreview: previewText(selected.question, 220),
        reason: parsed.reason || "",
      });
      return {
        question: selected,
        reason: sanitizeText(parsed.reason || "", 240),
        focus: uniqueList(parsed.focus || [], 4),
      };
    }
  }

  logger.info("next_question:selected_by_heuristic", {
    currentQuestionIndex,
    jobRole,
    selectedQuestionId: shortlist[0]?.id,
    selectedQuestionPreview: previewText(shortlist[0]?.question || "", 220),
    llmSelectionEnabled: true,
  });
  return {
    question: shortlist[0],
    reason: "Selected by heuristic coverage of role gaps and prior answers.",
    focus: uniqueList(memory?.pendingFocusAreas || roleResearch?.focusAreas || [], 4),
  };
};

const isQuestionRoleAware = (question, jobRole) => {
  const profile = resolveRoleProfile(jobRole);
  const normalized = String(question || "").toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(profile.displayRole.toLowerCase())) return true;
  return profile.techThemes.some((theme) =>
    theme
      .toLowerCase()
      .split(/\s+/)
      .some((token) => token.length > 4 && normalized.includes(token))
  );
};

const keywordCoverage = (answer, expectedKeyPoints = []) => {
  const lowerAnswer = answer.toLowerCase();
  return expectedKeyPoints.filter((point) =>
    point
      .toLowerCase()
      .split(/\s+/)
      .some((token) => token.length > 3 && lowerAnswer.includes(token))
  );
};

const classifySentiment = (percentageScore) => {
  if (percentageScore >= 75) return "positive";
  if (percentageScore >= 45) return "neutral";
  return "negative";
};

const buildIdealAnswer = (question, expectedKeyPoints) =>
  `A strong answer to "${question}" should clearly cover ${expectedKeyPoints
    .slice(0, 3)
    .join(", ")}, connect them to a practical example, and close with the impact or decision made.`;

const evaluateAnswerLocally = ({
  question,
  answer,
  interviewType,
  jobRole,
  questionWeightage,
  expectedKeyPoints = [],
}) => {
  const cleanedAnswer = sanitizeText(answer, 6000);
  const covered = keywordCoverage(cleanedAnswer, expectedKeyPoints);
  const wordCount = cleanedAnswer.split(/\s+/).filter(Boolean).length;
  const depthBonus = Math.min(20, Math.floor(wordCount / 12));
  const coverageScore = expectedKeyPoints.length
    ? Math.round((covered.length / expectedKeyPoints.length) * 55)
    : 35;
  const structureScore =
    cleanedAnswer.includes("because") || cleanedAnswer.includes("for example") ? 15 : 8;
  const clarityScore = cleanedAnswer.length > 80 ? 10 : 4;
  const percentageScore = Math.min(100, coverageScore + depthBonus + structureScore + clarityScore);
  const score = Math.max(
    0,
    Math.min(questionWeightage, Math.round((percentageScore / 100) * questionWeightage))
  );
  const missedPoints = expectedKeyPoints.filter((point) => !covered.includes(point));

  return {
    score,
    percentageScore,
    sentiment: classifySentiment(percentageScore),
    keyStrengths:
      covered.length > 0
        ? covered.slice(0, 3).map((point) => `You addressed ${point.toLowerCase()} well.`)
        : ["You attempted the question directly."],
    missedPoints:
      missedPoints.length > 0
        ? missedPoints.slice(0, 3)
        : ["You covered the major points expected for this question."],
    detailedFeedback:
      percentageScore >= 75
        ? "This answer is clear, relevant, and reasonably complete. It would be even stronger with one sharper example or metric."
        : percentageScore >= 45
          ? "This answer shows the right direction, but some important details are still missing. Add clearer structure and a more concrete example."
          : "This answer needs more depth and structure. Start with the core idea, support it with an example, and explain the outcome more clearly.",
    suggestedIdealAnswer: buildIdealAnswer(question, expectedKeyPoints),
    voiceScript:
      percentageScore >= 75
        ? "Strong answer overall. You covered the important ideas and sounded credible. To push it further, add one crisp example with measurable impact."
        : percentageScore >= 45
          ? "Decent foundation here. The main idea is visible, but your answer would be stronger with tighter structure and one concrete example."
          : "There is a starting point here, but the answer feels too thin. Focus on the core point first, then add details, an example, and the final result.",
    interviewType,
    roleContext: jobRole,
    followUpQuestion: null,
  };
};

const detectComplexity = (code) => {
  const normalized = code.toLowerCase();
  const loopMatches = (normalized.match(/for\s*\(|while\s*\(/g) || []).length;
  if (normalized.includes("sort(") || normalized.includes(".sort")) return "O(n log n)";
  if (normalized.includes("heap") || normalized.includes("priority_queue")) return "O(n log k)";
  if (loopMatches >= 2) return "O(n^2)";
  return "O(n)";
};

const detectSpaceComplexity = (code) => {
  const normalized = code.toLowerCase();
  if (
    normalized.includes("map") ||
    normalized.includes("set") ||
    normalized.includes("vector") ||
    normalized.includes("array")
  ) {
    return "O(n)";
  }
  return "O(1)";
};

const summarizeTestRun = (testRun) => {
  if (!testRun || testRun.skipped) return "Automated tests not run for this language or problem.";
  if (testRun.compileError) return "Code did not compile or the runner failed to execute.";
  const p = Number(testRun.passed) || 0;
  const t = Number(testRun.total) || 0;
  if (t <= 0) return "No public test harness.";
  return `${p}/${t} automated tests passed`;
};

const DSA_SCORE_BUCKETS = {
  correctness: 55,
  timeComplexity: 12,
  spaceComplexity: 8,
  codeQuality: 12,
  edgeCaseHandling: 8,
  timeManagement: 5,
};

const evaluateDsaLocally = ({ problem, code, language, testRun, timeUsed = 0, timedOut = false }) => {
  const cleanedCode = String(code || "").slice(0, 50_000);
  const hasCode = cleanedCode.trim().length > 0;
  const totalTests = testRun && !testRun.skipped ? Number(testRun.total) || 0 : 0;
  const passedTests = testRun && !testRun.skipped ? Number(testRun.passed) || 0 : 0;
  const hasAutomated = totalTests > 0 && !testRun?.skipped;
  const passRatio = hasAutomated ? passedTests / totalTests : 0;
  const problemHasHarness = Boolean(problem?.id) && (DSA_TEST_SPECS[problem.id]?.tests?.length ?? 0) > 0;
  const compileFailed = Boolean(testRun?.compileError);
  const noJudgeCoverage = !hasAutomated && !problemHasHarness;
  const quality = analyzeCodeQuality(cleanedCode, language);
  const detectedTimeComplexity = detectComplexity(cleanedCode);
  const detectedSpaceComplexity = detectSpaceComplexity(cleanedCode);

  let correctness = hasCode && hasAutomated ? Math.round(passRatio * DSA_SCORE_BUCKETS.correctness) : hasCode ? 6 : 0;
  let correctnessVerdict =
    hasAutomated && passRatio === 1
      ? "Accepted"
      : hasAutomated && passRatio > 0
        ? "Partial"
        : "Wrong Answer";
  let timeComplexityScore = hasCode
    ? scoreComplexity(problem?.idealTimeComplexity, detectedTimeComplexity, DSA_SCORE_BUCKETS.timeComplexity)
    : 0;
  let spaceComplexityScore = hasCode
    ? scoreComplexity(problem?.idealSpaceComplexity, detectedSpaceComplexity, DSA_SCORE_BUCKETS.spaceComplexity)
    : 0;
  let namingScore = hasCode ? Math.max(0, Math.min(7, quality.namingScore)) : 0;
  let codeQuality = hasCode
    ? Math.max(
        0,
        Math.min(DSA_SCORE_BUCKETS.codeQuality, Math.round(namingScore * 0.5) + quality.structureScore)
      )
    : 0;
  let edgeCaseHandling = hasCode
    ? Math.max(
        0,
        Math.min(
          DSA_SCORE_BUCKETS.edgeCaseHandling,
          Math.round((hasAutomated ? passRatio : 0.2) * 5) + quality.edgeCaseSignal
        )
      )
    : 0;
  let timeManagementScore = hasCode
    ? scoreTimeManagement({
        difficulty: problem?.difficulty || "medium",
        timeUsed,
        timedOut,
      })
    : 0;

  let totalScore =
    correctness +
    timeComplexityScore +
    spaceComplexityScore +
    codeQuality +
    edgeCaseHandling +
    timeManagementScore;

  const failedAllHidden = hasAutomated && totalTests > 0 && passedTests === 0;

  if (compileFailed && hasCode) {
    correctness = 0;
    correctnessVerdict = "Wrong Answer";
    timeComplexityScore = 0;
    spaceComplexityScore = 0;
    codeQuality = Math.min(4, codeQuality);
    namingScore = Math.min(2, namingScore);
    edgeCaseHandling = 0;
    timeManagementScore = Math.min(1, timeManagementScore);
    totalScore =
      correctness +
      timeComplexityScore +
      spaceComplexityScore +
      codeQuality +
      edgeCaseHandling +
      timeManagementScore;
  } else if (failedAllHidden) {
    correctness = 0;
    correctnessVerdict = "Wrong Answer";
    timeComplexityScore = 0;
    spaceComplexityScore = 0;
    codeQuality = Math.min(3, Math.floor(codeQuality / 2));
    namingScore = Math.min(2, namingScore);
    edgeCaseHandling = 0;
    timeManagementScore = Math.min(1, timeManagementScore);
    totalScore =
      correctness +
      timeComplexityScore +
      spaceComplexityScore +
      codeQuality +
      edgeCaseHandling +
      timeManagementScore;
  } else if (!hasAutomated && hasCode) {
    correctnessVerdict = "Wrong Answer";
    correctness = Math.min(10, correctness);
    timeComplexityScore = Math.min(4, timeComplexityScore);
    spaceComplexityScore = Math.min(4, spaceComplexityScore);
    codeQuality = Math.min(8, codeQuality);
    edgeCaseHandling = Math.min(3, edgeCaseHandling);
    timeManagementScore = Math.min(3, timeManagementScore);
    totalScore =
      correctness +
      timeComplexityScore +
      spaceComplexityScore +
      codeQuality +
      edgeCaseHandling +
      timeManagementScore;
  }

  if (!hasAutomated && hasCode) {
    if (totalScore >= 80) correctnessVerdict = "Accepted";
    else if (totalScore >= 55) correctnessVerdict = "Partial";
    else correctnessVerdict = "Wrong Answer";
  }

  if (hasAutomated && passedTests === totalTests && hasCode) {
    totalScore = Math.min(100, Math.max(totalScore, 72));
  }
  if (!hasCode) {
    correctnessVerdict = "Wrong Answer";
    totalScore = 0;
  }
  if (timedOut) {
    totalScore = Math.min(totalScore, 70);
  }
  if (noJudgeCoverage && hasCode) {
    totalScore = Math.min(totalScore, 34);
  }

  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  return {
    correctness,
    timeComplexityScore,
    spaceComplexityScore,
    codeQuality,
    edgeCaseHandling,
    timeManagementScore,
    namingScore,
    totalScore,
    detectedTimeComplexity,
    detectedSpaceComplexity,
    correctnessVerdict,
    testCaseSummary: summarizeTestRun(testRun),
    automatedTestsPassed: passedTests,
    automatedTestsTotal: totalTests,
    acceptedTestCases: passedTests,
    totalTestCases: totalTests,
    hasAutomatedJudge: hasAutomated,
    codeIssues: hasCode
      ? [
          compileFailed ? "Fix compile or syntax errors reported by the runner." : null,
          failedAllHidden
            ? "All hidden tests failed — a constant or trivial return is not a valid solution."
            : null,
          noJudgeCoverage
            ? "This problem did not have automated judge coverage, so correctness credit is intentionally capped."
            : null,
          timedOut ? "You ran out of time, so time-management marks were reduced." : null,
          ...quality.issues,
        ].filter(Boolean)
      : ["No meaningful implementation was submitted."],
    improvements: hasCode
      ? [
          passRatio < 1
            ? "Close the remaining hidden cases before optimizing for style."
            : "Keep the correct solution, then tighten readability and naming to push toward a top score.",
          scoreComplexity(
            problem?.idealTimeComplexity,
            detectedTimeComplexity,
            DSA_SCORE_BUCKETS.timeComplexity
          ) < DSA_SCORE_BUCKETS.timeComplexity
            ? `Aim for ${problem?.idealTimeComplexity || "a better time complexity"} instead of ${detectedTimeComplexity}.`
            : "State why the chosen time complexity is appropriate for the constraints.",
          quality.edgeCaseSignal < 3
            ? "Add explicit handling for empty inputs, one-element cases, duplicates, or boundary values."
            : "Mention the edge cases you already handled so the interviewer can follow your reasoning.",
        ].filter(Boolean)
      : ["Start with a correct working solution before worrying about optimizations."],
    optimalApproach:
      problem?.hints?.[0] || "Aim for a clean, optimal solution using the appropriate data structure for the problem.",
    detailedFeedback: hasCode
      ? `Your ${language || "selected"} solution scored ${totalScore}/100. ${summarizeTestRun(testRun)}. ${
          hasAutomated
            ? "Passing hidden tests is necessary, but code quality, complexity, edge handling, and time still affect the final score."
            : "This round had limited judge coverage, so correctness marks were intentionally capped."
        }`
      : "There is not enough code here to judge correctness. Start by outlining the approach and writing a minimal working version before optimizing.",
    voiceScript: hasCode
      ? passRatio === 1
        ? "The hidden tests are passing, which is a strong foundation. To reach a top-tier interview score, make the code cleaner, justify the complexity clearly, and show stronger attention to naming and edge cases."
        : "There is a real implementation here, but hidden tests still expose correctness gaps. Fix those first, then improve complexity discussion, naming, and edge-case handling."
      : "No substantial code was submitted, so the evaluation is limited. Focus on getting a basic working solution down first, then improve the algorithm and discuss tradeoffs.",
  };
};

const buildPerformanceTier = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
};

const generateSessionFeedbackLocally = (sessionData) => {
  const score = sessionData.totalScore || 0;
  const tier = buildPerformanceTier(score);
  const strengths = [];
  const improvements = [];

  if (sessionData.type === "dsa") {
    if (score >= 70) strengths.push("your solution direction was technically strong");
    strengths.push("you stayed focused on the algorithm instead of wandering");
    improvements.push("explain correctness and complexity more explicitly");
    improvements.push("cover tricky edge cases before submission");
  } else {
    const evaluations = Object.values(sessionData.evaluations || {});
    const highConfidence = evaluations.filter((item) => (item?.percentageScore || 0) >= 70).length;
    strengths.push(
      highConfidence >= 3
        ? "you gave several answers with strong clarity and confidence"
        : "you kept a clear thread through multiple answers"
    );
    strengths.push("your responses showed intent instead of sounding memorized");
    improvements.push("bring in more concrete examples and outcomes");
    improvements.push("structure answers with clearer opening, middle, and conclusion");
  }

  return `You finished this ${sessionData.type} interview in the ${tier.toLowerCase()} range with a score of ${score} out of 100. The strongest part of your performance was that ${strengths[0]}, and I also liked that ${strengths[1]}. The biggest gains now will come from how you ${improvements[0]}, and how you ${improvements[1]}. Keep practicing with timed sessions, because your foundation is visible and a little more polish will make your answers far more interview ready.`;
};

const buildQuestionBundle = async ({
  interviewType,
  difficulty = "medium",
  jobRole = "Software Engineer",
  desiredPoolSize = 18,
}) => {
  const localPool = generateQuestionsLocally(
    interviewType,
    difficulty,
    jobRole,
    Math.max(desiredPoolSize, 12)
  );

  try {
    const roleResearch = await buildRoleResearchContext({
      interviewType,
      difficulty,
      jobRole,
    });
    const questionPool = await buildQuestionPoolAgent({
      interviewType,
      difficulty,
      jobRole,
      roleResearch,
    });
    const withFollowUps = await buildFollowupAgent({
      questionPool,
      roleResearch,
      jobRole,
    });

    const mergedPool = dedupeQuestionPool(
      Array.isArray(withFollowUps) && withFollowUps.length > 0 ? withFollowUps : localPool,
      Math.max(desiredPoolSize, 12),
      localPool
    );

    return {
      roleResearch,
      questionPool: mergedPool.slice(0, Math.max(desiredPoolSize, 12)),
      metadata: {
        usedLlm: Array.isArray(withFollowUps) && withFollowUps.length > 0,
        usedSearch: Array.isArray(roleResearch?.searchInsights) && roleResearch.searchInsights.length > 0,
        searchProvider: roleResearch?.searchProvider || "local",
      },
      localPool,
    };
  } catch (error) {
    logger.error("build_pool:failed", {
      interviewType,
      difficulty,
      jobRole,
      error,
    });
    return {
      roleResearch: buildLocalRoleResearchContext({
        interviewType,
        difficulty,
        jobRole,
      }),
      questionPool: localPool,
      metadata: {
        usedLlm: false,
        usedSearch: false,
        searchProvider: "local",
      },
      localPool,
    };
  }
};

export const generateInterviewQuestions = async (interviewType, difficulty, jobRole) => {
  const localQuestions = generateQuestionsLocally(interviewType, difficulty, jobRole);
  logger.info("generate_questions:service_start", {
    interviewType,
    difficulty,
    jobRole,
    localCount: localQuestions.length,
  });
  try {
    const bundle = await questionBundleCache.getOrCompute(
      buildQuestionBundleCacheKey({
        interviewType,
        difficulty,
        jobRole,
        desiredPoolSize: 18,
      }),
      () =>
        buildQuestionBundle({
          interviewType,
          difficulty,
          jobRole,
          desiredPoolSize: 18,
        })
    );
    const orderedQuestions = await buildOrderAgent({
      questionPool: bundle.questionPool,
      interviewType,
      difficulty,
      jobRole,
      roleResearch: bundle.roleResearch,
    });

    const finalQuestions = orderedQuestions.length >= 10 ? orderedQuestions : localQuestions;
    logger.info("generate_questions:service_success", {
      interviewType,
      difficulty,
      jobRole,
      finalCount: finalQuestions.length,
    });
    return finalQuestions;
  } catch (error) {
    logger.error("generate_questions:service_failed", {
      interviewType,
      difficulty,
      jobRole,
      error,
    });
    return localQuestions;
  }
};

export const buildInterviewQuestionPool = async ({
  interviewType,
  difficulty = "medium",
  jobRole = "Software Engineer",
  desiredPoolSize = 18,
}) => {
  const localPool = generateQuestionsLocally(
    interviewType,
    difficulty,
    jobRole,
    Math.max(desiredPoolSize, 12)
  );
  logger.info("build_pool:start", {
    interviewType,
    difficulty,
    jobRole,
    desiredPoolSize,
    localPoolSize: localPool.length,
  });

  const bundle = await questionBundleCache.getOrCompute(
    buildQuestionBundleCacheKey({
      interviewType,
      difficulty,
      jobRole,
      desiredPoolSize,
    }),
    () =>
      buildQuestionBundle({
        interviewType,
        difficulty,
        jobRole,
        desiredPoolSize,
      })
  );

  return {
    roleResearch: bundle.roleResearch,
    questionPool: bundle.questionPool,
    metadata: bundle.metadata,
  };
};

export const evaluateAnswer = async (payload) => {
  const localEvaluation = evaluateAnswerLocally(payload);
  const profile = resolveRoleProfile(payload.jobRole);
  logger.info("evaluate_answer:service_start", {
    interviewType: payload.interviewType,
    jobRole: payload.jobRole,
    questionPreview: previewText(payload.question),
    answerPreview: previewText(payload.answer),
  });

  try {
    const prompt = `INTERVIEW TYPE: ${payload.interviewType}
TARGET ROLE: ${profile.displayRole}
ROLE THEMES: ${profile.techThemes.join(", ")}
QUESTION: ${sanitizeText(payload.question, 1000)}
EXPECTED KEY POINTS: ${(payload.expectedKeyPoints || []).join(", ")}
PLANNED FOLLOW UPS: ${(payload.plannedFollowUps || []).join(" | ") || "None"}
CANDIDATE ANSWER: ${sanitizeText(payload.answer, 6000)}
QUESTION WEIGHTAGE: ${payload.questionWeightage}
Return strict JSON only.`;
    const text = await callLlm({
      system: PROMPTS.EVALUATION_SYSTEM,
      prompt,
      maxTokens: 1800,
    });

    if (!text) return localEvaluation;

    const parsed = parseModelJson(text);
    if (!parsed || typeof parsed !== "object") {
      logger.warn("evaluate_answer:llm_fallback_local", {
        interviewType: payload.interviewType,
        jobRole: payload.jobRole,
      });
      return localEvaluation;
    }
    const mergedEvaluation = {
      ...localEvaluation,
      ...parsed,
      score: Math.max(0, Math.min(payload.questionWeightage, Number(parsed.score) || localEvaluation.score)),
      percentageScore: Math.max(0, Math.min(100, Number(parsed.percentageScore) || localEvaluation.percentageScore)),
      followUpQuestion: null,
    };
    logger.info("evaluate_answer:service_success", {
      interviewType: payload.interviewType,
      jobRole: payload.jobRole,
      percentageScore: mergedEvaluation.percentageScore,
      score: mergedEvaluation.score,
    });
    return mergedEvaluation;
  } catch (error) {
    logger.error("evaluate_answer:service_failed", {
      interviewType: payload.interviewType,
      jobRole: payload.jobRole,
      error,
    });
    return localEvaluation;
  }
};

const DSA_VERDICTS = new Set(["Accepted", "Partial", "Wrong Answer"]);

function mergeDsaLlmNarrative(localEvaluation, parsed, { hasAutomated }) {
  const pickStr = (value, maxLen, fallback) =>
    typeof value === "string" && value.trim() ? sanitizeText(value, maxLen) : fallback;

  const pickStrList = (value, fallback) =>
    Array.isArray(value) && value.length > 0
      ? value.map((s) => sanitizeText(String(s), 500)).filter(Boolean)
      : fallback;

  let correctnessVerdict = localEvaluation.correctnessVerdict;
  if (!hasAutomated && typeof parsed.correctnessVerdict === "string" && DSA_VERDICTS.has(parsed.correctnessVerdict)) {
    correctnessVerdict = parsed.correctnessVerdict;
  }

  const failedEveryTest =
    Number(localEvaluation.automatedTestsTotal) > 0 &&
    Number(localEvaluation.automatedTestsPassed) === 0;

  const llmImprovements = pickStrList(parsed.improvements, []);
  const improvements = failedEveryTest
    ? [
        ...(Array.isArray(localEvaluation.improvements) ? localEvaluation.improvements : []).slice(0, 3),
        ...llmImprovements.slice(0, 1),
      ].filter(Boolean)
    : pickStrList(parsed.improvements, localEvaluation.improvements);

  const codeIssues = failedEveryTest
    ? [
        ...(Array.isArray(localEvaluation.codeIssues) ? localEvaluation.codeIssues : []).slice(0, 3),
        ...pickStrList(parsed.codeIssues, []).slice(0, 1),
      ].filter(Boolean)
    : pickStrList(parsed.codeIssues, localEvaluation.codeIssues);

  return {
    ...localEvaluation,
    correctnessVerdict,
    detailedFeedback: pickStr(parsed.detailedFeedback, 4000, localEvaluation.detailedFeedback),
    voiceScript: pickStr(parsed.voiceScript, 2000, localEvaluation.voiceScript),
    optimalApproach: pickStr(parsed.optimalApproach, 2000, localEvaluation.optimalApproach),
    improvements,
    codeIssues,
    keyStrengths: pickStrList(parsed.keyStrengths, localEvaluation.keyStrengths || []),
    missedPoints: pickStrList(parsed.missedPoints, localEvaluation.missedPoints || []),
  };
}

export const evaluateDsaSolution = async (payload) => {
  const localEvaluation = evaluateDsaLocally(payload);
  const tr = payload.testRun;
  const testLine = summarizeTestRun(tr);
  const hasAutomated = Boolean(tr && !tr.skipped && Number(tr.total) > 0);

  try {
    const zeroPassHint =
      tr &&
      !tr.skipped &&
      Number(tr.total) > 0 &&
      Number(tr.passed) === 0
        ? "\nAll automated tests failed. Coaching must prioritize correct outputs for this problem — avoid generic advanced tips (e.g. DFS/BFS) unless they directly match the submitted code."
        : "";
    const prompt = `PROBLEM TITLE: ${payload.problem?.title}\nPROBLEM STATEMENT: ${sanitizeText(payload.problem?.statement, 2000)}\nLANGUAGE: ${payload.language}\nTIME USED: ${payload.timeUsed}\nAUTOMATED TESTS: ${testLine}\nPASSED: ${tr && !tr.skipped ? tr.passed : "n/a"}\nTOTAL: ${tr && !tr.skipped ? tr.total : "n/a"}\nSUBMITTED CODE:\n${String(payload.code || "").slice(0, 50_000)}${zeroPassHint}\nReturn strict JSON only. Do not invent numeric scores; the server computes the rubric. Focus on helpful text: detailedFeedback, voiceScript, optimalApproach, codeIssues, improvements, and optional keyStrengths/missedPoints.`;
    const text = await callLlm({
      system: PROMPTS.DSA_EVALUATION_SYSTEM,
      prompt,
      maxTokens: 2400,
    });

    if (!text) return localEvaluation;

    const parsed = parseModelJson(text);
    if (!parsed || typeof parsed !== "object") return localEvaluation;
    return mergeDsaLlmNarrative(localEvaluation, parsed, { hasAutomated });
  } catch (error) {
    return localEvaluation;
  }
};

export const generateSessionFeedback = async (sessionData) => {
  const localFeedback = generateSessionFeedbackLocally(sessionData);

  try {
    const prompt = `INTERVIEW TYPE: ${sessionData.type}\nTOTAL SCORE: ${sessionData.totalScore}\nQUESTIONS ANSWERED: ${sessionData.questionsAnswered}\nTIME TAKEN: ${sessionData.timeTaken}\nReturn a short natural language coaching paragraph only.`;
    const text = await callLlm({
      system: PROMPTS.FINAL_FEEDBACK_SYSTEM,
      prompt,
      maxTokens: 800,
    });

    return text ? sanitizeText(text, 2000) : localFeedback;
  } catch (error) {
    return localFeedback;
  }
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const filterProblems = (problems, { difficulty, topic, requireJudge = false }) => {
  let pool = Array.isArray(problems) ? [...problems] : [];
  if (difficulty) {
    const exact = pool.filter((problem) => problem.difficulty === difficulty);
    if (exact.length > 0) pool = exact;
  }
  if (topic) {
    const topicFiltered = pool.filter((problem) => problem.topics?.includes(topic));
    if (topicFiltered.length > 0) pool = topicFiltered;
  }
  if (requireJudge) {
    const judged = pool.filter((problem) => problem.hasAutomatedTests);
    if (judged.length > 0) pool = judged;
  }
  return pool;
};

const scoreProblemMatch = (problem, profile, topic) => {
  let score = 1 + Math.random();
  if (problem?.hasAutomatedTests) score += 1.2;
  if (profile?.key && problem?.roleTags?.includes(profile.key)) score += 2.4;
  const preferredTopics = Array.isArray(profile?.dsaTopics) ? profile.dsaTopics : [];
  const sharedTopics = (problem?.topics || []).filter((item) => preferredTopics.includes(item)).length;
  score += Math.min(3, sharedTopics * 0.9);
  if (topic && problem?.topics?.includes(topic)) score += 1.4;
  return score;
};

const pickRankedProblem = (problems, { jobRole, topic }) => {
  if (!problems.length) return null;
  const profile = resolveRoleProfile(jobRole);
  const ranked = problems
    .map((problem) => ({
      problem,
      score: scoreProblemMatch(problem, profile, topic),
    }))
    .sort((a, b) => b.score - a.score);
  const shortlist = ranked.slice(0, Math.min(6, ranked.length)).map((item) => item.problem);
  return pickRandom(shortlist);
};

export const getRandomProblem = async ({
  difficulty = "medium",
  topic,
  source = "mixed",
  jobRole = "Software Engineer",
  requireJudge = false,
}) => {
  const pickLocal = () => {
    let pool = filterProblems(ALL_PROBLEMS, { difficulty, topic, requireJudge });
    if (pool.length === 0 && requireJudge) {
      pool = filterProblems(ALL_PROBLEMS, { topic, requireJudge: true });
    }
    if (pool.length === 0) {
      pool = filterProblems(ALL_PROBLEMS, { difficulty, topic });
    }
    if (pool.length === 0) pool = ALL_PROBLEMS;
    const chosen = pickRankedProblem(pool, { jobRole, topic }) || pickRandom(pool);
    return { ...chosen, problemSource: chosen.problemSource || "local" };
  };

  const pickGfg = () => {
    if (requireJudge) return null;
    let pool = filterProblems(GFG_CURATED_PROBLEMS, { difficulty, topic });
    if (pool.length === 0) pool = GFG_CURATED_PROBLEMS;
    if (pool.length === 0) return null;
    return pickRankedProblem(pool, { jobRole, topic }) || pickRandom(pool);
  };

  if (source === "local") return pickLocal();
  if (source === "gfg") return pickGfg() || pickLocal();
  if (source === "codeforces") {
    if (requireJudge) return pickLocal();
    const cf = await fetchRandomCodeforcesProblem(difficulty);
    return cf || pickLocal();
  }

  if (requireJudge) return pickLocal();

  const roll = Math.random();
  if (roll < 0.68) return pickLocal();
  if (roll < 0.85) {
    const g = pickGfg();
    if (g) return g;
  }
  const cf = await fetchRandomCodeforcesProblem(difficulty);
  return cf || pickLocal();
};

export const getProblems = ({ difficulty }) => {
  if (!difficulty) return ALL_PROBLEMS;
  const filtered = ALL_PROBLEMS.filter((problem) => problem.difficulty === difficulty);
  return filtered.length > 0 ? filtered : ALL_PROBLEMS;
};

export const persistSession = async (sessionPayload) => {
  const [session] = await Promise.all([
    InterviewSession.create(sessionPayload),
    User.updateOne(
      { _id: sessionPayload.user },
      {
        $inc: { totalSessions: 1 },
      }
    ),
  ]);
  return session;
};
