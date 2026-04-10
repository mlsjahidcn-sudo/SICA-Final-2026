#!/usr/bin/env python3
"""
Port/Service Detection Script for Web Tester Skill

Usage:
    python3 check_port.py --port 5000
    python3 check_port.py --port 5000 --check-http
"""

import argparse
import subprocess
import sys
import re


def check_port_listening(port: int) -> bool:
    """Check if a port is listening."""
    try:
        result = subprocess.run(
            ["ss", "-tuln"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Look for the port in LISTEN state
        pattern = rf':{port}\s'
        for line in result.stdout.split('\n'):
            if re.search(pattern, line) and 'LISTEN' in line:
                return True
        return False
    except Exception as e:
        print(f"Error checking port: {e}")
        return False


def get_process_on_port(port: int) -> dict:
    """Get the process listening on a port."""
    try:
        result = subprocess.run(
            ["ss", "-lptn", f"sport = :{port}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        output = result.stdout.strip()
        if not output:
            return {"listening": False}
        
        # Parse the output to get PID
        lines = output.split('\n')
        if len(lines) > 1:
            # Second line contains process info
            match = re.search(r'pid=(\d+)', lines[1])
            if match:
                return {
                    "listening": True,
                    "pid": int(match.group(1)),
                    "raw": lines[1]
                }
        
        return {"listening": True, "raw": output}
    except Exception as e:
        return {"listening": False, "error": str(e)}


def check_http_response(url: str, timeout: int = 5) -> dict:
    """Check HTTP response from a URL."""
    try:
        result = subprocess.run(
            ["curl", "-I", "-s", "--max-time", str(timeout), url],
            capture_output=True,
            text=True,
            timeout=timeout + 5
        )
        
        headers = result.stdout.strip()
        first_line = headers.split('\n')[0] if headers else ""
        
        # Parse HTTP status
        status_match = re.search(r'HTTP/[\d.]+\s+(\d+)', first_line)
        status_code = int(status_match.group(1)) if status_match else 0
        
        return {
            "success": status_code > 0,
            "status_code": status_code,
            "headers": headers,
            "first_line": first_line
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Port/Service Detection Script")
    parser.add_argument("--port", type=int, default=5000, help="Port to check")
    parser.add_argument("--check-http", action="store_true", help="Also check HTTP response")
    parser.add_argument("--url", default=None, help="URL to check (default: http://localhost:{port})")
    parser.add_argument("--timeout", type=int, default=5, help="HTTP timeout in seconds")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    results = {
        "port": args.port,
        "listening": False,
        "process": None,
        "http": None
    }
    
    # Check if port is listening
    results["listening"] = check_port_listening(args.port)
    
    if results["listening"]:
        results["process"] = get_process_on_port(args.port)
    
    # Check HTTP if requested
    if args.check_http:
        url = args.url or f"http://localhost:{args.port}"
        results["http"] = check_http_response(url, args.timeout)
    
    # Output results
    if args.json:
        import json
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"Port Check Results for {args.port}")
        print(f"{'='*50}\n")
        
        if results["listening"]:
            print(f"✅ Port {args.port} is LISTENING")
            if results["process"] and results["process"].get("pid"):
                print(f"   PID: {results['process']['pid']}")
        else:
            print(f"❌ Port {args.port} is NOT listening")
        
        if results["http"]:
            print()
            if results["http"]["success"]:
                print(f"✅ HTTP Response: {results['http']['status_code']}")
            else:
                print(f"❌ HTTP Failed: {results['http'].get('error', 'Unknown error')}")
        
        print(f"\n{'='*50}")
    
    # Exit with error if port not listening
    sys.exit(0 if results["listening"] else 1)


if __name__ == "__main__":
    main()
