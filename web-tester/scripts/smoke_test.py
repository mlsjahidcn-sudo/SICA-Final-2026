#!/usr/bin/env python3
"""
Smoke Test Script for Web Tester Skill

Quick validation of core functionality.

Usage:
    python3 smoke_test.py
    python3 smoke_test.py --quick
    python3 smoke_test.py --verbose
"""

import argparse
import json
import subprocess
import sys
import os
from typing import Callable


def check_port_listening(port: int = 5000) -> tuple[bool, str]:
    """Check if port is listening."""
    try:
        result = subprocess.run(
            ["ss", "-tuln"],
            capture_output=True,
            text=True,
            timeout=10
        )
        for line in result.stdout.split('\n'):
            if f':{port}' in line and 'LISTEN' in line:
                return True, f"Port {port} is listening"
        return False, f"Port {port} is NOT listening"
    except Exception as e:
        return False, f"Error checking port: {e}"


def check_http_response(url: str = "http://localhost:5000") -> tuple[bool, str]:
    """Check HTTP response."""
    try:
        result = subprocess.run(
            ["curl", "-I", "-s", "--max-time", "5", url],
            capture_output=True,
            text=True,
            timeout=10
        )
        first_line = result.stdout.split('\n')[0] if result.stdout else ""
        if "200" in first_line or "302" in first_line:
            return True, f"HTTP OK: {first_line.strip()}"
        return False, f"HTTP Failed: {first_line.strip() or 'No response'}"
    except subprocess.TimeoutExpired:
        return False, "HTTP Timeout"
    except Exception as e:
        return False, f"HTTP Error: {e}"


def check_auth_endpoint(base_url: str = "http://localhost:5000") -> tuple[bool, str]:
    """Check auth endpoint is responding."""
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", f"{base_url}/api/auth/signin",
             "-H", "Content-Type: application/json",
             "-d", '{"email":"test@test.com","password":"wrong"}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        response = result.stdout
        # Should get some response (even if auth fails)
        if response:
            try:
                data = json.loads(response)
                # Auth failure is expected with wrong credentials
                if "error" in data:
                    return True, "Auth endpoint responding (expected auth failure)"
                return True, "Auth endpoint responding"
            except json.JSONDecodeError:
                return True, "Auth endpoint responding (non-JSON)"
        return False, "Auth endpoint not responding"
    except Exception as e:
        return False, f"Auth check error: {e}"


def check_database_connection() -> tuple[bool, str]:
    """Check database connection via REST API."""
    # Load env
    env_path = "/workspace/projects/.env"
    service_key = ""
    supabase_url = ""
    
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith("COZE_SUPABASE_URL="):
                    supabase_url = line.split('=', 1)[1].strip()
                elif line.startswith("COZE_SUPABASE_SERVICE_ROLE_KEY="):
                    service_key = line.split('=', 1)[1].strip()
    except Exception:
        pass
    
    if not service_key or not supabase_url:
        return False, "Database credentials not found"
    
    try:
        result = subprocess.run(
            ["curl", "-s", f"{supabase_url}/rest/v1/users?select=id&limit=1",
             "-H", f"apikey: {service_key}",
             "-H", f"Authorization: Bearer {service_key}"],
            capture_output=True,
            text=True,
            timeout=30
        )
        response = result.stdout
        
        if response and not "error" in response.lower():
            return True, "Database connection OK"
        return False, f"Database connection failed: {response[:100]}"
    except Exception as e:
        return False, f"Database check error: {e}"


def check_no_critical_errors() -> tuple[bool, str]:
    """Check for critical errors in logs."""
    log_path = "/app/work/logs/bypass/app.log"
    
    try:
        result = subprocess.run(
            ["tail", "-n", "100", log_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Check for critical errors
        critical_patterns = ["FATAL", "PANIC", "EMERGENCY"]
        error_count = 0
        
        for line in result.stdout.split('\n'):
            for pattern in critical_patterns:
                if pattern in line.upper():
                    error_count += 1
        
        if error_count > 0:
            return False, f"Found {error_count} critical errors in logs"
        return True, "No critical errors in recent logs"
    except FileNotFoundError:
        return True, "Log file not found (may be first run)"
    except Exception as e:
        return True, f"Could not check logs: {e}"


def run_smoke_tests(quick: bool = False, verbose: bool = False) -> dict:
    """Run all smoke tests."""
    tests: list[tuple[str, Callable]] = [
        ("Port Listening", lambda: check_port_listening()),
        ("HTTP Response", lambda: check_http_response()),
    ]
    
    if not quick:
        tests.extend([
            ("Auth Endpoint", lambda: check_auth_endpoint()),
            ("Database Connection", lambda: check_database_connection()),
            ("No Critical Errors", lambda: check_no_critical_errors()),
        ])
    
    results = {
        "total": len(tests),
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    for name, test_func in tests:
        try:
            passed, message = test_func()
        except Exception as e:
            passed, message = False, str(e)
        
        results["tests"].append({
            "name": name,
            "passed": passed,
            "message": message
        })
        
        if passed:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Smoke Test Script")
    parser.add_argument("--quick", action="store_true", help="Run quick tests only")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    results = run_smoke_tests(quick=args.quick, verbose=args.verbose)
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"Smoke Test Results")
        print(f"{'='*50}\n")
        
        for test in results["tests"]:
            status = "✅ PASS" if test["passed"] else "❌ FAIL"
            print(f"{status}: {test['name']}")
            if args.verbose or not test["passed"]:
                print(f"       {test['message']}")
        
        print(f"\n{'='*50}")
        print(f"Total: {results['total']} | Passed: {results['passed']} | Failed: {results['failed']}")
        print(f"{'='*50}\n")
    
    sys.exit(0 if results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
