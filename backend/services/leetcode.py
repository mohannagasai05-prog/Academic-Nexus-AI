import sys
import io
import time
import requests
import sqlite3
from backend.config import settings

# Curated LeetCode Problem Bank
LEETCODE_PROBLEMS = [
    {
        "id": 1,
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "Easy",
        "badge_color": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        "category": "Arrays & Hashing",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        "starter_code": "def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your O(n) hash map solution here\n    pass\n",
        "test_cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected": [0, 1]},
            {"input": {"nums": [3, 2, 4], "target": 6}, "expected": [1, 2]},
            {"input": {"nums": [3, 3], "target": 6}, "expected": [0, 1]}
        ],
        "optimal_approach": "Use a hash map to store seen numbers and their indices. For each number x, check if (target - x) exists in the hash map. Time Complexity: O(N), Space Complexity: O(N)."
    },
    {
        "id": 2,
        "title": "Valid Anagram",
        "slug": "valid-anagram",
        "difficulty": "Easy",
        "badge_color": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        "category": "Strings",
        "description": "Given two strings `s` and `t`, return `True` if `t` is an anagram of `s`, and `False` otherwise.",
        "starter_code": "def isAnagram(s: str, t: str) -> bool:\n    # Write your solution here\n    pass\n",
        "test_cases": [
            {"input": {"s": "anagram", "t": "nagaram"}, "expected": True},
            {"input": {"s": "rat", "t": "car"}, "expected": False}
        ],
        "optimal_approach": "Count character frequencies or compare sorted strings. Time Complexity: O(N), Space Complexity: O(1) for fixed alphabet."
    },
    {
        "id": 3,
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-without-repeating-characters",
        "difficulty": "Medium",
        "badge_color": "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "category": "Sliding Window",
        "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
        "starter_code": "def lengthOfLongestSubstring(s: str) -> int:\n    # Write your sliding window solution here\n    pass\n",
        "test_cases": [
            {"input": {"s": "abcabcbb"}, "expected": 3},
            {"input": {"s": "bbbbb"}, "expected": 1},
            {"input": {"s": "pwwkew"}, "expected": 3}
        ],
        "optimal_approach": "Use a sliding window with two pointers and a set/hashmap to track characters in the current window. Time Complexity: O(N), Space Complexity: O(min(N, M))."
    },
    {
        "id": 4,
        "title": "Container With Most Water",
        "slug": "container-with-most-water",
        "difficulty": "Medium",
        "badge_color": "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "category": "Two Pointers",
        "description": "Given an integer array `height` of length `n`, find two lines that together with the x-axis form a container, such that the container contains the most water.",
        "starter_code": "def maxArea(height: list[int]) -> int:\n    # Write your two pointers solution here\n    pass\n",
        "test_cases": [
            {"input": {"height": [1,8,6,2,5,4,8,3,7]}, "expected": 49},
            {"input": {"height": [1,1]}, "expected": 1}
        ],
        "optimal_approach": "Start with left=0 and right=n-1 pointers. Calculate area and move the pointer pointing to the shorter line inward. Time Complexity: O(N), Space Complexity: O(1)."
    },
    {
        "id": 5,
        "title": "Trapping Rain Water",
        "slug": "trapping-rain-water",
        "difficulty": "Hard",
        "badge_color": "bg-red-500/20 text-red-400 border-red-500/30",
        "category": "Two Pointers & DP",
        "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        "starter_code": "def trap(height: list[int]) -> int:\n    # Write your O(N) two pointers solution here\n    pass\n",
        "test_cases": [
            {"input": {"height": [0,1,0,2,1,0,1,3,2,1,2,1]}, "expected": 6},
            {"input": {"height": [4,2,0,3,2,5]}, "expected": 9}
        ],
        "optimal_approach": "Maintain left_max and right_max bounds using two pointers moving from ends toward center. Time Complexity: O(N), Space Complexity: O(1)."
    }
]

def get_leetcode_problems() -> list:
    return LEETCODE_PROBLEMS

def run_leetcode_code(problem_id: int, user_code: str) -> dict:
    problem = next((p for p in LEETCODE_PROBLEMS if p['id'] == problem_id), None)
    if not problem:
        return {"status": "Error", "message": "Problem not found"}

    test_cases = problem['test_cases']
    passed_count = 0
    total_count = len(test_cases)
    test_results = []

    start_time = time.time()

    for idx, tc in enumerate(test_cases):
        inputs = tc['input']
        expected = tc['expected']

        # Construct Sandbox Python Execution Context
        exec_scope = {}
        try:
            exec(user_code, exec_scope)
            
            # Find function in exec_scope
            func = None
            for key, val in exec_scope.items():
                if callable(val) and not key.startswith('__'):
                    func = val
                    break
            
            if not func:
                return {
                    "status": "Compile Error",
                    "passed": False,
                    "message": "No function defined in code snippet.",
                    "test_results": []
                }

            # Invoke function with inputs
            actual = func(**inputs) if isinstance(inputs, dict) else func(*inputs)
            
            # Check equality
            passed = (actual == expected)
            if passed:
                passed_count += 1

            test_results.append({
                "test_case": idx + 1,
                "input": str(inputs),
                "expected": str(expected),
                "actual": str(actual),
                "passed": passed
            })
        except Exception as e:
            test_results.append({
                "test_case": idx + 1,
                "input": str(inputs),
                "expected": str(expected),
                "actual": f"Runtime Exception: {type(e).__name__}: {str(e)}",
                "passed": False
            })

    exec_time_ms = round((time.time() - start_time) * 1000, 2)
    is_accepted = (passed_count == total_count)

    return {
        "status": "Accepted 🎉" if is_accepted else "Wrong Answer ❌",
        "is_accepted": is_accepted,
        "passed_count": passed_count,
        "total_count": total_count,
        "runtime_ms": exec_time_ms,
        "memory_mb": round(14.2 + (exec_time_ms * 0.01), 1), # Simulated LeetCode memory metric
        "test_results": test_results
    }

def get_leetcode_hint(problem_id: int, user_code: str) -> dict:
    problem = next((p for p in LEETCODE_PROBLEMS if p['id'] == problem_id), None)
    if not problem:
        return {"hint": "Problem not found."}

    gemini_key = settings.GEMINI_API_KEY
    if gemini_key:
        try:
            prompt = f"""You are a LeetCode AI Tutor.
Problem: {problem['title']} ({problem['difficulty']})
Description: {problem['description']}
Student's Current Code:
```python
{user_code}
```

Provide a helpful, progressive 3-bullet hint to guide the student toward an optimal solution without writing the complete solution directly."""

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                answer = res.json()['candidates'][0]['content']['parts'][0]['text']
                return {"hint": answer, "optimal_approach": problem['optimal_approach']}
        except Exception as e:
            print(f"Gemini hint call error: {e}")

    # Built-in Hint Fallback
    return {
        "hint": f"💡 **LeetCode Tutor Hint for {problem['title']}**:\n\n1. Consider using a **{problem['category']}** approach.\n2. {problem['optimal_approach']}\n3. Watch out for edge cases like empty arrays or duplicate elements!",
        "optimal_approach": problem['optimal_approach']
    }
