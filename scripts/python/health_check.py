#!/usr/bin/env python3
"""
Simple health check script that makes a GET request to the application base URL.
"""

import os
import sys
import urllib.request
import urllib.error

def main():
    # Get base URL from environment variable or use default
    base_url = os.environ.get('APP_BASE_URL', 'http://localhost:3000')
    
    print(f"Making GET request to: {base_url}")
    
    try:
        # Create request
        request = urllib.request.Request(base_url, method='GET')
        
        # Make the request
        with urllib.request.urlopen(request, timeout=10) as response:
            status_code = response.status
            content_type = response.headers.get('Content-Type', 'unknown')
            body = response.read().decode('utf-8')
            
            print(f"\n✓ Success!")
            print(f"Status Code: {status_code}")
            print(f"Content-Type: {content_type}")
            print(f"Response Length: {len(body)} bytes")
            
            # Optionally print first 200 characters of response
            if len(body) > 200:
                print(f"\nFirst 200 characters of response:")
                print(body[:200] + "...")
            else:
                print(f"\nResponse body:")
                print(body)
            
            return 0
            
    except urllib.error.HTTPError as e:
        print(f"\n✗ HTTP Error: {e.code} - {e.reason}")
        print(f"Response: {e.read().decode('utf-8', errors='ignore')}")
        return 1
        
    except urllib.error.URLError as e:
        print(f"\n✗ URL Error: {e.reason}")
        print("Make sure the application is running and the URL is correct.")
        return 1
        
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")
        return 1

if __name__ == '__main__':
    sys.exit(main())

