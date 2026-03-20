#!/bin/bash
# KickScan X Browser Auto-Poster
# Posts tweets via browser automation (no API needed!)

TWEET_TEXT="$1"

if [ -z "$TWEET_TEXT" ]; then
    echo "Usage: ./x-browser-poster.sh 'Your tweet text here'"
    exit 1
fi

echo "🤖 Starting X Browser Auto-Poster..."
echo "📝 Tweet: $TWEET_TEXT"
echo ""

# Open X.com
echo "1️⃣ Opening X.com..."
agent-browser open "https://x.com/compose/tweet"

# Wait for page to load
sleep 3

# Check if we need to login first
echo "2️⃣ Checking login status..."
if agent-browser exists "text='Log in'" 2>/dev/null; then
    echo "❌ Not logged in. Please log in first:"
    echo "   1. Browser window will open"
    echo "   2. Log into your @kickscanio account"  
    echo "   3. Keep browser open and run script again"
    
    # Open login page
    agent-browser open "https://x.com/i/flow/login"
    
    # Wait for user to login manually
    echo "   4. Press ENTER after you've logged in..."
    read -p ""
    
    # Go to compose page after login
    agent-browser open "https://x.com/compose/tweet"
    sleep 2
fi

# Type the tweet
echo "3️⃣ Typing tweet..."
if agent-browser exists "div[data-testid='tweetTextarea_0']"; then
    agent-browser click "div[data-testid='tweetTextarea_0']"
    sleep 1
    agent-browser type "div[data-testid='tweetTextarea_0']" "$TWEET_TEXT"
    sleep 1
    
    # Post the tweet
    echo "4️⃣ Publishing tweet..."
    agent-browser click "div[data-testid='tweetButtonInline']"
    
    sleep 2
    echo "✅ Tweet posted successfully!"
    echo "🔗 Check: https://x.com/kickscanio"
    
else
    echo "❌ Could not find tweet composer. Please check if you're logged in."
fi

echo ""
echo "🤖 Browser automation complete!"