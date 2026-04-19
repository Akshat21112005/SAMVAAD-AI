export const PROBLEM_POOL = [
  {
    id: "two-sum-signals",
    title: "Two Sum Signals",
    difficulty: "easy",
    topics: ["arrays", "hashmap"],
    statement:
      "Given an array of integers and a target value, return the indices of the two numbers whose sum equals the target. You may assume exactly one valid pair exists.",
    constraints: [
      "2 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "Exactly one valid answer exists",
    ],
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    sampleOutput: "[0, 1]",
    timeLimitSeconds: 2700,
    hints: ["Use previously seen values", "Aim for linear time"],
    companies: ["Amazon", "Google"],
    starterCode: {
      javascript:
        "function twoSum(nums, target) {\n  // return [i, j]\n}\n",
      python: "def two_sum(nums, target):\n    # return [i, j]\n    pass\n",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // return {i, j};\n}\n",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}\n",
    },
  },
  {
    id: "valid-parentheses-flow",
    title: "Valid Parentheses Flow",
    difficulty: "easy",
    topics: ["stack", "strings"],
    statement:
      "Determine whether an input string containing only parentheses characters is valid. A valid string must close brackets in the correct order.",
    constraints: ["1 <= s.length <= 10^4"],
    sampleInput: 's = "()[]{}"',
    sampleOutput: "true",
    timeLimitSeconds: 2700,
    hints: ["Track opening brackets", "Think LIFO"],
    companies: ["Meta", "Adobe"],
    starterCode: {
      javascript: "function isValid(s) {\n  return false;\n}\n",
      python: "def is_valid(s):\n    return False\n",
      cpp: "bool isValid(string s) {\n    return false;\n}\n",
      java: "class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}\n",
    },
  },
  {
    id: "merge-intervals-room-plan",
    title: "Merge Intervals Room Plan",
    difficulty: "medium",
    topics: ["intervals", "sorting"],
    statement:
      "Given a collection of intervals, merge all overlapping intervals and return the compacted list in sorted order.",
    constraints: ["1 <= intervals.length <= 10^4"],
    sampleInput: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
    sampleOutput: "[[1,6],[8,10],[15,18]]",
    timeLimitSeconds: 2700,
    hints: ["Sort by start time first", "Merge greedily"],
    companies: ["LinkedIn", "Google"],
    starterCode: {
      javascript: "function merge(intervals) {\n  return [];\n}\n",
      python: "def merge(intervals):\n    return []\n",
      cpp: "vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    return {};\n}\n",
      java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}\n",
    },
  },
  {
    id: "product-array-stream",
    title: "Product Array Stream",
    difficulty: "medium",
    topics: ["arrays", "prefix-suffix"],
    statement:
      "Return an array answer such that answer[i] is equal to the product of all elements except nums[i], without using division.",
    constraints: ["2 <= nums.length <= 10^5"],
    sampleInput: "nums = [1,2,3,4]",
    sampleOutput: "[24,12,8,6]",
    timeLimitSeconds: 2700,
    hints: ["Build prefix products", "Then walk backward for suffix"],
    companies: ["Amazon", "ByteDance"],
    starterCode: {
      javascript: "function productExceptSelf(nums) {\n  return [];\n}\n",
      python: "def product_except_self(nums):\n    return []\n",
      cpp: "vector<int> productExceptSelf(vector<int>& nums) {\n    return {};\n}\n",
      java: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n}\n",
    },
  },
  {
    id: "longest-substring-signal",
    title: "Longest Unique Signal",
    difficulty: "medium",
    topics: ["sliding-window", "strings", "hashmap"],
    statement:
      "Find the length of the longest substring without repeating characters.",
    constraints: ["0 <= s.length <= 5 * 10^4"],
    sampleInput: 's = "abcabcbb"',
    sampleOutput: "3",
    timeLimitSeconds: 2700,
    hints: ["Use a moving window", "Track last seen index"],
    companies: ["Google", "Walmart"],
    starterCode: {
      javascript: "function lengthOfLongestSubstring(s) {\n  return 0;\n}\n",
      python: "def length_of_longest_substring(s):\n    return 0\n",
      cpp: "int lengthOfLongestSubstring(string s) {\n    return 0;\n}\n",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}\n",
    },
  },
  {
    id: "kth-largest-stream",
    title: "Kth Largest Stream",
    difficulty: "medium",
    topics: ["heap", "priority-queue"],
    statement:
      "Given an array and an integer k, return the kth largest element in the array.",
    constraints: ["1 <= k <= nums.length <= 10^5"],
    sampleInput: "nums = [3,2,1,5,6,4], k = 2",
    sampleOutput: "5",
    timeLimitSeconds: 2700,
    hints: ["Min heap of size k", "Or quickselect"],
    companies: ["Meta", "Salesforce"],
    starterCode: {
      javascript: "function findKthLargest(nums, k) {\n  return 0;\n}\n",
      python: "def find_kth_largest(nums, k):\n    return 0\n",
      cpp: "int findKthLargest(vector<int>& nums, int k) {\n    return 0;\n}\n",
      java: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        return 0;\n    }\n}\n",
    },
  },
  {
    id: "clone-graph-signal-map",
    title: "Clone Graph Signal Map",
    difficulty: "medium",
    topics: ["graphs", "dfs", "bfs"],
    statement:
      "Given a reference of a node in a connected undirected graph, return a deep copy of the graph.",
    constraints: ["The graph has at most 100 nodes"],
    sampleInput: "adjList = [[2,4],[1,3],[2,4],[1,3]]",
    sampleOutput: "deep copy of graph",
    timeLimitSeconds: 2700,
    hints: ["Map original nodes to clones", "Traverse once"],
    companies: ["Microsoft", "Amazon"],
    starterCode: {
      javascript:
        "function cloneGraph(node) {\n  if (!node) return null;\n  return null;\n}\n",
      python:
        "def clone_graph(node):\n    if not node:\n        return None\n    return None\n",
      cpp:
        "// Definition for a Node (LeetCode-style).\n// class Node { public: int val; vector<Node*> neighbors; };\n\nNode* cloneGraph(Node* node) {\n    return nullptr;\n}\n",
      java:
        "/*\n// Definition for a Node.\nclass Node {\n    public int val;\n    public List<Node> neighbors;\n}\n*/\n\nclass Solution {\n    public Node cloneGraph(Node node) {\n        return null;\n    }\n}\n",
    },
  },
  {
    id: "course-schedule-paths",
    title: "Course Schedule Paths",
    difficulty: "medium",
    topics: ["graphs", "topological-sort"],
    statement:
      "Return true if it is possible to finish all courses given prerequisite pairs.",
    constraints: ["1 <= numCourses <= 2000"],
    sampleInput: "numCourses = 2, prerequisites = [[1,0]]",
    sampleOutput: "true",
    timeLimitSeconds: 2700,
    hints: ["Detect cycles in directed graph", "Kahn's algorithm works"],
    companies: ["Uber", "Robinhood"],
    starterCode: {
      javascript:
        "function canFinish(numCourses, prerequisites) {\n  return false;\n}\n",
      python: "def can_finish(num_courses, prerequisites):\n    return False\n",
      cpp: "bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    return false;\n}\n",
      java: "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        return false;\n    }\n}\n",
    },
  },
  {
    id: "lru-cache-console",
    title: "LRU Cache Console",
    difficulty: "hard",
    topics: ["design", "linked-list", "hashmap"],
    statement:
      "Design a data structure that follows the constraints of a Least Recently Used cache with O(1) get and put operations.",
    constraints: ["1 <= capacity <= 3000"],
    sampleInput: "put(1,1), put(2,2), get(1), put(3,3)",
    sampleOutput: "evicts least recently used key",
    timeLimitSeconds: 2700,
    hints: ["Combine hash map with doubly linked list", "Move recent items to head"],
    companies: ["Google", "Adobe"],
    starterCode: {
      javascript:
        "class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}\n",
      python:
        "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass\n",
      cpp:
        "class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};\n",
      java:
        "class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}\n",
    },
  },
  {
    id: "word-ladder-router",
    title: "Word Ladder Router",
    difficulty: "hard",
    topics: ["graphs", "bfs", "strings"],
    statement:
      "Return the length of the shortest transformation sequence from beginWord to endWord where each transformed word must exist in the word list and only one character can change at a time.",
    constraints: ["1 <= wordList.length <= 5000"],
    sampleInput: 'beginWord = "hit", endWord = "cog"',
    sampleOutput: "5",
    timeLimitSeconds: 2700,
    hints: ["BFS over word graph", "Preprocess wildcard patterns"],
    companies: ["Amazon", "Bloomberg"],
    starterCode: {
      javascript:
        "function ladderLength(beginWord, endWord, wordList) {\n  return 0;\n}\n",
      python: "def ladder_length(begin_word, end_word, word_list):\n    return 0\n",
      cpp: "int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n    return 0;\n}\n",
      java:
        "class Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        return 0;\n    }\n}\n",
    },
  },
  {
    id: "median-data-stream",
    title: "Median Data Stream",
    difficulty: "hard",
    topics: ["heap", "design"],
    statement:
      "Design a data structure that supports adding numbers from a stream and finding the median efficiently.",
    constraints: ["At most 5 * 10^4 operations"],
    sampleInput: "addNum(1), addNum(2), findMedian()",
    sampleOutput: "1.5",
    timeLimitSeconds: 2700,
    hints: ["Maintain two heaps", "Balance their sizes"],
    companies: ["Uber", "Oracle"],
    starterCode: {
      javascript: "class MedianFinder {\n  addNum(num) {}\n  findMedian() {}\n}\n",
      python:
        "class MedianFinder:\n    def add_num(self, num):\n        pass\n    def find_median(self):\n        return 0\n",
      cpp:
        "class MedianFinder {\npublic:\n    void addNum(int num) {}\n    double findMedian() { return 0; }\n};\n",
      java:
        "class MedianFinder {\n    public void addNum(int num) {}\n    public double findMedian() { return 0; }\n}\n",
    },
  },
  {
    id: "trapping-rain-ops",
    title: "Trapping Rain Ops",
    difficulty: "hard",
    topics: ["two-pointers", "arrays"],
    statement:
      "Given n non-negative integers representing elevation, compute how much water can be trapped after raining.",
    constraints: ["1 <= height.length <= 2 * 10^4"],
    sampleInput: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
    sampleOutput: "6",
    timeLimitSeconds: 2700,
    hints: ["Two pointers work in O(n)", "Track left and right max"],
    companies: ["Meta", "Apple"],
    starterCode: {
      javascript: "function trap(height) {\n  return 0;\n}\n",
      python: "def trap(height):\n    return 0\n",
      cpp: "int trap(vector<int>& height) {\n    return 0;\n}\n",
      java: "class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}\n",
    },
  },
];
