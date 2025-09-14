#!/bin/bash

# GitHub Secrets Setup Script for Ethiopia Community Resources
# This script helps you set up all required GitHub secrets for CI/CD

set -e

echo "🔐 GitHub Secrets Setup for Ethiopia Community Resources"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo "Or run: brew install gh"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to login to GitHub CLI first.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"
echo ""

# Get repository information
REPO_OWNER="nebiyou1"
REPO_NAME="Ethiopian-Community-Resources"
REPO_FULL="${REPO_OWNER}/${REPO_NAME}"

echo -e "${BLUE}📋 Repository: ${REPO_FULL}${NC}"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}Setting ${secret_name}...${NC}"
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ ${secret_name} value is empty. Skipping.${NC}"
        return 1
    fi
    
    if echo "$secret_value" | gh secret set "$secret_name" --repo="$REPO_FULL"; then
        echo -e "${GREEN}✅ ${secret_name} set successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to set ${secret_name}${NC}"
        return 1
    fi
}

# Function to prompt for secret value
prompt_secret() {
    local secret_name=$1
    local description=$2
    local default_value=$3
    
    echo ""
    echo -e "${BLUE}🔑 ${secret_name}${NC}"
    echo -e "${YELLOW}Description: ${description}${NC}"
    
    if [ -n "$default_value" ]; then
        echo -e "${YELLOW}Default: ${default_value}${NC}"
        read -p "Enter value (or press Enter for default): " input_value
        if [ -z "$input_value" ]; then
            input_value="$default_value"
        fi
    else
        read -p "Enter value: " input_value
    fi
    
    echo "$input_value"
}

echo -e "${BLUE}🚀 Starting GitHub Secrets Setup...${NC}"
echo ""

# Supabase Secrets
echo -e "${BLUE}=== Supabase Configuration ===${NC}"

SUPABASE_URL=$(prompt_secret "SUPABASE_URL" "Your Supabase project URL" "https://qvqybobnsaikaknsdqhw.supabase.co")
set_secret "SUPABASE_URL" "$SUPABASE_URL" "Supabase project URL"

SUPABASE_ANON_KEY=$(prompt_secret "SUPABASE_ANON_KEY" "Supabase anonymous key (public)" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y")
set_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "Supabase anonymous key"

SUPABASE_SERVICE_ROLE_KEY=$(prompt_secret "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key (from Dashboard → Settings → API)" "")
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key"

SUPABASE_PROJECT_REF=$(prompt_secret "SUPABASE_PROJECT_REF" "Supabase project reference ID" "qvqybobnsaikaknsdqhw")
set_secret "SUPABASE_PROJECT_REF" "$SUPABASE_PROJECT_REF" "Supabase project reference"

SUPABASE_ACCESS_TOKEN=$(prompt_secret "SUPABASE_ACCESS_TOKEN" "Supabase access token (from Dashboard → Account → Access Tokens)" "")
set_secret "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN" "Supabase access token"

SUPABASE_DB_PASSWORD=$(prompt_secret "SUPABASE_DB_PASSWORD" "Supabase database password" "9734937731Girma")
set_secret "SUPABASE_DB_PASSWORD" "$SUPABASE_DB_PASSWORD" "Supabase database password"

# Netlify Secrets
echo ""
echo -e "${BLUE}=== Netlify Configuration ===${NC}"

NETLIFY_AUTH_TOKEN=$(prompt_secret "NETLIFY_AUTH_TOKEN" "Netlify personal access token (from User Settings → Applications)" "")
set_secret "NETLIFY_AUTH_TOKEN" "$NETLIFY_AUTH_TOKEN" "Netlify authentication token"

NETLIFY_SITE_ID=$(prompt_secret "NETLIFY_SITE_ID" "Netlify site ID (from Site Settings → General → Site Information)" "")
set_secret "NETLIFY_SITE_ID" "$NETLIFY_SITE_ID" "Netlify site ID"

NETLIFY_URL=$(prompt_secret "NETLIFY_URL" "Your Netlify site URL" "https://ethiopian-community-resources.netlify.app")
set_secret "NETLIFY_URL" "$NETLIFY_URL" "Netlify site URL"

# Authentication Secrets
echo ""
echo -e "${BLUE}=== Authentication Configuration ===${NC}"

GOOGLE_CLIENT_ID=$(prompt_secret "GOOGLE_CLIENT_ID" "Google OAuth client ID" "990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com")
set_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "Google OAuth client ID"

GOOGLE_CLIENT_SECRET=$(prompt_secret "GOOGLE_CLIENT_SECRET" "Google OAuth client secret (from Google Cloud Console)" "")
set_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "Google OAuth client secret"

# Generate session secret if not provided
SESSION_SECRET=$(prompt_secret "SESSION_SECRET" "Session secret (random string for security)" "$(openssl rand -base64 32)")
set_secret "SESSION_SECRET" "$SESSION_SECRET" "Express session secret"

echo ""
echo -e "${GREEN}🎉 GitHub Secrets Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Supabase configuration"
echo "✅ Netlify deployment settings"
echo "✅ Authentication credentials"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Verify all secrets are set in GitHub → Settings → Secrets and variables → Actions"
echo "2. Connect your repository to Netlify"
echo "3. Configure Netlify environment variables"
echo "4. Push code to trigger the first deployment"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• GitHub Secrets: https://github.com/${REPO_FULL}/settings/secrets/actions"
echo "• Netlify Dashboard: https://app.netlify.com/"
echo "• Supabase Dashboard: https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
