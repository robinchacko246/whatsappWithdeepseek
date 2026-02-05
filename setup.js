#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setup() {
  console.log('🤖 WhatsApp AI Agent Setup (Groq Edition)')
  console.log('==========================================\n')

  // Check if .env already exists
  if (fs.existsSync('.env')) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('Please provide the following information:\n')

  // Get Groq API key
  const apiKey = await question('🔑 Groq API Key (required - get free at console.groq.com): ')
  if (!apiKey.trim()) {
    console.log('❌ API Key is required. Please get one from https://console.groq.com/')
    rl.close()
    return
  }

  // Get bot name
  const botName = await question('🤖 Bot Name (default: WhatsApp AI Assistant): ')

  // Get model choice
  console.log('\n🧠 Available Groq Models:')
  console.log('1. llama3-70b-8192 (recommended - high quality)')
  console.log('2. llama3-8b-8192 (fastest)')
  console.log('3. mixtral-8x7b-32768 (good for complex tasks)')
  const modelChoice = await question('Choose model (1-3, default: 1): ')
  
  const models = {
    '1': 'llama3-70b-8192',
    '2': 'llama3-8b-8192',
    '3': 'mixtral-8x7b-32768'
  }
  const selectedModel = models[modelChoice] || 'llama3-70b-8192'

  // Get system prompt
  console.log('\n💬 System Prompt (how the AI should behave):')
  const systemPrompt = await question('   (default: helpful assistant): ')

  // Get reply delay
  const replyDelay = await question('⏱️  Reply Delay in milliseconds (default: 2000): ')

  // Ask about contact restrictions
  const useAllowList = await question('🔒 Restrict to specific contacts only? (y/N): ')
  let allowedContacts = ''
  if (useAllowList.toLowerCase() === 'y') {
    allowedContacts = await question('📱 Allowed contacts (comma-separated, international format): ')
  }

  const useBlockList = await question('🚫 Block specific contacts? (y/N): ')
  let blockedContacts = ''
  if (useBlockList.toLowerCase() === 'y') {
    blockedContacts = await question('📱 Blocked contacts (comma-separated, international format): ')
  }

  // Create .env content
  const envContent = `# Groq API Configuration (Free Tier Available!)
GROQ_API_KEY=${apiKey}
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=${selectedModel}

# Bot Configuration
BOT_NAME=${botName || 'WhatsApp AI Assistant'}
AUTO_REPLY_ENABLED=true
REPLY_DELAY_MS=${replyDelay || '2000'}

# Allowed contacts (comma-separated phone numbers with country code)
# Leave empty to reply to all contacts
ALLOWED_CONTACTS=${allowedContacts}

# Blocked contacts (comma-separated phone numbers with country code)
BLOCKED_CONTACTS=${blockedContacts}

# System prompt for AI responses
SYSTEM_PROMPT=${systemPrompt || 'You are a helpful AI assistant responding to WhatsApp messages. Keep responses concise and friendly.'}

# Logging
LOG_LEVEL=info`

  // Write .env file
  fs.writeFileSync('.env', envContent)

  console.log('\n✅ Configuration saved to .env file!')
  console.log(`📋 Selected Model: ${selectedModel}`)
  console.log('\n📋 Next steps:')
  console.log('1. Test API connection: node test-groq-api.js')
  console.log('2. Start the bot: npm start')
  console.log('3. Scan the QR code with your WhatsApp')
  console.log('\n🔗 For more information, check the README.md file')

  rl.close()
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error.message)
  rl.close()
  process.exit(1)
}) 