#!/usr/bin/env python3
"""
Simple API test script for API Shield backend
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_api():
    print("Testing API Shield Backend...")
    print("=" * 50)
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/auth/user-info/")
        print(f"✓ Server is running (Status: {response.status_code})")
    except requests.exceptions.ConnectionError:
        print("✗ Server is not running. Please start the Django server first.")
        return
    
    # Test 2: Login
    login_data = {
        "email": "john@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"✓ Login successful (User: {data['user']['email']})")
        else:
            print(f"✗ Login failed (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return
    except Exception as e:
        print(f"✗ Login error: {e}")
        return
    
    # Test 3: Get dashboard stats
    headers = {"Authorization": f"Token {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/dashboard/stats/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Dashboard stats retrieved")
            print(f"  - Total requests: {data['total_requests']}")
            print(f"  - Blocked threats: {data['blocked_threats']}")
            print(f"  - Active endpoints: {data['active_endpoints']}")
        else:
            print(f"✗ Dashboard stats failed (Status: {response.status_code})")
    except Exception as e:
        print(f"✗ Dashboard stats error: {e}")
    
    # Test 4: Get API endpoints
    try:
        response = requests.get(f"{BASE_URL}/endpoints/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API endpoints retrieved ({len(data)} endpoints)")
            for endpoint in data[:3]:  # Show first 3
                print(f"  - {endpoint['method']} {endpoint['path']}")
        else:
            print(f"✗ API endpoints failed (Status: {response.status_code})")
    except Exception as e:
        print(f"✗ API endpoints error: {e}")
    
    # Test 5: Get WAF rules
    try:
        response = requests.get(f"{BASE_URL}/waf-rules/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ WAF rules retrieved ({len(data)} rules)")
            for rule in data[:3]:  # Show first 3
                print(f"  - {rule['name']} ({rule['rule_type']})")
        else:
            print(f"✗ WAF rules failed (Status: {response.status_code})")
    except Exception as e:
        print(f"✗ WAF rules error: {e}")
    
    # Test 6: Get threat logs
    try:
        response = requests.get(f"{BASE_URL}/threat-logs/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Threat logs retrieved ({len(data)} logs)")
            for log in data[:3]:  # Show first 3
                print(f"  - {log['threat_type']} from {log['source_ip']}")
        else:
            print(f"✗ Threat logs failed (Status: {response.status_code})")
    except Exception as e:
        print(f"✗ Threat logs error: {e}")
    
    print("\n" + "=" * 50)
    print("API test completed!")

if __name__ == "__main__":
    test_api() 