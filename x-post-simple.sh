#!/bin/bash
# Simple X Poster using agent-browser

TWEET="$1"

echo "🚀 Opening X.com to post tweet..."
echo "📝 Tweet content: $TWEET"
echo ""

# Open X and wait for manual login if needed
agent-browser open "https://x.com/home"

echo "⏳ Waiting 5 seconds for page load..."
sleep 5

# Try to find and click the tweet composer
echo "🎯 Looking for tweet composer..."
agent-browser click "div[data-testid=\"tweetTextarea_0\"]" 2>/dev/null || \
agent-browser click "div[role=\"textbox\"]" 2>/dev/null || \
agent-browser click ".DraftEditor-root" 2>/dev/null || \
agent-browser click ".public-DraftEditor-content" 2>/dev/null

echo "✏️ Typing tweet..."
sleep 1
agent-browser keyboard type "$TWEET"

echo "📤 Looking for Post button..."
sleep 2
agent-browser click "div[data-testid=\"tweetButtonInline\"]" 2>/dev/null || \
agent-browser click "div[data-testid=\"tweetButton\"]" 2>/dev/null || \
agent-browser click "button:contains('Post')" 2>/dev/null

echo "✅ Done! Check your X profile to see if it posted."
echo "🔗 https://x.com/kickscanio"