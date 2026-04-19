/**
 * Automated judge specs: hidden tests + function names per language.
 * Runs on the server via localSandbox (Node / Python / g++ / javac).
 */
const RAW_DSA_TEST_SPECS = {
  "two-sum-signals": {
    fn: { javascript: "twoSum", python: "two_sum" },
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-3, 4, 3, 90], 0], expected: [0, 2] },
      { args: [[1, 5, 1, 5], 10], expected: [1, 3] },
    ],
  },
  "valid-parentheses-flow": {
    fn: { javascript: "isValid", python: "is_valid" },
    tests: [
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: [""], expected: true },
      { args: ["([{}])"], expected: true },
      { args: ["((("], expected: false },
    ],
  },
  "best-time-stock-window": {
    fn: { javascript: "maxProfit", python: "max_profit" },
    tests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
      { args: [[1, 2]], expected: 1 },
      { args: [[2, 4, 1]], expected: 2 },
      { args: [[3, 3, 5, 0, 0, 3, 1, 4]], expected: 4 },
    ],
  },
  "valid-anagram-check": {
    fn: { javascript: "isAnagram", python: "is_anagram" },
    tests: [
      { args: ["anagram", "nagaram"], expected: true },
      { args: ["rat", "car"], expected: false },
      { args: ["aacc", "ccac"], expected: false },
      { args: ["listen", "silent"], expected: true },
      { args: ["aa", "a"], expected: false },
    ],
  },
  "binary-search-lookup": {
    fn: { javascript: "search", python: "search" },
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[5], 5], expected: 0 },
      { args: [[1, 2, 4, 6, 8, 10], 1], expected: 0 },
      { args: [[1, 2, 4, 6, 8, 10], 10], expected: 5 },
    ],
  },
  "merge-intervals-room-plan": {
    fn: { javascript: "merge", python: "merge" },
    tests: [
      {
        args: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
        expected: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[1, 4], [0, 2], [3, 5]]], expected: [[0, 5]] },
      { args: [[[2, 3], [4, 5], [6, 7]]], expected: [[2, 3], [4, 5], [6, 7]] },
    ],
  },
  "product-array-stream": {
    fn: { javascript: "productExceptSelf", python: "product_except_self" },
    tests: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[2, 3, 0, 4]], expected: [0, 0, 24, 0] },
      { args: [[0, 0]], expected: [0, 0] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
    ],
  },
  "longest-substring-signal": {
    fn: { javascript: "lengthOfLongestSubstring", python: "length_of_longest_substring" },
    tests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: [""], expected: 0 },
      { args: ["pwwkew"], expected: 3 },
      { args: ["dvdf"], expected: 3 },
    ],
  },
  "kth-largest-stream": {
    fn: { javascript: "findKthLargest", python: "find_kth_largest" },
    tests: [
      { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
      { args: [[1], 1], expected: 1 },
      { args: [[7, 6, 5, 4, 3, 2, 1], 5], expected: 3 },
    ],
  },
  "maximum-subarray-beacon": {
    fn: { javascript: "maxSubArray", python: "max_sub_array" },
    tests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-1, -2, -3]], expected: -1 },
      { args: [[8, -19, 5, -4, 20]], expected: 21 },
    ],
  },
  "search-rotated-index": {
    fn: { javascript: "searchRotated", python: "search_rotated" },
    tests: [
      { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { args: [[1], 0], expected: -1 },
      { args: [[1], 1], expected: 0 },
      { args: [[6, 7, 1, 2, 3, 4, 5], 4], expected: 5 },
    ],
  },
  "daily-temperatures-queue": {
    fn: { javascript: "dailyTemperatures", python: "daily_temperatures" },
    tests: [
      { args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
      { args: [[30, 60, 90]], expected: [1, 1, 0] },
      { args: [[90, 80, 70]], expected: [0, 0, 0] },
    ],
  },
  "coin-change-budget": {
    fn: { javascript: "coinChange", python: "coin_change" },
    tests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0 },
      { args: [[1], 2], expected: 2 },
      { args: [[2, 5, 10, 1], 27], expected: 4 },
    ],
  },
  "house-robber-lane": {
    fn: { javascript: "rob", python: "rob" },
    tests: [
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
      { args: [[2, 1, 1, 2]], expected: 4 },
      { args: [[5]], expected: 5 },
      { args: [[2, 4, 8, 9, 9, 3]], expected: 19 },
    ],
  },
  "course-schedule-paths": {
    fn: { javascript: "canFinish", python: "can_finish" },
    tests: [
      { args: [2, [[1, 0]]], expected: true },
      { args: [2, [[1, 0], [0, 1]]], expected: false },
      { args: [1, []], expected: true },
      { args: [4, [[1, 0], [2, 1], [3, 2]]], expected: true },
      { args: [3, [[1, 0], [0, 2], [2, 1]]], expected: false },
    ],
  },
  "longest-consecutive-streak": {
    fn: { javascript: "longestConsecutive", python: "longest_consecutive" },
    tests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[1, 2, 0, 1]], expected: 3 },
      { args: [[9]], expected: 1 },
    ],
  },
  "word-ladder-router": {
    fn: { javascript: "ladderLength", python: "ladder_length" },
    tests: [
      {
        args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]],
        expected: 5,
      },
      { args: ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], expected: 0 },
      { args: ["a", "c", ["a", "b", "c"]], expected: 2 },
      { args: ["lost", "cost", ["most", "fist", "lost", "cost", "fish"]], expected: 2 },
    ],
  },
  "minimum-window-signal": {
    fn: { javascript: "minWindow", python: "min_window" },
    tests: [
      { args: ["ADOBECODEBANC", "ABC"], expected: "BANC" },
      { args: ["a", "a"], expected: "a" },
      { args: ["a", "aa"], expected: "" },
      { args: ["aa", "aa"], expected: "aa" },
      { args: ["ab", "b"], expected: "b" },
    ],
  },
  "trapping-rain-ops": {
    fn: { javascript: "trap", python: "trap" },
    tests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { args: [[2, 0, 2]], expected: 2 },
      { args: [[3, 0, 0, 2, 0, 4]], expected: 10 },
    ],
  },
};

export const DSA_TEST_SPECS = Object.fromEntries(
  Object.entries(RAW_DSA_TEST_SPECS).map(([problemId, spec]) => [
    problemId,
    {
      ...spec,
      fn: {
        ...spec.fn,
        cpp: spec.fn?.cpp || spec.fn?.javascript,
        java: spec.fn?.java || spec.fn?.javascript,
      },
    },
  ])
);
