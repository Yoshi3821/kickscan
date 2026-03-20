#!/usr/bin/env python3
"""
KickScan X (Twitter) Auto-Poster
Uses X API v2 to post tweets automatically
"""

import requests
import json
import sys
from datetime import datetime
from requests_oauthlib import OAuth1

# Your NEW X API credentials with Read+Write permissions
API_KEY = "D4CV4EHNZso6O9pk3pq3dwXyB"
API_SECRET = "dYci1wOrTZzeTv2YGrKPKr4vWzqJna3x3EVUkvijAymg8zGZtF"
ACCESS_TOKEN = "2034635366700064768-qZ2UriX20Po6eS8uwMrLxbcDjf5M5N"
ACCESS_TOKEN_SECRET = "oqAV5pug1NSnmwhSI5Qaz8p6bMiJP5xM4TzFhAT3Ze0Pw"

# OAuth 1.0a authentication
auth = OAuth1(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)

def post_tweet(text):
    """Post a tweet using X API v2"""
    url = "https://api.twitter.com/2/tweets"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, auth=auth)
        
        if response.status_code == 201:
            data = response.json()
            tweet_id = data['data']['id']
            print(f"✅ Tweet posted successfully!")
            print(f"Tweet ID: {tweet_id}")
            print(f"Content: {text}")
            return True
        else:
            print(f"❌ Error posting tweet:")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception posting tweet: {e}")
        return False

def test_connection():
    """Test X API connection"""
    url = "https://api.twitter.com/2/users/me"
    
    try:
        response = requests.get(url, auth=auth)
        
        if response.status_code == 200:
            data = response.json()
            username = data['data']['username']
            print(f"✅ Connected to X API!")
            print(f"Account: @{username}")
            return True
        else:
            print(f"❌ API connection failed:")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 x-poster.py 'Your tweet text here'")
        print("   or: python3 x-poster.py --test")
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        test_connection()
    else:
        tweet_text = " ".join(sys.argv[1:])
        post_tweet(tweet_text)