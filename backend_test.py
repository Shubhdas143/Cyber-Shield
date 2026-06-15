#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Cyber Shield
Tests all NEW tool endpoints added in Round 2
"""

import requests
import json
import io
from PIL import Image
import time

# Base URL from frontend/.env
BASE_URL = "https://c1c183e7-aced-4bee-ab5b-36186b763d4f.preview.emergentagent.com/api"

# Test credentials
CREDENTIALS = {
    "officer_id": "amroha001",
    "password": "cyber@123"
}

# Global token storage
TOKEN = None

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log_test(name, passed, details=""):
    """Log test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"].append(name)
        print(f"✅ PASS: {name}")
    else:
        test_results["failed"].append({"name": name, "details": details})
        print(f"❌ FAIL: {name}")
        if details:
            print(f"   Details: {details}")

def authenticate():
    """Authenticate and get Bearer token"""
    global TOKEN
    print("\n" + "="*80)
    print("AUTHENTICATION")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=CREDENTIALS,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            TOKEN = data.get("access_token")
            print(f"✅ Authentication successful")
            print(f"   Token: {TOKEN[:20]}...")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False

def get_headers():
    """Get headers with Bearer token"""
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

def test_port_scan():
    """Test 1: Port Scanner endpoint"""
    print("\n" + "="*80)
    print("TEST 1: PORT SCANNER")
    print("="*80)
    
    # Test 1a: Common mode with scanme.nmap.org
    try:
        response = requests.post(
            f"{BASE_URL}/tools/port-scan",
            headers=get_headers(),
            json={"target": "scanme.nmap.org", "mode": "common"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            open_ports = meta.get("open_ports", [])
            port_numbers = [p["port"] for p in open_ports]
            risk_level = data.get("risk_level")
            result_markdown = data.get("result_markdown", "")
            
            # Check for ports 22 and 80
            has_22 = 22 in port_numbers
            has_80 = 80 in port_numbers
            has_risk = risk_level is not None
            has_markdown = len(result_markdown) > 0
            
            if has_22 and has_80 and has_risk and has_markdown:
                log_test("Port scan - common mode (scanme.nmap.org)", True)
                print(f"   Open ports: {port_numbers}")
                print(f"   Risk level: {risk_level}")
            else:
                log_test("Port scan - common mode (scanme.nmap.org)", False, 
                        f"Missing expected data: 22={has_22}, 80={has_80}, risk={has_risk}, markdown={has_markdown}")
        else:
            log_test("Port scan - common mode (scanme.nmap.org)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Port scan - common mode (scanme.nmap.org)", False, str(e))
    
    # Test 1b: Common range mode
    try:
        response = requests.post(
            f"{BASE_URL}/tools/port-scan",
            headers=get_headers(),
            json={"target": "scanme.nmap.org", "mode": "common_range", "start_port": 75, "end_port": 90},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            scanned = meta.get("scanned", 0)
            
            # Should scan more than just common ports
            if scanned > 20:  # Common ports list is typically ~20 ports
                log_test("Port scan - common_range mode", True)
                print(f"   Scanned ports: {scanned}")
            else:
                log_test("Port scan - common_range mode", False, 
                        f"Scanned count too low: {scanned}")
        else:
            log_test("Port scan - common_range mode", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Port scan - common_range mode", False, str(e))
    
    # Test 1c: Invalid host
    try:
        response = requests.post(
            f"{BASE_URL}/tools/port-scan",
            headers=get_headers(),
            json={"target": "thishostdoesnotexist.invalid", "mode": "common"},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("Port scan - invalid host (400)", True)
        else:
            log_test("Port scan - invalid host (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Port scan - invalid host (400)", False, str(e))
    
    # Test 1d: Invalid port range (start > end)
    try:
        response = requests.post(
            f"{BASE_URL}/tools/port-scan",
            headers=get_headers(),
            json={"target": "scanme.nmap.org", "mode": "common_range", "start_port": 90, "end_port": 10},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("Port scan - invalid range (start>end)", True)
        else:
            log_test("Port scan - invalid range (start>end)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Port scan - invalid range (start>end)", False, str(e))

def test_ipv6_convert():
    """Test 2: IPv6 Converter endpoint"""
    print("\n" + "="*80)
    print("TEST 2: IPv6 CONVERTER")
    print("="*80)
    
    # Test 2a: Valid IPv4
    try:
        response = requests.post(
            f"{BASE_URL}/tools/ipv6-convert",
            headers=get_headers(),
            json={"ip": "103.21.58.10"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            conversions = meta.get("conversions", {})
            ipv4_mapped = conversions.get("ipv4_mapped")
            sixto4_prefix = conversions.get("sixto4_prefix")
            risk_level = data.get("risk_level")
            
            expected_mapped = "::ffff:103.21.58.10"
            expected_sixto4 = "2002:6715:3a0a::/48"
            
            if ipv4_mapped == expected_mapped and sixto4_prefix == expected_sixto4 and risk_level is None:
                log_test("IPv6 convert - valid IPv4", True)
                print(f"   IPv4-mapped: {ipv4_mapped}")
                print(f"   6to4 prefix: {sixto4_prefix}")
            else:
                log_test("IPv6 convert - valid IPv4", False, 
                        f"Mismatch: mapped={ipv4_mapped} (expected {expected_mapped}), "
                        f"sixto4={sixto4_prefix} (expected {expected_sixto4}), risk={risk_level}")
        else:
            log_test("IPv6 convert - valid IPv4", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("IPv6 convert - valid IPv4", False, str(e))
    
    # Test 2b: Invalid IPv4
    try:
        response = requests.post(
            f"{BASE_URL}/tools/ipv6-convert",
            headers=get_headers(),
            json={"ip": "999.1.1.1"},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("IPv6 convert - invalid IPv4 (400)", True)
        else:
            log_test("IPv6 convert - invalid IPv4 (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("IPv6 convert - invalid IPv4 (400)", False, str(e))

def test_breach_check():
    """Test 3: Password Breach Checker endpoint"""
    print("\n" + "="*80)
    print("TEST 3: PASSWORD BREACH CHECKER")
    print("="*80)
    
    # Test 3a: Common password
    try:
        response = requests.post(
            f"{BASE_URL}/tools/breach-check",
            headers=get_headers(),
            json={"password": "password"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            found = meta.get("found")
            count = meta.get("count", 0)
            risk_level = data.get("risk_level")
            
            if found and count > 1000000 and risk_level in ["critical", "high"]:
                log_test("Breach check - common password", True)
                print(f"   Found: {found}, Count: {count:,}, Risk: {risk_level}")
            else:
                log_test("Breach check - common password", False, 
                        f"Unexpected result: found={found}, count={count}, risk={risk_level}")
        else:
            log_test("Breach check - common password", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Breach check - common password", False, str(e))
    
    # Test 3b: Strong random password
    try:
        response = requests.post(
            f"{BASE_URL}/tools/breach-check",
            headers=get_headers(),
            json={"password": "Zx9$kQ2mFvL8tR4wPn7!aB"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            found = meta.get("found")
            risk_level = data.get("risk_level")
            
            if not found and risk_level == "clean":
                log_test("Breach check - strong password", True)
                print(f"   Found: {found}, Risk: {risk_level}")
            else:
                log_test("Breach check - strong password", False, 
                        f"Unexpected result: found={found}, risk={risk_level}")
        else:
            log_test("Breach check - strong password", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Breach check - strong password", False, str(e))
    
    # Test 3c: Privacy check - verify password not stored
    print("\n   Testing privacy (password not stored in history)...")
    try:
        # First, create a breach check
        response = requests.post(
            f"{BASE_URL}/tools/breach-check",
            headers=get_headers(),
            json={"password": "testpassword123"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            analysis_id = data.get("id")
            
            # Now fetch the analysis from history
            history_response = requests.get(
                f"{BASE_URL}/history/{analysis_id}",
                headers=get_headers(),
                timeout=30
            )
            
            if history_response.status_code == 200:
                history_data = history_response.json()
                input_data = history_data.get("input", {})
                target = history_data.get("target", "")
                
                # Check that plaintext password is NOT in input or target
                has_length = "length" in input_data
                has_note = "note" in input_data
                no_password_in_input = "testpassword123" not in json.dumps(input_data)
                no_password_in_target = "testpassword123" not in target
                
                if has_length and has_note and no_password_in_input and no_password_in_target:
                    log_test("Breach check - privacy (no plaintext stored)", True)
                    print(f"   Input contains: {list(input_data.keys())}")
                else:
                    log_test("Breach check - privacy (no plaintext stored)", False, 
                            f"Privacy violation: length={has_length}, note={has_note}, "
                            f"no_pwd_input={no_password_in_input}, no_pwd_target={no_password_in_target}")
            else:
                log_test("Breach check - privacy (no plaintext stored)", False, 
                        f"Could not fetch history: {history_response.status_code}")
        else:
            log_test("Breach check - privacy (no plaintext stored)", False, 
                    f"Could not create breach check: {response.status_code}")
    except Exception as e:
        log_test("Breach check - privacy (no plaintext stored)", False, str(e))

def test_catalog():
    """Test 4: Tools Directory catalog endpoint"""
    print("\n" + "="*80)
    print("TEST 4: TOOLS CATALOG")
    print("="*80)
    
    # Test 4a: With authentication
    try:
        response = requests.get(
            f"{BASE_URL}/catalog/tools",
            headers=get_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            count = data.get("count", 0)
            types = data.get("types", [])
            
            if count == 32 and len(types) == 4:
                log_test("Catalog - authenticated (32 tools, 4 types)", True)
                print(f"   Count: {count}, Types: {len(types)}")
            else:
                log_test("Catalog - authenticated (32 tools, 4 types)", False, 
                        f"Expected count=32, types=4; got count={count}, types={len(types)}")
        else:
            log_test("Catalog - authenticated (32 tools, 4 types)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Catalog - authenticated (32 tools, 4 types)", False, str(e))
    
    # Test 4b: Without authentication
    try:
        response = requests.get(
            f"{BASE_URL}/catalog/tools",
            timeout=30
        )
        
        if response.status_code in [401, 403]:
            log_test("Catalog - unauthenticated (401/403)", True)
        else:
            log_test("Catalog - unauthenticated (401/403)", False, 
                    f"Expected 401/403, got {response.status_code}")
    except Exception as e:
        log_test("Catalog - unauthenticated (401/403)", False, str(e))

def test_dns_recon():
    """Test 5: DNS Recon endpoint"""
    print("\n" + "="*80)
    print("TEST 5: DNS RECON")
    print("="*80)
    
    # Test 5a: Valid domain
    try:
        response = requests.post(
            f"{BASE_URL}/tools/dns-recon",
            headers=get_headers(),
            json={"domain": "github.com"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            records = meta.get("records", {})
            subdomains = meta.get("subdomains", [])
            result_markdown = data.get("result_markdown", "")
            
            has_a = len(records.get("A", [])) > 0
            has_ns = len(records.get("NS", [])) > 0
            has_subdomains = len(subdomains) > 0
            has_markdown = len(result_markdown) > 0
            
            if has_a and has_ns and has_subdomains and has_markdown:
                log_test("DNS recon - valid domain (github.com)", True)
                print(f"   A records: {len(records.get('A', []))}")
                print(f"   NS records: {len(records.get('NS', []))}")
                print(f"   Subdomains: {len(subdomains)}")
            else:
                log_test("DNS recon - valid domain (github.com)", False, 
                        f"Missing data: A={has_a}, NS={has_ns}, subdomains={has_subdomains}, markdown={has_markdown}")
        else:
            log_test("DNS recon - valid domain (github.com)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("DNS recon - valid domain (github.com)", False, str(e))
    
    # Test 5b: Invalid domain
    try:
        response = requests.post(
            f"{BASE_URL}/tools/dns-recon",
            headers=get_headers(),
            json={"domain": "nonexistent-zzz.invalidtld"},
            timeout=60
        )
        
        if response.status_code in [400, 502]:
            log_test("DNS recon - invalid domain (400/502)", True)
        else:
            log_test("DNS recon - invalid domain (400/502)", False, 
                    f"Expected 400/502, got {response.status_code}")
    except Exception as e:
        log_test("DNS recon - invalid domain (400/502)", False, str(e))

def test_ssl_inspect():
    """Test 6: SSL/TLS Inspector endpoint"""
    print("\n" + "="*80)
    print("TEST 6: SSL/TLS INSPECTOR")
    print("="*80)
    
    # Test 6a: Valid host
    try:
        response = requests.post(
            f"{BASE_URL}/tools/ssl-inspect",
            headers=get_headers(),
            json={"host": "github.com"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            certificate = meta.get("certificate", {})
            subject_cn = certificate.get("subject_cn")
            is_expired = certificate.get("is_expired")
            days_until_expiry = certificate.get("days_until_expiry")
            
            has_subject = subject_cn is not None and len(subject_cn) > 0
            not_expired = is_expired == False
            has_days = isinstance(days_until_expiry, int)
            
            if has_subject and not_expired and has_days:
                log_test("SSL inspect - valid host (github.com)", True)
                print(f"   Subject CN: {subject_cn}")
                print(f"   Expired: {is_expired}")
                print(f"   Days until expiry: {days_until_expiry}")
            else:
                log_test("SSL inspect - valid host (github.com)", False, 
                        f"Missing data: subject={has_subject}, not_expired={not_expired}, days={has_days}")
        else:
            log_test("SSL inspect - valid host (github.com)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("SSL inspect - valid host (github.com)", False, str(e))
    
    # Test 6b: Expired certificate
    try:
        response = requests.post(
            f"{BASE_URL}/tools/ssl-inspect",
            headers=get_headers(),
            json={"host": "expired.badssl.com"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            certificate = meta.get("certificate", {})
            is_expired = certificate.get("is_expired")
            risk_level = data.get("risk_level")
            
            if is_expired == True and risk_level == "high":
                log_test("SSL inspect - expired cert (expired.badssl.com)", True)
                print(f"   Expired: {is_expired}, Risk: {risk_level}")
            else:
                log_test("SSL inspect - expired cert (expired.badssl.com)", False, 
                        f"Expected expired=True, risk=high; got expired={is_expired}, risk={risk_level}")
        else:
            log_test("SSL inspect - expired cert (expired.badssl.com)", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("SSL inspect - expired cert (expired.badssl.com)", False, str(e))
    
    # Test 6c: Invalid host
    try:
        response = requests.post(
            f"{BASE_URL}/tools/ssl-inspect",
            headers=get_headers(),
            json={"host": "thishostdoesnotexist.invalid"},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("SSL inspect - invalid host (400)", True)
        else:
            log_test("SSL inspect - invalid host (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("SSL inspect - invalid host (400)", False, str(e))

def test_exif_forensics():
    """Test 7: EXIF Forensics endpoint"""
    print("\n" + "="*80)
    print("TEST 7: EXIF FORENSICS")
    print("="*80)
    
    # Test 7a: Valid image (generated JPEG)
    try:
        # Create a small test image
        img = Image.new('RGB', (64, 64), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
        headers_no_content_type = {"Authorization": f"Bearer {TOKEN}"}
        
        response = requests.post(
            f"{BASE_URL}/tools/exif-forensics",
            headers=headers_no_content_type,
            files=files,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            tool_type = data.get("tool_type")
            meta = data.get("meta", {})
            has_exif = "has_exif" in meta
            risk_level = data.get("risk_level")
            
            if tool_type == "exif-forensics" and has_exif and risk_level is None:
                log_test("EXIF forensics - valid image", True)
                print(f"   Tool type: {tool_type}")
                print(f"   Has EXIF: {meta.get('has_exif')}")
            else:
                log_test("EXIF forensics - valid image", False, 
                        f"Unexpected result: tool_type={tool_type}, has_exif={has_exif}, risk={risk_level}")
        else:
            log_test("EXIF forensics - valid image", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("EXIF forensics - valid image", False, str(e))
    
    # Test 7b: Non-image file
    try:
        txt_content = io.BytesIO(b"This is a text file, not an image")
        files = {'file': ('test.txt', txt_content, 'text/plain')}
        headers_no_content_type = {"Authorization": f"Bearer {TOKEN}"}
        
        response = requests.post(
            f"{BASE_URL}/tools/exif-forensics",
            headers=headers_no_content_type,
            files=files,
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("EXIF forensics - non-image file (400)", True)
        else:
            log_test("EXIF forensics - non-image file (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("EXIF forensics - non-image file (400)", False, str(e))

def test_imei_track():
    """Test 8: IMEI Analysis endpoint"""
    print("\n" + "="*80)
    print("TEST 8: IMEI ANALYSIS")
    print("="*80)
    
    # Test 8a: Valid IMEI
    try:
        response = requests.post(
            f"{BASE_URL}/tools/imei-track",
            headers=get_headers(),
            json={"imei": "490154203237518"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            luhn_valid = meta.get("luhn_valid")
            
            if luhn_valid == True:
                log_test("IMEI track - valid IMEI", True)
                print(f"   Luhn valid: {luhn_valid}")
            else:
                log_test("IMEI track - valid IMEI", False, 
                        f"Expected luhn_valid=True, got {luhn_valid}")
        else:
            log_test("IMEI track - valid IMEI", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("IMEI track - valid IMEI", False, str(e))
    
    # Test 8b: Invalid IMEI (wrong check digit)
    try:
        response = requests.post(
            f"{BASE_URL}/tools/imei-track",
            headers=get_headers(),
            json={"imei": "490154203237510"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            luhn_valid = meta.get("luhn_valid")
            
            if luhn_valid == False:
                log_test("IMEI track - invalid check digit", True)
                print(f"   Luhn valid: {luhn_valid}")
            else:
                log_test("IMEI track - invalid check digit", False, 
                        f"Expected luhn_valid=False, got {luhn_valid}")
        else:
            log_test("IMEI track - invalid check digit", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("IMEI track - invalid check digit", False, str(e))
    
    # Test 8c: Invalid IMEI (too short)
    try:
        response = requests.post(
            f"{BASE_URL}/tools/imei-track",
            headers=get_headers(),
            json={"imei": "123"},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("IMEI track - too short (400)", True)
        else:
            log_test("IMEI track - too short (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("IMEI track - too short (400)", False, str(e))

def test_dark_web():
    """Test 9: Dark Web Exposure endpoint"""
    print("\n" + "="*80)
    print("TEST 9: DARK WEB EXPOSURE")
    print("="*80)
    
    # Test 9a: Email identifier
    try:
        response = requests.post(
            f"{BASE_URL}/tools/dark-web",
            headers=get_headers(),
            json={"identifier": "victim@example.com"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            kind = meta.get("kind")
            risk_level = data.get("risk_level")
            result_markdown = data.get("result_markdown", "")
            
            if kind == "email" and risk_level is not None and len(result_markdown) > 0:
                log_test("Dark web - email identifier", True)
                print(f"   Kind: {kind}, Risk: {risk_level}")
            else:
                log_test("Dark web - email identifier", False, 
                        f"Unexpected result: kind={kind}, risk={risk_level}, markdown_len={len(result_markdown)}")
        else:
            log_test("Dark web - email identifier", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Dark web - email identifier", False, str(e))
    
    # Test 9b: Domain identifier
    try:
        response = requests.post(
            f"{BASE_URL}/tools/dark-web",
            headers=get_headers(),
            json={"identifier": "example.com"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            kind = meta.get("kind")
            
            if kind == "domain":
                log_test("Dark web - domain identifier", True)
                print(f"   Kind: {kind}")
            else:
                log_test("Dark web - domain identifier", False, 
                        f"Expected kind=domain, got {kind}")
        else:
            log_test("Dark web - domain identifier", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Dark web - domain identifier", False, str(e))
    
    # Test 9c: Empty identifier
    try:
        response = requests.post(
            f"{BASE_URL}/tools/dark-web",
            headers=get_headers(),
            json={"identifier": ""},
            timeout=30
        )
        
        if response.status_code == 400:
            log_test("Dark web - empty identifier (400)", True)
        else:
            log_test("Dark web - empty identifier (400)", False, 
                    f"Expected 400, got {response.status_code}")
    except Exception as e:
        log_test("Dark web - empty identifier (400)", False, str(e))

def test_stats():
    """Test 10: Stats endpoint"""
    print("\n" + "="*80)
    print("TEST 10: STATS")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/stats",
            headers=get_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            tool_breakdown = data.get("tool_breakdown", {})
            
            required_tools = [
                "port-scan", "ipv6-convert", "breach-verify", 
                "dns-recon", "ssl-inspect", "exif-forensics", 
                "imei-track", "dark-web"
            ]
            
            missing_tools = [tool for tool in required_tools if tool not in tool_breakdown]
            
            if not missing_tools:
                log_test("Stats - tool breakdown includes all new tools", True)
                print(f"   Tool breakdown keys: {list(tool_breakdown.keys())}")
            else:
                log_test("Stats - tool breakdown includes all new tools", False, 
                        f"Missing tools: {missing_tools}")
        else:
            log_test("Stats - tool breakdown includes all new tools", False, 
                    f"Status {response.status_code}: {response.text[:200]}")
    except Exception as e:
        log_test("Stats - tool breakdown includes all new tools", False, str(e))

def test_pdf_generation():
    """Test 11: PDF generation for all new tool types"""
    print("\n" + "="*80)
    print("TEST 11: PDF GENERATION")
    print("="*80)
    
    # Map of tool types to test data
    tool_tests = {
        "port-scan": {"target": "scanme.nmap.org", "mode": "common"},
        "ipv6-convert": {"ip": "8.8.8.8"},
        "breach-verify": {"password": "testpwd123"},
        "dns-recon": {"domain": "example.com"},
        "ssl-inspect": {"host": "example.com"},
        "imei-track": {"imei": "490154203237518"},
        "dark-web": {"identifier": "test@example.com"},
    }
    
    analysis_ids = {}
    
    # Create one analysis of each type
    for tool_type, test_data in tool_tests.items():
        try:
            endpoint = tool_type if tool_type != "breach-verify" else "breach-check"
            response = requests.post(
                f"{BASE_URL}/tools/{endpoint}",
                headers=get_headers(),
                json=test_data,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis_ids[tool_type] = data.get("id")
                print(f"   Created {tool_type} analysis: {analysis_ids[tool_type]}")
            else:
                print(f"   ⚠️  Could not create {tool_type} analysis: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Error creating {tool_type} analysis: {e}")
    
    # Test PDF generation for each
    for tool_type, analysis_id in analysis_ids.items():
        try:
            response = requests.get(
                f"{BASE_URL}/history/{analysis_id}/pdf",
                headers=get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                content_type = response.headers.get("Content-Type", "")
                content_length = len(response.content)
                
                if content_type == "application/pdf" and content_length > 0:
                    log_test(f"PDF generation - {tool_type}", True)
                    print(f"   PDF size: {content_length} bytes")
                else:
                    log_test(f"PDF generation - {tool_type}", False, 
                            f"Invalid PDF: content_type={content_type}, size={content_length}")
            else:
                log_test(f"PDF generation - {tool_type}", False, 
                        f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            log_test(f"PDF generation - {tool_type}", False, str(e))
    
    # Test EXIF forensics PDF separately (requires file upload)
    try:
        img = Image.new('RGB', (64, 64), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test_pdf.jpg', img_bytes, 'image/jpeg')}
        headers_no_content_type = {"Authorization": f"Bearer {TOKEN}"}
        
        response = requests.post(
            f"{BASE_URL}/tools/exif-forensics",
            headers=headers_no_content_type,
            files=files,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            exif_id = data.get("id")
            
            pdf_response = requests.get(
                f"{BASE_URL}/history/{exif_id}/pdf",
                headers=get_headers(),
                timeout=30
            )
            
            if pdf_response.status_code == 200:
                content_type = pdf_response.headers.get("Content-Type", "")
                content_length = len(pdf_response.content)
                
                if content_type == "application/pdf" and content_length > 0:
                    log_test("PDF generation - exif-forensics", True)
                    print(f"   PDF size: {content_length} bytes")
                else:
                    log_test("PDF generation - exif-forensics", False, 
                            f"Invalid PDF: content_type={content_type}, size={content_length}")
            else:
                log_test("PDF generation - exif-forensics", False, 
                        f"Status {pdf_response.status_code}")
        else:
            log_test("PDF generation - exif-forensics", False, 
                    f"Could not create EXIF analysis: {response.status_code}")
    except Exception as e:
        log_test("PDF generation - exif-forensics", False, str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total = test_results["total"]
    passed = len(test_results["passed"])
    failed = len(test_results["failed"])
    
    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success rate: {(passed/total*100):.1f}%")
    
    if test_results["failed"]:
        print("\n" + "-"*80)
        print("FAILED TESTS:")
        print("-"*80)
        for failure in test_results["failed"]:
            print(f"\n❌ {failure['name']}")
            if failure['details']:
                print(f"   {failure['details']}")

def main():
    """Main test execution"""
    print("="*80)
    print("CYBER SHIELD BACKEND API TEST SUITE")
    print("Testing all NEW tool endpoints (Round 2)")
    print("="*80)
    
    # Authenticate first
    if not authenticate():
        print("\n❌ Authentication failed. Cannot proceed with tests.")
        return
    
    # Run all tests
    test_port_scan()
    test_ipv6_convert()
    test_breach_check()
    test_catalog()
    test_dns_recon()
    test_ssl_inspect()
    test_exif_forensics()
    test_imei_track()
    test_dark_web()
    test_stats()
    test_pdf_generation()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main()
