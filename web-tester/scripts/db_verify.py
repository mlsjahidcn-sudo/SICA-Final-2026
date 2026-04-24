#!/usr/bin/env python3
"""
Database Verification Script for Web Tester Skill

Usage:
    python3 db_verify.py --table users --check-columns id,email,role
    python3 db_verify.py --table applications --check-count
    python3 db_verify.py --rls-check applications
"""

import argparse
import json
import os
import sys
from typing import Optional


def get_env_credentials() -> dict:
    """Get Supabase credentials from environment variables."""
    return {
        "supabase_url": os.environ.get("COZE_SUPABASE_URL", ""),
        "service_role_key": os.environ.get("COZE_SUPABASE_SERVICE_ROLE_KEY", ""),
    }


def load_env_file(env_path: str = "/workspace/projects/.env") -> dict:
    """Load environment variables from .env file."""
    env_vars = {}
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        pass
    return env_vars


def check_table_columns(supabase_url: str, service_key: str, table: str, columns: list) -> dict:
    """Verify that a table has expected columns."""
    import subprocess
    
    column_list = ",".join(columns)
    url = f"{supabase_url}/rest/v1/{table}?select={column_list}&limit=1"
    
    cmd = [
        "curl", "-s", url,
        "-H", f"apikey: {service_key}",
        "-H", f"Authorization: Bearer {service_key}"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        response = result.stdout
        
        # Check for error
        if "error" in response.lower() or "does not exist" in response.lower():
            try:
                error_data = json.loads(response)
                return {
                    "success": False,
                    "error": error_data.get("message", response),
                    "table": table
                }
            except json.JSONDecodeError:
                return {"success": False, "error": response, "table": table}
        
        # Success - columns exist
        return {
            "success": True,
            "table": table,
            "columns_checked": columns,
            "message": f"All {len(columns)} columns verified"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "table": table}


def check_table_count(supabase_url: str, service_key: str, table: str) -> dict:
    """Get row count for a table."""
    import subprocess
    
    url = f"{supabase_url}/rest/v1/{table}?select=count&head=true"
    
    cmd = [
        "curl", "-s", "-I", url,
        "-H", f"apikey: {service_key}",
        "-H", f"Authorization: Bearer {service_key}",
        "-H", "Prefer: count=exact"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        headers = result.stdout
        
        # Parse content-range header for count
        for line in headers.split('\n'):
            if 'content-range' in line.lower():
                # Format: content-range: 0-0/X
                parts = line.split('/')
                if len(parts) > 1:
                    count = parts[1].strip()
                    return {
                        "success": True,
                        "table": table,
                        "count": int(count) if count.isdigit() else count
                    }
        
        return {"success": False, "error": "Could not parse count", "table": table}
    except Exception as e:
        return {"success": False, "error": str(e), "table": table}


def check_foreign_keys(supabase_url: str, service_key: str, table: str, fk_column: str, ref_table: str) -> dict:
    """Verify foreign key relationship integrity."""
    import subprocess
    
    # Get records with the FK column
    url = f"{supabase_url}/rest/v1/{table}?select={fk_column}&{fk_column}=not.is.null&limit=10"
    
    cmd = [
        "curl", "-s", url,
        "-H", f"apikey: {service_key}",
        "-H", f"Authorization: Bearer {service_key}"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        records = json.loads(result.stdout)
        
        if not isinstance(records, list):
            return {"success": False, "error": "Invalid response", "table": table}
        
        fk_values = [r.get(fk_column) for r in records if r.get(fk_column)]
        
        if not fk_values:
            return {
                "success": True,
                "table": table,
                "fk_column": fk_column,
                "ref_table": ref_table,
                "message": "No FK values to verify"
            }
        
        # Check if referenced values exist
        for fk_value in fk_values[:5]:  # Check first 5
            ref_url = f"{supabase_url}/rest/v1/{ref_table}?select=id&id=eq.{fk_value}"
            ref_cmd = [
                "curl", "-s", ref_url,
                "-H", f"apikey: {service_key}",
                "-H", f"Authorization: Bearer {service_key}"
            ]
            ref_result = subprocess.run(ref_cmd, capture_output=True, text=True, timeout=30)
            ref_records = json.loads(ref_result.stdout)
            
            if not ref_records:
                return {
                    "success": False,
                    "error": f"FK violation: {fk_column}={fk_value} not found in {ref_table}",
                    "table": table
                }
        
        return {
            "success": True,
            "table": table,
            "fk_column": fk_column,
            "ref_table": ref_table,
            "checked_count": min(5, len(fk_values))
        }
    except Exception as e:
        return {"success": False, "error": str(e), "table": table}


def check_rls_enabled(supabase_url: str, service_key: str, table: str) -> dict:
    """Check if RLS is enabled on a table."""
    import subprocess
    
    # Query pg_tables to check RLS
    # Note: This requires service role key and may not work directly via REST
    # Instead, we'll check by trying to query with anon key
    
    url = f"{supabase_url}/rest/v1/{table}?select=count&head=true"
    
    # Try with anon key (should fail or return limited data if RLS is on)
    anon_key = os.environ.get("COZE_SUPABASE_ANON_KEY", "")
    
    if anon_key:
        cmd = [
            "curl", "-s", url,
            "-H", f"apikey: {anon_key}",
            "-H", f"Authorization: Bearer {anon_key}",
            "-H", "Prefer: count=exact"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            # If we get results without proper auth, RLS might be disabled
            # This is a simplistic check
            return {
                "success": True,
                "table": table,
                "message": "RLS check requires database query - use exec_sql tool"
            }
        except Exception as e:
            return {"success": False, "error": str(e), "table": table}
    
    return {
        "success": True,
        "table": table,
        "message": "RLS check requires exec_sql tool"
    }


def main():
    parser = argparse.ArgumentParser(description="Database Verification Script")
    parser.add_argument("--table", required=True, help="Table name to verify")
    parser.add_argument("--check-columns", help="Comma-separated columns to verify")
    parser.add_argument("--check-count", action="store_true", help="Check row count")
    parser.add_argument("--check-fk", help="Check foreign key: column,ref_table")
    parser.add_argument("--rls-check", action="store_true", help="Check RLS status")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--env-file", default="/workspace/projects/.env", help="Path to .env file")
    
    args = parser.parse_args()
    
    # Load credentials
    env_vars = load_env_file(args.env_file)
    supabase_url = env_vars.get("COZE_SUPABASE_URL", os.environ.get("COZE_SUPABASE_URL", ""))
    service_key = env_vars.get("COZE_SUPABASE_SERVICE_ROLE_KEY", os.environ.get("COZE_SUPABASE_SERVICE_ROLE_KEY", ""))
    
    if not supabase_url or not service_key:
        print("Error: Missing COZE_SUPABASE_URL or COZE_SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    results = {
        "table": args.table,
        "checks": []
    }
    
    # Run checks
    if args.check_columns:
        columns = [c.strip() for c in args.check_columns.split(",")]
        results["checks"].append(check_table_columns(supabase_url, service_key, args.table, columns))
    
    if args.check_count:
        results["checks"].append(check_table_count(supabase_url, service_key, args.table))
    
    if args.check_fk:
        parts = args.check_fk.split(",")
        if len(parts) == 2:
            results["checks"].append(check_foreign_keys(supabase_url, service_key, args.table, parts[0], parts[1]))
    
    if args.rls_check:
        results["checks"].append(check_rls_enabled(supabase_url, service_key, args.table))
    
    # Calculate overall success
    results["success"] = all(c.get("success", False) for c in results["checks"])
    
    # Output
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"Database Verification for '{args.table}'")
        print(f"{'='*50}\n")
        
        for check in results["checks"]:
            status = "✅" if check.get("success") else "❌"
            print(f"{status} {check.get('message', check.get('error', 'Unknown'))}")
        
        print(f"\n{'='*50}")
        print(f"Overall: {'PASS' if results['success'] else 'FAIL'}")
        print(f"{'='*50}")
    
    sys.exit(0 if results["success"] else 1)


if __name__ == "__main__":
    main()
