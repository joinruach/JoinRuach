# Telegram Bot Integration - Implementation Summary

**Date:** 2026-01-20
**Status:** ✅ Complete and Ready to Use
**Feature:** Text your ideas straight into Ruach Vault from Telegram

---

## 🎯 What Was Built

A complete Telegram bot integration that lets you capture thoughts, parables, teachings, and ideas by simply texting them to your personal bot.

### Flow
```
You → Telegram message → Webhook validates → /api/capture → Claude AI enrichment → Strapi vault
                                ↓
                         Bot replies: "✅ Stored"
```

---

## 📦 Files Created

### 1. Telegram Webhook Route
**File:** `apps/ruach-next/src/app/api/telegram/webhook/route.ts`

**Features:**
- ✅ Webhook secret validation (prevents spoofing)
- ✅ User ID whitelisting (optional security)
- ✅ Smart message parsing (supports metadata)
- ✅ Command handling (/start, /help, /whoami)
- ✅ Error handling and logging
- ✅ Telegram reply confirmations

**Commands:**
- `/start` - Connect to vault and get welcome message
- `/help` - Show usage instructions
- `/whoami` - Get your Telegram user ID (for whitelisting)

### 2. Enhanced Capture Endpoint
**File:** `apps/ruach-next/src/app/api/capture/route.ts` (updated)

**Added:**
- ✅ Optional `CAPTURE_SECRET` authentication
- ✅ Header-based authorization (`x-capture-secret`)
- ✅ Prevents unauthorized API access

### 3. Documentation
**File:** `docs/TELEGRAM_BOT_SETUP.md`

**Covers:**
- Complete setup guide (10 minutes)
- BotFather configuration
- Webhook setup
- Local development with ngrok
- Security features
- Troubleshooting
- Advanced features (voice messages, etc.)

### 4. Setup Script
**File:** `scripts/setup-telegram-webhook.sh`

**Features:**
- ✅ Automated webhook configuration
- ✅ Environment variable validation
- ✅ Webhook verification
- ✅ Bot info display
- ✅ Error checking

### 5. Environment Configuration
**File:** `apps/ruach-next/.env.example` (updated)

**Added Variables:**
```bash
TELEGRAM_BOT_TOKEN=           # From @BotFather
TELEGRAM_WEBHOOK_SECRET=      # Generate with openssl rand -base64 32
CAPTURE_SECRET=               # Generate with openssl rand -base64 32
NEXT_PUBLIC_APP_URL=          # Your deployed URL (HTTPS required)
TELEGRAM_ALLOWED_USER_IDS=    # Optional comma-separated whitelist
```

---

## 🚀 Quick Start (5 Steps)

### Step 1: Create Bot with BotFather

```
1. Open Telegram → @BotFather
2. Send: /newbot
3. Name: "Ruach Vault"
4. Username: "ruach_vault_bot"
5. Copy the token
```

### Step 2: Configure Environment

Add to `apps/ruach-next/.env`:

```bash
TELEGRAM_BOT_TOKEN=your_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)
CAPTURE_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=https://your-deployed-url.com
```

### Step 3: Deploy or Use ngrok

**Production:**
Deploy to Vercel/Railway/etc. and use that URL.

**Local Development:**
```bash
ngrok http 3000
# Use the HTTPS URL for NEXT_PUBLIC_APP_URL
```

### Step 4: Set Webhook

**Automated (recommended):**
```bash
./scripts/setup-telegram-webhook.sh
```

**Manual:**
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$NEXT_PUBLIC_APP_URL/api/telegram/webhook\",
    \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\"
  }"
```

### Step 5: Test

```
1. Open Telegram
2. Search for your bot (@ruach_vault_bot)
3. Send: /start
4. Send: "Test message"
5. Check Strapi admin → Ruach Snippets
```

---

## 💡 Usage Examples

### Simple Capture

Just send text:
```
Power doesn't need permission. It needs ignition.
```

Bot replies:
```
✅ Stored

📝 "Power doesn't need permission. It needs ignition."
🏷️ Type: parable
```

### With Metadata (Advanced)

Use pipe syntax:
```
type:teaching | title:Kingdom Economics | topics:stewardship,abundance | Your teaching content here...
```

**Format:**
```
type:TYPE | title:TITLE | topics:TAG1,TAG2 | BODY
```

**Available Types:**
- parable, idea, teaching, quote, outline, prayer, script, dream, warning

### Get Your User ID

For whitelisting:
```
/whoami
```

Response:
```
👤 Your Telegram Info:

User ID: 123456789
Username: @yourname
Name: Your Name

💡 To whitelist yourself, add this to .env:
TELEGRAM_ALLOWED_USER_IDS=123456789
```

---

## 🔒 Security Features

### 1. Webhook Secret Validation

Every webhook request is validated:
```typescript
if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return 401 Unauthorized
}
```

Prevents spoofed requests pretending to be from Telegram.

### 2. Capture API Protection

The `/api/capture` endpoint requires a secret header:
```typescript
if (req.headers.get("x-capture-secret") !== process.env.CAPTURE_SECRET) {
  return 401 Unauthorized
}
```

Only authorized clients (bot, iPhone shortcut) can capture.

### 3. User ID Whitelisting (Optional)

Restrict bot to specific users:

**Get your ID (Option A - Fastest):**
```
1. Search for @userinfobot in Telegram
2. Tap "Start"
3. Bot replies with your User ID
```

**Get your ID (Option B - Using your bot):**
```
/whoami
```

**Add to .env:**
```bash
TELEGRAM_ALLOWED_USER_IDS=123456789,987654321
```

**Multiple users:**
```bash
TELEGRAM_ALLOWED_USER_IDS=123456789,987654321,555555555
```

**Production Safety:**
- **Production:** Whitelist is **required** (bot rejects all if not set)
- **Development:** Whitelist is optional (allows all if not set)
- Allowlist is parsed once at startup for performance

**Silent Block (Recommended):**

Add this to prevent revealing your bot is restricted:
```bash
TELEGRAM_SILENT_BLOCK=true
```

**With silent block enabled:**
- Unauthorized users: Bot silently ignores (no response)
- Authorized users: Bot works normally

**With silent block disabled (default):**
- Unauthorized users get: `⛔ Unauthorized user. This bot is private.`

---

## 🎨 Smart Message Parsing

The bot supports optional metadata in your messages:

### Basic Format
```
type:TYPE | title:TITLE | topics:TAG1,TAG2,TAG3 | Your content here
```

### Examples

**With type only:**
```
type:parable | Power doesn't need permission. It needs ignition.
```

**With type and topics:**
```
type:teaching | topics:calling,authority,obedience | Your teaching here...
```

**With everything:**
```
type:quote | title:Love Is A Decision | topics:love,commitment | Love isn't a feeling...
```

**No metadata (AI classifies everything):**
```
Just send your thought and let Claude handle it all.
```

---

## 📊 What Happens Behind the Scenes

### Message Flow

```mermaid
Telegram message
  ↓
Webhook route (/api/telegram/webhook)
  ↓
Validate webhook secret ✅
  ↓
Check user whitelist (if configured) ✅
  ↓
Parse message (extract metadata if present)
  ↓
Forward to /api/capture with secret header
  ↓
Capture endpoint validates secret ✅
  ↓
Create checksum for deduplication
  ↓
Claude AI classification
  ↓
Upsert topics
  ↓
Save to Strapi
  ↓
Reply to user: "✅ Stored"
```

### Security Layers

1. **Telegram → Webhook:** `TELEGRAM_WEBHOOK_SECRET` header
2. **Webhook → Capture:** `x-capture-secret` header
3. **Capture → Strapi:** `STRAPI_API_TOKEN` header
4. **Optional:** User ID whitelist

---

## 🔧 Configuration Reference

### Required Environment Variables

```bash
# Bot token from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:AAH_xxxxx

# Webhook validation secret
TELEGRAM_WEBHOOK_SECRET=your_random_secret_here

# Capture endpoint protection
CAPTURE_SECRET=another_random_secret_here

# Your app's public URL (HTTPS required)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Strapi connection (already configured)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_token

# Claude AI (already configured)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Optional Environment Variables

```bash
# User ID whitelist (comma-separated)
TELEGRAM_ALLOWED_USER_IDS=123456789,987654321

# Silent block mode (recommended for security)
# Set to "true" to silently ignore unauthorized users
# Prevents revealing that the bot is restricted
TELEGRAM_SILENT_BLOCK=true
```

---

## 🔐 Security & Logging

### Logging Hygiene

The webhook follows strict logging practices to protect user privacy:

**✅ What we log:**
- User IDs (for authorization tracking)
- Chat IDs (for debugging)
- Update IDs (for deduplication)
- HTTP status codes
- Error messages (sanitized)

**❌ What we NEVER log:**
- Message text/content
- Webhook secret tokens
- Capture API secrets
- Full error payloads (only safe metadata)
- Request headers (may contain secrets)

**Example safe log:**
```
⚠️  Telegram webhook: Unauthorized user 123456789 (chat: 987654321, update: 555)
```

**Structured error logging:**
```json
{
  "status": 500,
  "userId": 123456789,
  "chatId": 987654321,
  "updateId": 555,
  "errorPreview": "API timeout after 5s..."
}
```

### Performance Optimization

- Allowlist is parsed **once at startup** (not on every request)
- Cached in module scope for zero-cost lookups
- Production mode validates configuration at boot

---

## 🛠️ Tools & Scripts

### Setup Script

**Run:** `./scripts/setup-telegram-webhook.sh`

**Does:**
- ✅ Validates environment configuration
- ✅ Sets webhook URL
- ✅ Verifies webhook is working
- ✅ Shows bot information
- ✅ Checks for errors

### Test Script

**Run:** `./scripts/test-capture-endpoint.sh`

Tests the capture endpoint (not Telegram-specific).

### Manual Commands

**Set webhook:**
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$NEXT_PUBLIC_APP_URL/api/telegram/webhook\", \"secret_token\": \"$TELEGRAM_WEBHOOK_SECRET\"}"
```

**Get webhook info:**
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

**Delete webhook:**
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
```

**Get bot info:**
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"
```

---

## 🐛 Troubleshooting

### Bot doesn't respond

**Check webhook:**
```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Look for:
- `"url"` should match your deployment
- `"pending_update_count"` should be 0
- `"last_error_message"` shouldn't exist

**Common fixes:**
1. URL must be HTTPS (use ngrok for local)
2. Webhook secret must match `.env`
3. Next.js app must be running

### "Unauthorized" error

**Check:**
1. `TELEGRAM_WEBHOOK_SECRET` matches in:
   - Telegram webhook config
   - Your `.env` file
2. `CAPTURE_SECRET` is set correctly
3. Secrets match in headers

### Webhook not receiving messages

**Delete and recreate:**
```bash
# Delete
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"

# Wait 5 seconds

# Recreate
./scripts/setup-telegram-webhook.sh
```

### User gets "Unauthorized user"

**Options:**
1. Add their user ID to whitelist
2. Remove whitelist (set `TELEGRAM_ALLOWED_USER_IDS=` empty)
3. Have them send `/whoami` to get their ID

### Messages captured but no AI classification

**Check:**
1. `ANTHROPIC_API_KEY` is set in `.env`
2. API key has credits
3. Check Next.js logs for errors

**Fallback:** Even without AI, captures still work with defaults.

---

## 🚀 Next Level Features (Future)

### 1. Voice Message Support

Transcribe voice messages with Whisper:
```typescript
if (msg.voice) {
  const file = await getTelegramFile(msg.voice.file_id);
  const transcript = await transcribeWithWhisper(file);
  await captureText(transcript);
}
```

### 2. Photo Caption Capture

Already supported! Send a photo with caption → caption gets captured.

### 3. Daily Digest

Send summary every evening:
```
📖 Today you captured:
- 3 parables
- 2 teachings
- 1 prayer

Top topics: calling, authority, obedience
```

### 4. Search via Bot

```
You: /search calling

Bot: Results:
1. Power doesn't need permission...
2. The anointing isn't a license...
```

### 5. Auto-Reply with Scripture

After capturing, look up relevant verses and reply.

---

## 📈 Usage Metrics

After 1 week, you should see:
- ✅ Daily capture habit formed
- ✅ 20+ snippets from Telegram
- ✅ Topics auto-created from messages
- ✅ 0 duplicates (checksum works)
- ✅ Bot responds within 1 second

---

## ✅ Verification Checklist

After setup, test:

- [ ] Bot responds to `/start`
- [ ] Bot responds to `/help`
- [ ] `/whoami` shows your user ID
- [ ] Simple text message gets captured
- [ ] Metadata syntax works (`type:parable | ...`)
- [ ] Snippet appears in Strapi admin
- [ ] Topics are auto-created
- [ ] Deduplication works (send same text twice)
- [ ] Bot reply is instant (< 1 second)
- [ ] User whitelist works (if configured)

---

## 🎯 Best Practices

### 1. Use for Everything

Don't self-edit. Capture:
- Half-formed ideas
- Dreams
- Random thoughts
- Revelations during prayer
- Quick parables
- Teaching outlines

AI will organize it all.

### 2. Review Weekly

Every Sunday:
- Open Strapi admin
- Filter Telegram snippets
- Convert best ones to refined outputs

### 3. Add Metadata for Important Stuff

Quick thoughts → just text

Important revelations → use metadata:
```
type:teaching | title:Title Here | topics:tag1,tag2 | Content...
```

### 4. Whitelist Your ID

Production → always set `TELEGRAM_ALLOWED_USER_IDS`

### 5. Use Multiple Devices

Bot works on:
- iPhone Telegram app
- Android Telegram app
- Desktop Telegram
- Web Telegram

All sync to the same vault.

---

## 📚 Related Documentation

- **Main Guide:** `docs/RUACH_CAPTURE_SYSTEM.md`
- **Telegram Setup:** `docs/TELEGRAM_BOT_SETUP.md`
- **Implementation:** `RUACH_CAPTURE_IMPLEMENTATION.md`

---

## 🎉 You're Done!

You now have a **personal thought-capture bot** that's always in your pocket.

**Start using it:**
1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Text any thought

**Your raw material vault is now as easy as sending a text message.** 📱✨

Never lose a revelation again.

---

**Questions?**
- Read: `docs/TELEGRAM_BOT_SETUP.md`
- Test: `./scripts/setup-telegram-webhook.sh`
- Debug: Check Next.js logs

**Built with:** Claude Code 🤖
