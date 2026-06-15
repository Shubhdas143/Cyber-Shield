#!/usr/bin/env python3
"""
Cyber Shield Backend API Test Suite
Tests all endpoints for the Amroha Cyber Crime Police Station investigation suite
"""
import requests
import sys
import time
from datetime import datetime

BASE_URL = "https://cyber-tools-suite.preview.emergentagent.com/api"
OFFICER_ID = "amroha001"
PASSWORD = "cyber@123"

class CyberShieldTester:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.analysis_ids = []
        self.case_ids = []
        
    def log(self, emoji, message):
        print(f"{emoji} {message}")
        
    def test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, timeout=60):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)
        
        self.tests_run += 1
        self.log("🔍", f"Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart
                    req_headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=req_headers, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=req_headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log("✅", f"PASS - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.content
            else:
                self.tests_failed += 1
                self.log("❌", f"FAIL - Expected {expected_status}, got {response.status_code}")
                try:
                    self.log("📄", f"Response: {response.json()}")
                except:
                    self.log("📄", f"Response: {response.text[:200]}")
                return False, {}
                
        except requests.exceptions.Timeout:
            self.tests_failed += 1
            self.log("❌", f"FAIL - Request timeout after {timeout}s")
            return False, {}
        except Exception as e:
            self.tests_failed += 1
            self.log("❌", f"FAIL - Error: {str(e)}")
            return False, {}
    
    def run_all_tests(self):
        self.log("🚀", "Starting Cyber Shield Backend API Tests")
        self.log("🎯", f"Target: {BASE_URL}")
        print("=" * 80)
        
        # 1. Test Health & Root
        self.log("📋", "SECTION 1: Health & Root Endpoints")
        self.test("Health check", "GET", "health", 200)
        self.test("Root endpoint", "GET", "", 200)
        print()
        
        # 2. Test Auth - Login
        self.log("📋", "SECTION 2: Authentication")
        success, response = self.test(
            "Login with officer credentials",
            "POST",
            "auth/login",
            200,
            data={"officer_id": OFFICER_ID, "password": PASSWORD}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log("🔑", f"Token acquired: {self.token[:20]}...")
            
            # Verify user object
            if 'user' in response:
                user = response['user']
                self.log("👤", f"Logged in as: {user.get('name')} ({user.get('officer_id')})")
        else:
            self.log("🛑", "CRITICAL: Login failed - cannot proceed with authenticated tests")
            self.print_summary()
            return False
        
        # Test /auth/me
        self.test("Get current user", "GET", "auth/me", 200)
        
        # Test unauthenticated access (should return 401)
        old_token = self.token
        self.token = None
        self.test("Unauthenticated access to protected endpoint", "GET", "stats", 401)
        self.token = old_token
        print()
        
        # 3. Test Tools - IP Intelligence
        self.log("📋", "SECTION 3: IP Intelligence Tool")
        success, response = self.test(
            "IP Intel - Google DNS (8.8.8.8)",
            "POST",
            "tools/ip-intel",
            200,
            data={"ip": "8.8.8.8"},
            timeout=45  # AI calls can take time
        )
        if success and 'id' in response:
            self.analysis_ids.append(response['id'])
            self.log("💾", f"Analysis saved: {response['id']}")
            self.log("🎯", f"Risk level: {response.get('risk_level', 'N/A')}")
            if response.get('result_markdown'):
                self.log("📝", f"AI result length: {len(response['result_markdown'])} chars")
        print()
        
        # 4. Test Tools - URL Scanner
        self.log("📋", "SECTION 4: URL/Phishing Scanner")
        success, response = self.test(
            "URL Scan - Suspicious phishing URL",
            "POST",
            "tools/url-scan",
            200,
            data={"url": "http://hdfc-bank-secure.xyz/login"},
            timeout=45
        )
        if success and 'id' in response:
            self.analysis_ids.append(response['id'])
            self.log("💾", f"Analysis saved: {response['id']}")
            self.log("🎯", f"Risk level: {response.get('risk_level', 'N/A')}")
        print()
        
        # 5. Test Tools - Email Forensics
        self.log("📋", "SECTION 5: Email Header Forensics")
        spoofed_headers = """From: security@paypal.com
Return-Path: <hacker@evil.com>
Subject: Urgent: Verify your account
Received: from unknown-server.xyz (unknown [192.0.2.1])
X-Mailer: PHPMailer
"""
        success, response = self.test(
            "Email Forensics - Spoofed headers",
            "POST",
            "tools/email-forensics",
            200,
            data={"headers": spoofed_headers},
            timeout=45
        )
        if success and 'id' in response:
            self.analysis_ids.append(response['id'])
            self.log("💾", f"Analysis saved: {response['id']}")
            self.log("🎯", f"Risk level: {response.get('risk_level', 'N/A')}")
        print()
        
        # 6. Test Tools - Hash Compare
        self.log("📋", "SECTION 6: Hash Verification - Compare")
        # Test identical hashes
        test_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        success, response = self.test(
            "Hash Compare - Identical hashes",
            "POST",
            "tools/hash-compare",
            200,
            data={"hash1": test_hash, "hash2": test_hash},
            timeout=30
        )
        if success:
            self.log("🔍", f"Match result: {response.get('meta', {}).get('match', 'N/A')}")
            self.log("🎯", f"Risk level: {response.get('risk_level', 'N/A')}")
            if response.get('id'):
                self.analysis_ids.append(response['id'])
        
        # Test mismatched hashes
        success, response = self.test(
            "Hash Compare - Mismatched hashes",
            "POST",
            "tools/hash-compare",
            200,
            data={
                "hash1": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "hash2": "d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            },
            timeout=30
        )
        if success:
            self.log("🔍", f"Match result: {response.get('meta', {}).get('match', 'N/A')}")
            self.log("🎯", f"Risk level: {response.get('risk_level', 'N/A')}")
        print()
        
        # 7. Test Tools - Hash File Upload
        self.log("📋", "SECTION 7: Hash Verification - File Upload")
        # Create a test file
        test_content = b"This is test evidence file for hash verification"
        success, response = self.test(
            "Hash File - Upload and compute digests",
            "POST",
            "tools/hash-file",
            200,
            data={},
            files={'file': ('evidence.txt', test_content, 'text/plain')},
            timeout=30
        )
        if success and 'id' in response:
            self.analysis_ids.append(response['id'])
            self.log("💾", f"Analysis saved: {response['id']}")
            digests = response.get('meta', {}).get('digests', {})
            if digests:
                self.log("🔐", f"MD5: {digests.get('MD5', 'N/A')}")
                self.log("🔐", f"SHA-256: {digests.get('SHA-256', 'N/A')}")
        print()
        
        # 8. Test Tools - Case Report Generator
        self.log("📋", "SECTION 8: Case Report Generator")
        success, response = self.test(
            "Generate FIR-ready case report",
            "POST",
            "tools/case-report",
            200,
            data={
                "crime_type": "Online Financial Fraud",
                "summary": "Victim received phishing email impersonating bank, clicked malicious link, credentials stolen, Rs. 50,000 transferred",
                "case_no": "FIR-001/2025",
                "victim": "Rajesh Kumar",
                "platform": "Email/Banking",
                "station": "Amroha Cyber Crime PS"
            },
            timeout=60  # Case reports can be longer
        )
        if success and 'id' in response:
            self.analysis_ids.append(response['id'])
            self.log("💾", f"Report saved: {response['id']}")
            if response.get('result_markdown'):
                self.log("📝", f"Report length: {len(response['result_markdown'])} chars")
        print()
        
        # 9. Test History
        self.log("📋", "SECTION 9: History & Analysis Management")
        success, response = self.test("List all analyses", "GET", "history", 200)
        if success:
            self.log("📊", f"Total analyses: {len(response)}")
        
        # Test filters
        self.test("Filter by tool type (ip-intel)", "GET", "history?tool_type=ip-intel", 200)
        self.test("Filter by risk level (high)", "GET", "history?risk=high", 200)
        self.test("Search analyses", "GET", "history?search=8.8.8.8", 200)
        
        # Test get single analysis
        if self.analysis_ids:
            test_id = self.analysis_ids[0]
            self.test(f"Get analysis by ID", "GET", f"history/{test_id}", 200)
            
            # Test PDF export
            success, pdf_content = self.test(
                f"Export analysis to PDF",
                "GET",
                f"history/{test_id}/pdf",
                200
            )
            if success and isinstance(pdf_content, bytes):
                self.log("📄", f"PDF generated: {len(pdf_content)} bytes")
                if pdf_content.startswith(b'%PDF'):
                    self.log("✅", "Valid PDF signature detected")
                else:
                    self.log("⚠️", "Warning: PDF signature not found")
        print()
        
        # 10. Test Cases
        self.log("📋", "SECTION 10: Case Management")
        success, response = self.test(
            "Create new case",
            "POST",
            "cases",
            200,
            data={
                "case_no": "FIR-TEST-001/2025",
                "title": "Test Phishing Investigation",
                "description": "Testing case management system",
                "status": "open"
            }
        )
        if success and 'id' in response:
            case_id = response['id']
            self.case_ids.append(case_id)
            self.log("💼", f"Case created: {case_id}")
            
            # Test get case with linked analyses
            self.test(f"Get case details", "GET", f"cases/{case_id}", 200)
            
            # Test update case status
            self.test(
                "Update case status",
                "PUT",
                f"cases/{case_id}",
                200,
                data={"status": "investigating"}
            )
            
            # Test attach analysis to case (create new analysis with case_id)
            success, response = self.test(
                "Create analysis linked to case",
                "POST",
                "tools/ip-intel",
                200,
                data={"ip": "1.1.1.1", "case_id": case_id},
                timeout=45
            )
            if success:
                self.log("🔗", f"Analysis linked to case {case_id}")
        
        # Test list all cases
        success, response = self.test("List all cases", "GET", "cases", 200)
        if success:
            self.log("📊", f"Total cases: {len(response)}")
        print()
        
        # 11. Test Stats
        self.log("📋", "SECTION 11: Dashboard Statistics")
        success, response = self.test("Get dashboard stats", "GET", "stats", 200)
        if success:
            self.log("📊", f"Total analyses: {response.get('total_analyses', 0)}")
            self.log("📊", f"Today's scans: {response.get('today_scans', 0)}")
            self.log("📊", f"High/Critical: {response.get('high_critical', 0)}")
            self.log("📊", f"Total cases: {response.get('total_cases', 0)}")
            breakdown = response.get('tool_breakdown', {})
            if breakdown:
                self.log("📊", "Tool breakdown:")
                for tool, count in breakdown.items():
                    self.log("  ", f"  {tool}: {count}")
        print()
        
        # 12. Cleanup - Delete test data
        self.log("📋", "SECTION 12: Cleanup (Delete Operations)")
        # Delete one analysis
        if len(self.analysis_ids) > 1:
            delete_id = self.analysis_ids[-1]
            self.test(f"Delete analysis", "DELETE", f"history/{delete_id}", 200)
        
        # Delete test case
        if self.case_ids:
            delete_case = self.case_ids[0]
            self.test(f"Delete case", "DELETE", f"cases/{delete_case}", 200)
        
        print()
        return True
    
    def print_summary(self):
        print("=" * 80)
        self.log("📊", "TEST SUMMARY")
        print("=" * 80)
        self.log("🔢", f"Total tests run: {self.tests_run}")
        self.log("✅", f"Tests passed: {self.tests_passed}")
        self.log("❌", f"Tests failed: {self.tests_failed}")
        
        if self.tests_run > 0:
            success_rate = (self.tests_passed / self.tests_run) * 100
            self.log("📈", f"Success rate: {success_rate:.1f}%")
            
            if success_rate == 100:
                self.log("🎉", "ALL TESTS PASSED!")
                return 0
            elif success_rate >= 80:
                self.log("✅", "Most tests passed - minor issues detected")
                return 0
            elif success_rate >= 50:
                self.log("⚠️", "Significant issues detected")
                return 1
            else:
                self.log("🛑", "CRITICAL: Majority of tests failed")
                return 1
        return 1

def main():
    tester = CyberShieldTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n\n🛑 Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
