#!/usr/bin/env python3
"""
API Testing Script for Web Tester Skill

Usage:
    python3 api_test.py --base-url http://localhost:5000 --token <jwt_token>
    python3 api_test.py --base-url http://localhost:5000 --email user@example.com --password Test1234!
"""

import argparse
import json
import subprocess
import sys
from typing import Optional
from dataclasses import dataclass
from enum import Enum


class HttpMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


@dataclass
class ApiTest:
    name: str
    method: HttpMethod
    endpoint: str
    expected_status: int = 200
    body: Optional[dict] = None
    headers: Optional[dict] = None
    auth_required: bool = True


# Default test suites by module
TEST_SUITES = {
    "auth": [
        ApiTest("Sign In", HttpMethod.POST, "/api/auth/signin", 200,
                body={"email": "", "password": ""}, auth_required=False),
        ApiTest("Get Current User", HttpMethod.GET, "/api/auth/me", 200),
    ],
    "applications": [
        ApiTest("List Applications", HttpMethod.GET, "/api/applications", 200),
        ApiTest("Get Application", HttpMethod.GET, "/api/applications/{id}", 200),
        ApiTest("Create Application", HttpMethod.POST, "/api/applications", 201),
        ApiTest("Update Application", HttpMethod.PUT, "/api/applications/{id}", 200),
    ],
    "documents": [
        ApiTest("List Documents", HttpMethod.GET, "/api/documents", 200),
        ApiTest("Get Document URL", HttpMethod.GET, "/api/documents/{id}/url", 200),
    ],
    "meetings": [
        ApiTest("List Meetings", HttpMethod.GET, "/api/meetings", 200),
    ],
    "universities": [
        ApiTest("List Universities", HttpMethod.GET, "/api/universities", 200),
        ApiTest("Get University", HttpMethod.GET, "/api/universities/{id}", 200),
    ],
    "programs": [
        ApiTest("List Programs", HttpMethod.GET, "/api/programs", 200),
        ApiTest("Get Program", HttpMethod.GET, "/api/programs/{id}", 200),
    ],
}


def run_curl(base_url: str, test: ApiTest, token: Optional[str] = None, app_id: Optional[str] = None) -> dict:
    """Execute a curl command and return the result."""
    url = base_url + test.endpoint
    if app_id and "{id}" in url:
        url = url.replace("{id}", app_id)
    
    cmd = ["curl", "-s", "-X", test.method.value, url]
    
    # Add headers
    cmd.extend(["-H", "Content-Type: application/json"])
    if test.auth_required and token:
        cmd.extend(["-H", f"Authorization: Bearer {token}"])
    
    # Add body
    if test.body:
        # Replace placeholders in body
        body_str = json.dumps(test.body)
        if app_id:
            body_str = body_str.replace("{id}", app_id)
        cmd.extend(["-d", body_str])
    
    # Add custom headers
    if test.headers:
        for key, value in test.headers.items():
            cmd.extend(["-H", f"{key}: {value}"])
    
    # Get HTTP status code
    cmd.extend(["-w", "\n__HTTP_STATUS__:%{http_code}"])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        output = result.stdout
        
        # Parse status code
        status_code = 0
        if "__HTTP_STATUS__:" in output:
            parts = output.rsplit("__HTTP_STATUS__:", 1)
            output = parts[0]
            try:
                status_code = int(parts[1].strip())
            except ValueError:
                pass
        
        # Parse JSON response
        response = {}
        if output.strip():
            try:
                response = json.loads(output)
            except json.JSONDecodeError:
                response = {"raw": output}
        
        return {
            "status_code": status_code,
            "response": response,
            "success": status_code == test.expected_status,
        }
    except subprocess.TimeoutExpired:
        return {"status_code": 0, "response": {"error": "Timeout"}, "success": False}
    except Exception as e:
        return {"status_code": 0, "response": {"error": str(e)}, "success": False}


def get_token(base_url: str, email: str, password: str) -> Optional[str]:
    """Get authentication token via sign in."""
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{base_url}/api/auth/signin",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"email": email, "password": password}),
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(result.stdout)
        return data.get("session", {}).get("access_token")
    except Exception:
        return None


def run_tests(base_url: str, token: Optional[str], suites: list[str], app_id: Optional[str] = None) -> dict:
    """Run API tests and return results."""
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "tests": [],
    }
    
    for suite_name in suites:
        if suite_name not in TEST_SUITES:
            print(f"Warning: Unknown test suite '{suite_name}'")
            continue
        
        for test in TEST_SUITES[suite_name]:
            result = run_curl(base_url, test, token, app_id)
            results["total"] += 1
            
            test_result = {
                "suite": suite_name,
                "name": test.name,
                "method": test.method.value,
                "endpoint": test.endpoint,
                "expected_status": test.expected_status,
                "actual_status": result["status_code"],
                "success": result["success"],
                "response": result["response"],
            }
            
            if result["success"]:
                results["passed"] += 1
            else:
                results["failed"] += 1
            
            results["tests"].append(test_result)
    
    return results


def main():
    parser = argparse.ArgumentParser(description="API Testing Script")
    parser.add_argument("--base-url", default="http://localhost:5000", help="Base URL for API")
    parser.add_argument("--token", help="JWT authentication token")
    parser.add_argument("--email", help="Email for authentication")
    parser.add_argument("--password", help="Password for authentication")
    parser.add_argument("--suites", default="auth,applications", help="Comma-separated test suites to run")
    parser.add_argument("--app-id", help="Application ID for testing specific endpoints")
    parser.add_argument("--output", default="text", choices=["text", "json"], help="Output format")
    
    args = parser.parse_args()
    
    # Get token
    token = args.token
    if not token and args.email and args.password:
        token = get_token(args.base_url, args.email, args.password)
        if not token:
            print("Error: Failed to get authentication token")
            sys.exit(1)
    
    # Parse suites
    suites = [s.strip() for s in args.suites.split(",")]
    
    # Run tests
    results = run_tests(args.base_url, token, suites, args.app_id)
    
    # Output results
    if args.output == "json":
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"API Test Results: {results['passed']}/{results['total']} passed")
        print(f"{'='*60}\n")
        
        for test in results["tests"]:
            status = "✅ PASS" if test["success"] else "❌ FAIL"
            print(f"{status} [{test['suite']}] {test['name']}")
            print(f"    {test['method']} {test['endpoint']}")
            print(f"    Expected: {test['expected_status']}, Got: {test['actual_status']}")
            if not test["success"] and test["response"].get("error"):
                print(f"    Error: {test['response']['error']}")
            print()
        
        print(f"{'='*60}")
        print(f"Total: {results['total']} | Passed: {results['passed']} | Failed: {results['failed']}")
        print(f"{'='*60}")
    
    # Exit with error if any tests failed
    sys.exit(0 if results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
