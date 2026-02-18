#!/bin/bash

# Script to set up remote for harshitvishnoi08 account
# Usage: ./setup-other-remote.sh YOUR_PERSONAL_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./setup-other-remote.sh YOUR_PERSONAL_ACCESS_TOKEN"
    echo ""
    echo "To create a Personal Access Token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Sign in as harshitvishnoi08"
    echo "3. Click 'Generate new token (classic)'"
    echo "4. Select 'repo' scope"
    echo "5. Copy the token and run this script"
    exit 1
fi

TOKEN=$1
git remote set-url other https://${TOKEN}@github.com/harshitvishnoi08/whatsapp-automation.git
echo "Remote 'other' updated with token"
echo "You can now push with: git push other main"
