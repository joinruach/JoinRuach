#!/bin/bash

# Ruach Telegram Bot - Webhook Setup Script
# This script helps you configure your Telegram bot webhook

set -e

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

echo "================================================"
echo "🤖 Ruach Telegram Bot - Webhook Setup"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f "apps/ruach-next/.env" ]; then
  echo -e "${COLOR_RED}❌ Error: apps/ruach-next/.env not found${COLOR_RESET}"
  echo "Please create .env file from .env.example first"
  exit 1
fi

# Load environment variables
source apps/ruach-next/.env 2>/dev/null || true

# Check for required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "1234567890:AAH_xxxxxxx" ]; then
  echo -e "${COLOR_YELLOW}⚠️  TELEGRAM_BOT_TOKEN not configured${COLOR_RESET}"
  echo ""
  echo "To create a Telegram bot:"
  echo "1. Message @BotFather on Telegram"
  echo "2. Send: /newbot"
  echo "3. Follow the prompts"
  echo "4. Copy the token to your .env file"
  echo ""
  exit 1
fi

if [ -z "$TELEGRAM_WEBHOOK_SECRET" ] || [ "$TELEGRAM_WEBHOOK_SECRET" = "REPLACE_WITH_RANDOM_STRING_FROM_openssl_rand_base64_32" ]; then
  echo -e "${COLOR_YELLOW}⚠️  TELEGRAM_WEBHOOK_SECRET not configured${COLOR_RESET}"
  echo ""
  echo "Generate a webhook secret:"
  echo "openssl rand -base64 32"
  echo ""
  echo "Then add it to your .env file as TELEGRAM_WEBHOOK_SECRET"
  echo ""
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ] || [ "$NEXT_PUBLIC_APP_URL" = "https://yourdomain.com" ]; then
  echo -e "${COLOR_YELLOW}⚠️  NEXT_PUBLIC_APP_URL not configured${COLOR_RESET}"
  echo ""
  echo "Set your app URL in .env:"
  echo "NEXT_PUBLIC_APP_URL=https://your-production-url.com"
  echo ""
  echo "For local development with ngrok:"
  echo "NEXT_PUBLIC_APP_URL=https://xxxx.ngrok-free.app"
  echo ""
  exit 1
fi

WEBHOOK_URL="${NEXT_PUBLIC_APP_URL}/api/telegram/webhook"

echo -e "${COLOR_BLUE}Configuration:${COLOR_RESET}"
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"
echo "Webhook Secret: ${TELEGRAM_WEBHOOK_SECRET:0:10}..."
echo ""

# Confirm before proceeding
read -p "Set this webhook? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# Set webhook
echo -e "${COLOR_BLUE}Setting webhook...${COLOR_RESET}"
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\"
  }")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${COLOR_GREEN}✅ Webhook set successfully!${COLOR_RESET}"
  echo ""
else
  echo -e "${COLOR_RED}❌ Failed to set webhook${COLOR_RESET}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

# Get webhook info
echo -e "${COLOR_BLUE}Verifying webhook...${COLOR_RESET}"
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")

echo "$WEBHOOK_INFO" | jq '.' 2>/dev/null || echo "$WEBHOOK_INFO"
echo ""

# Check for errors
if echo "$WEBHOOK_INFO" | grep -q '"last_error_message"'; then
  echo -e "${COLOR_YELLOW}⚠️  Warning: Webhook has errors${COLOR_RESET}"
  echo "Check the output above for details"
  echo ""
fi

# Get bot info
echo -e "${COLOR_BLUE}Bot Information:${COLOR_RESET}"
BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
echo "$BOT_INFO" | jq '.result | {username, first_name, can_join_groups, can_read_all_group_messages}' 2>/dev/null || echo "$BOT_INFO"
echo ""

echo "================================================"
echo -e "${COLOR_GREEN}✅ Setup Complete!${COLOR_RESET}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Open Telegram and search for your bot"
echo "2. Send: /start"
echo "3. Send a test message"
echo "4. Check Strapi admin for the captured snippet"
echo ""
echo "Commands:"
echo "  /start  - Connect to vault"
echo "  /help   - Show usage instructions"
echo "  /whoami - Get your Telegram user ID"
echo ""
echo "For more info, see: docs/TELEGRAM_BOT_SETUP.md"
echo ""
