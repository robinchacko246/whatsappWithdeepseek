# 🚀 Quick Start Guide

Get your WhatsApp AI Agent running in 5 minutes!

## Step 1: Get DeepSeek API Key
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (you'll need it in Step 3)

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Configure the Bot
Run the interactive setup:
```bash
npm run setup
```

Or manually create a `.env` file:
```env
DEEPSEEK_API_KEY=your_api_key_here
AUTO_REPLY_ENABLED=true
REPLY_DELAY_MS=2000
SYSTEM_PROMPT=You are a helpful AI assistant responding to WhatsApp messages. Keep responses concise and friendly.
```

## Step 4: Start the Bot
```bash
npm start
```

## Step 5: Connect WhatsApp
1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code

## Step 6: Test It!
- Send a message to your WhatsApp number from another phone
- The bot should automatically reply with an AI-generated response
- Check the console for activity logs

## 🎉 You're Done!
Your WhatsApp AI Agent is now active and will automatically respond to incoming messages.

## 🔧 Quick Configuration Tips

### Change AI Personality
Edit the `SYSTEM_PROMPT` in your `.env` file:
```env
SYSTEM_PROMPT=You are a professional customer service assistant. Be polite and helpful.
```

### Restrict to Specific Contacts
Add phone numbers (international format) to your `.env`:
```env
ALLOWED_CONTACTS=1234567890,9876543210
```

### Block Specific Contacts
```env
BLOCKED_CONTACTS=1111111111,2222222222
```

### Adjust Response Speed
```env
REPLY_DELAY_MS=3000  # 3 seconds delay
```

## 🆘 Troubleshooting

**QR Code not showing?**
- Make sure your terminal supports QR codes
- Try a different terminal application

**Bot not responding?**
- Check if `AUTO_REPLY_ENABLED=true` in `.env`
- Verify your DeepSeek API key is correct
- Check the console for error messages

**Authentication failed?**
- Delete the `.wwebjs_auth` folder
- Restart the bot and scan QR code again

## 📚 Need More Help?
Check the full [README.md](README.md) for detailed documentation and advanced features. 