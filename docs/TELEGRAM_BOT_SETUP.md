# Telegram Bot Setup - Ruach Capture System

**Status:** ✅ Implemented
**Date:** 2026-01-20
**Integration:** Text your ideas straight into Ruach Vault

---

## 🎯 What This Does

Text any thought, parable, teaching, or idea to your Telegram bot → it's automatically:
- ✅ Captured in Strapi (raw vault)
- ✅ Classified by Claude AI
- ✅ Tagged with topics
- ✅ Deduplicated
- ✅ Searchable forever

**Flow:**
```
You → Telegram message → Telegram webhook → /api/capture → Strapi Raw Vault
```

---

## 🚀 Setup (10 minutes)

### Step 1: Create Your Bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. Choose a name: `Ruach Vault` (or anything you like)
4. Choose a username: `ruach_vault_bot` (or anything available ending in `_bot`)
5. Copy the **token** it gives you (looks like `1234567890:AAH_xxxxxxxxxxxxxxx`)

**Save this token** - you'll need it in Step 2.

### Step 2: Configure Environment Variables

Add to `apps/ruach-next/.env`:

```bash
# Telegram Bot Token (from BotFather)
TELEGRAM_BOT_TOKEN=1234567890:AAH_xxxxxxxxxxxxxxx

# Generate webhook secret
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Generate capture secret
CAPTURE_SECRET=$(openssl rand -base64 32)

# Your deployed app URL (for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**For local development:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate secrets:**
```bash
openssl rand -base64 32  # Copy for TELEGRAM_WEBHOOK_SECRET
openssl rand -base64 32  # Copy for CAPTURE_SECRET
```

### Step 3: Deploy Your App (HTTPS Required)

Telegram webhooks require HTTPS. Options:

**Production (Recommended):**
- Deploy to Vercel/Netlify/Railway
- Use your production URL for `NEXT_PUBLIC_APP_URL`

**Local Development (ngrok):**
```bash
# Install ngrok
brew install ngrok

# Start your Next.js app
cd apps/ruach-next
pnpm dev

# In another terminal, create tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://xxxx.ngrok-free.app)
# Use this for NEXT_PUBLIC_APP_URL temporarily
```

### Step 4: Set the Webhook

Replace `YOUR_BOT_TOKEN` and `YOUR_WEBHOOK_SECRET` with your values:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/telegram/webhook",
    "secret_token": "YOUR_WEBHOOK_SECRET"
  }'
```

**For local dev with ngrok:**
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://xxxx.ngrok-free.app/api/telegram/webhook",
    "secret_token": "YOUR_WEBHOOK_SECRET"
  }'
```

**Verify webhook is set:**
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Step 5: Test Your Bot

1. Open Telegram
2. Search for your bot username (e.g., `@ruach_vault_bot`)
3. Send: `/start`

You should get:
```
✅ Ruach Vault connected!

Send me any thought and I'll store it forever.

💡 Quick tip: You can add metadata like this:
type:parable | title:My Title | topics:tag1,tag2 | Your content here...
```

4. Send a test message:
```
Power doesn't need permission. It needs ignition.
```

Bot replies:
```
✅ Stored

📝 "Power doesn't need permission. It needs ignition."
🏷️ Type: parable
```

5. Check Strapi admin → you should see it in **Ruach Snippets**!

---

## 📝 Usage Examples

### Simple Capture

Just send text:
```
Love isn't a feeling. It's a decision you make when the feeling is gone.
```

Bot captures it with AI classification.

### With Metadata (Advanced)

Use pipe syntax to specify type, title, and topics:

```
type:teaching | title:Love Is A Decision | topics:love,commitment,marriage | Love isn't a feeling. It's a decision you make when the feeling is gone.
```

**Format:**
```
type:TYPE | title:TITLE | topics:TAG1,TAG2,TAG3 | Your content here...
```

**Available Types:**
- `parable` - Short stories with a lesson
- `idea` - Quick thoughts or concepts
- `teaching` - Longer form teaching content
- `quote` - Memorable quotes
- `outline` - Teaching or sermon outlines
- `prayer` - Prayers or prayer topics
- `script` - Video or podcast scripts
- `dream` - Dreams or visions
- `warning` - Prophetic warnings

### Commands

**`/start`** - Connect to bot and get help

**`/help`** - Show usage instructions

---

## 🎨 Advanced Features

### 1. Captions Work Too

Send a photo/video with a caption → caption gets captured.

### 2. Deduplication

Send the same text twice → bot replies:
```
✅ Stored (already exists)
```

### 3. AI Auto-Classification

If you don't specify type/topics, Claude AI will:
- Suggest a title (70 chars max)
- Classify the type
- Extract 3-8 relevant topics
- Generate a 1-2 sentence summary
- Find scripture references (if relevant)

---

## 🔒 Security Features

### Webhook Secret Validation

Every incoming webhook is validated:
```typescript
if (secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
  return 401 Unauthorized
}
```

This prevents spoofed requests.

### Capture API Protection

The `/api/capture` endpoint checks for the secret:
```typescript
if (req.headers.get("x-capture-secret") !== process.env.CAPTURE_SECRET) {
  return 401 Unauthorized
}
```

Only your bot (and authorized clients like iPhone shortcuts) can capture.

### Optional: Whitelist Your User ID

To restrict the bot to only you:

1. Get your Telegram user ID:
   - Message the bot
   - Check server logs for: `msg.from.id`
   - Or use @userinfobot

2. Add to `.env`:
   ```bash
   TELEGRAM_ALLOWED_USER_IDS=123456789,987654321
   ```

3. Update webhook route (apps/ruach-next/src/app/api/telegram/webhook/route.ts):
   ```typescript
   // After parsing the message
   const userId = msg.from?.id;
   const allowedIds = process.env.TELEGRAM_ALLOWED_USER_IDS?.split(',').map(Number);

   if (allowedIds && !allowedIds.includes(userId)) {
     await sendReply(chatId, "⛔ Unauthorized user");
     return NextResponse.json({ ok: false }, { status: 403 });
   }
   ```

---

## 🐛 Troubleshooting

### Bot doesn't respond

**Check webhook status:**
```bash
curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"
```

Look for:
- `"url"` - Should match your deployment URL
- `"pending_update_count"` - Should be 0
- `"last_error_date"` - If present, there's an issue

**Common issues:**
- URL must be HTTPS (use ngrok for local dev)
- Webhook secret must match in both places
- Next.js app must be running

### "Unauthorized" error

Check that:
1. `TELEGRAM_WEBHOOK_SECRET` matches in:
   - Telegram webhook configuration
   - Your `.env` file

2. `CAPTURE_SECRET` is set in `.env`

3. Secrets are correctly passed in headers

### Webhook not receiving updates

**Delete and recreate webhook:**
```bash
# Delete
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/deleteWebhook"

# Recreate
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/telegram/webhook",
    "secret_token": "YOUR_SECRET"
  }'
```

### Bot replies but nothing saves

**Check logs:**
```bash
# Next.js logs
cd apps/ruach-next
pnpm dev

# Look for errors from /api/capture
```

**Verify:**
- Strapi is running
- `STRAPI_API_TOKEN` is set
- `STRAPI_URL` is correct
- Content types exist in Strapi

---

## 📊 Monitoring

### Check Bot Info

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/getMe"
```

Returns bot details.

### Check Webhook Stats

```bash
curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"
```

Shows:
- Active webhook URL
- Pending update count
- Last error (if any)

### Server Logs

```bash
# Watch Next.js logs
cd apps/ruach-next
pnpm dev | grep -i telegram

# Or check production logs in Vercel dashboard
```

---

## 🚀 Next Level Features (Optional)

### 1. Voice Message Support

**Install dependencies:**
```bash
cd apps/ruach-next
pnpm add openai
```

**Update webhook route to handle voice:**
```typescript
if (msg.voice) {
  // Download voice file from Telegram
  const fileId = msg.voice.file_id;
  const file = await getTelegramFile(fileId);

  // Transcribe with Whisper
  const transcript = await transcribeAudio(file);

  // Send to capture
  await captureText(transcript);
}
```

### 2. Auto-Reply with Scripture

After capturing, look up relevant verses and reply with them.

### 3. Daily Digest

Send a summary every evening:
```
📖 Today you captured:
- 3 parables
- 2 teachings
- 1 prayer

Top topics: calling, authority, obedience
```

### 4. Search via Bot

```
/search calling

Results:
1. Power doesn't need permission...
2. The anointing isn't a license...
```

---

## 🎯 Best Practices

### 1. Use Source Field

Always know where ideas came from:
- `source: "Telegram"` (automatic)
- Later you can filter: "Show me all Telegram captures from last week"

### 2. Capture Everything

Don't self-edit. Dump it raw. AI will organize.

### 3. Review Weekly

Every Sunday:
- Open Strapi admin
- Filter by date
- Convert best snippets to refined outputs

### 4. Use Metadata for Important Ones

Quick thoughts → just send text

Important revelations → add metadata:
```
type:teaching | title:Kingdom Economics | topics:stewardship,abundance,generosity | Your revelation here...
```

---

## 📱 Multi-Device Setup

You can use the bot from:
- ✅ iPhone (Telegram app)
- ✅ Android (Telegram app)
- ✅ Desktop (Telegram Desktop)
- ✅ Web (Telegram Web)

All devices share the same chat → all captures go to the same vault.

---

## 🔗 Integration with Other Systems

### iPhone Shortcuts

Create a shortcut that:
1. Gets selected text
2. Sends to Telegram bot
3. Done

Or use the direct `/api/capture` route (see main docs).

### Alfred Workflow (Mac)

```applescript
tell application "Telegram"
  send message "{query}" to bot "ruach_vault_bot"
end tell
```

### Raycast Extension

Similar to Alfred, send text to bot.

---

## 📚 Full Example Session

```
You: /start

Bot: ✅ Ruach Vault connected!
     Send me any thought and I'll store it forever.

You: The Bride doesn't compete. She prepares.

Bot: ✅ Stored
     📝 "The Bride doesn't compete. She prepares."
     🏷️ Type: teaching

You: type:parable | topics:calling,authority | Power doesn't need permission. It needs ignition.

Bot: ✅ Stored
     📝 "Power doesn't need permission. It needs ignition."
     🏷️ Type: parable

You: /help

Bot: 📖 Ruach Vault Help

     Just send any text and it will be captured.

     Optional metadata format:
     type:TYPE | title:TITLE | topics:TAG1,TAG2 | CONTENT
     ...
```

---

## 🔄 Updating the Bot

### Change Bot Name/Photo

1. Message @BotFather
2. `/mybots` → Select your bot
3. **Edit Name** or **Edit About**

### Add Bot Commands Menu

```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Start using Ruach Vault"},
      {"command": "help", "description": "Show usage instructions"}
    ]
  }'
```

Now users see commands when they type `/`.

---

## 📞 Support

**Bot not working?**
1. Check this guide
2. Verify webhook with `getWebhookInfo`
3. Check Next.js logs
4. Ensure Strapi is running

**Need help?**
- Read: `docs/RUACH_CAPTURE_SYSTEM.md`
- Check: `RUACH_CAPTURE_IMPLEMENTATION.md`

---

## ✅ Checklist

After setup, verify:

- [ ] Bot responds to `/start`
- [ ] Bot replies to text messages
- [ ] Snippets appear in Strapi admin
- [ ] AI classification works
- [ ] Topics are auto-created
- [ ] Deduplication works
- [ ] Metadata syntax works (optional)

---

**You now have a personal thought-capture bot that's always in your pocket!** 📱✨

Start texting your ideas to yourself and never lose a revelation again.
