#!/usr/bin/env python3
"""
End-to-end verification script for supervisor approval flow.

This script tests:
1. Create a data entry (operator)
2. Submit for approval (operator)
3. View pending approvals (supervisor)
4. Approve the entry (supervisor)
5. Verify status changes to 'confirmed'
6. Verify approval is visible (operator)
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional

# Backend API URL
BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
API_BASE = f"{BASE_URL}/api/v1"


class APITester:
    """Simple API tester for supervisor approval flow."""

    def __init__(self):
        self.entry_id: Optional[str] = None

    def print_result(self, step: str, success: bool, details: str = ""):
        """Print test result with color coding."""
        status = "PASS" if success else "FAIL"
        symbol = "[+]" if success else "[x]"
        print(f"{symbol} {step}: {status}")
        if details:
            print(f"    {details}")

    def http_get(self, url: str, params: Optional[dict] = None) -> dict:
        """Perform HTTP GET request."""
        if params:
            query_string = urllib.parse.urlencode(params)
            url = f"{url}?{query_string}"

        req = urllib.request.Request(url)
        req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            return {"error": e.code, "message": e.read().decode()}
        except Exception as e:
            return {"error": str(e)}

    def http_post(self, url: str, data: dict) -> dict:
        """Perform HTTP POST request."""
        json_data = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=json_data, method="POST")
        req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            return {"error": e.code, "message": e.read().decode()}
        except Exception as e:
            return {"error": str(e)}

    def check_backend(self) -> bool:
        """Check if backend is running."""
        try:
            result = self.http_get(f"{BASE_URL}/health")
            if "error" not in result and result.get("status") == "healthy":
                self.print_result(
                    "Backend health check",
                    True,
                    f"Status: {result.get('status', 'unknown')}"
                )
                return True
            else:
                self.print_result("Backend health check", False, str(result))
                return False
        except Exception as e:
            self.print_result("Backend health check", False, str(e))
            return False

    def create_entry(self) -> bool:
        """Create a data entry as operator."""
        try:
            result = self.http_post(
                f"{API_BASE}/operator/data",
                {
                    "data": {
                        "title": "Test Order for Supervisor Approval",
                        "description": "This is a test order to verify the supervisor approval flow",
                        "items": ["item1", "item2"],
                        "quantity": 2
                    },
                    "entry_type": "order"
                }
            )

            if "error" not in result and "entry_id" in result:
                self.entry_id = result.get("entry_id")
                self.print_result(
                    "Create data entry",
                    True,
                    f"Entry ID: {self.entry_id}"
                )
                return True
            else:
                self.print_result(
                    "Create data entry",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("Create data entry", False, str(e))
            return False

    def submit_entry(self) -> bool:
        """Submit the entry for approval."""
        if not self.entry_id:
            self.print_result("Submit entry for approval", False, "No entry ID available")
            return False

        try:
            result = self.http_post(
                f"{API_BASE}/operator/data/{self.entry_id}/submit",
                {}
            )

            if "error" not in result:
                status = result.get("status")
                self.print_result(
                    "Submit entry for approval",
                    status == "submitted",
                    f"Status: {status}"
                )
                return status == "submitted"
            else:
                self.print_result(
                    "Submit entry for approval",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("Submit entry for approval", False, str(e))
            return False

    def view_pending_approvals(self) -> bool:
        """View pending approvals as supervisor."""
        try:
            result = self.http_get(
                f"{API_BASE}/supervisor/data",
                {"status": "submitted"}
            )

            if "error" not in result:
                items = result.get("items", [])
                self.print_result(
                    "View pending approvals",
                    True,
                    f"Found {len(items)} submitted entries"
                )
                return True
            else:
                self.print_result(
                    "View pending approvals",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("View pending approvals", False, str(e))
            return False

    def approve_entry(self) -> bool:
        """Approve the entry as supervisor."""
        if not self.entry_id:
            self.print_result("Approve entry", False, "No entry ID available")
            return False

        try:
            result = self.http_post(
                f"{API_BASE}/supervisor/data/{self.entry_id}/confirm",
                {"confirmation_note": "Approved during verification test"}
            )

            if "error" not in result:
                status = result.get("status")
                self.print_result(
                    "Approve entry",
                    status == "confirmed",
                    f"Status: {status}, Event ID: {result.get('event_id', 'N/A')}"
                )
                return status == "confirmed"
            else:
                self.print_result(
                    "Approve entry",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("Approve entry", False, str(e))
            return False

    def verify_status_confirmed(self) -> bool:
        """Verify the entry status changed to 'confirmed'."""
        if not self.entry_id:
            self.print_result("Verify status is 'confirmed'", False, "No entry ID available")
            return False

        try:
            result = self.http_get(f"{API_BASE}/supervisor/data/{self.entry_id}")

            if "error" not in result:
                status = result.get("status")
                confirmed_by = result.get("confirmed_by_username")
                success = status == "confirmed"
                self.print_result(
                    "Verify status is 'confirmed'",
                    success,
                    f"Status: {status}, Confirmed by: {confirmed_by or 'N/A'}"
                )
                return success
            else:
                self.print_result(
                    "Verify status is 'confirmed'",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("Verify status is 'confirmed'", False, str(e))
            return False

    def verify_visible_to_operator(self) -> bool:
        """Verify the approval is visible to operator."""
        if not self.entry_id:
            self.print_result("Verify approval visible to operator", False, "No entry ID available")
            return False

        try:
            result = self.http_get(f"{API_BASE}/operator/data/{self.entry_id}")

            if "error" not in result:
                status = result.get("status")
                confirmed_at = result.get("confirmed_at")
                success = status == "confirmed" and confirmed_at is not None
                self.print_result(
                    "Verify approval visible to operator",
                    success,
                    f"Status: {status}, Confirmed at: {confirmed_at or 'N/A'}"
                )
                return success
            else:
                self.print_result(
                    "Verify approval visible to operator",
                    False,
                    f"Response: {str(result)[:200]}"
                )
                return False
        except Exception as e:
            self.print_result("Verify approval visible to operator", False, str(e))
            return False

    def run_all_tests(self) -> bool:
        """Run all verification tests."""
        print("=" * 60)
        print("SUPERVISOR APPROVAL FLOW - END-TO-END VERIFICATION")
        print("=" * 60)
        print()

        all_passed = True

        # Step 1: Check backend
        if not self.check_backend():
            print("\n[x] Backend is not running. Exiting.")
            return False

        # Step 2: Create a data entry (operator action)
        print("\n--- OPERATOR ACTIONS ---")
        if not self.create_entry():
            all_passed = False

        # Step 3: Submit for approval (operator action)
        if not self.submit_entry():
            all_passed = False

        # Step 4: View pending approvals (supervisor action)
        print("\n--- SUPERVISOR ACTIONS ---")
        if not self.view_pending_approvals():
            all_passed = False

        # Step 5: Approve the entry (supervisor action)
        if not self.approve_entry():
            all_passed = False

        # Step 6: Verify status changed to 'confirmed'
        print("\n--- VERIFICATION ---")
        if not self.verify_status_confirmed():
            all_passed = False

        # Step 7: Verify approval is visible to operator
        if not self.verify_visible_to_operator():
            all_passed = False

        # Summary
        print()
        print("=" * 60)
        if all_passed:
            print("[+] ALL VERIFICATION TESTS PASSED")
        else:
            print("[x] SOME TESTS FAILED - REVIEW RESULTS ABOVE")
        print("=" * 60)

        return all_passed


def main():
    """Main entry point."""
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
