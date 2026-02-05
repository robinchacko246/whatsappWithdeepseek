require('dotenv').config()

const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
    model: process.env.GROQ_MODEL || 'llama3-70b-8192'
  },
  bot: {
    name: process.env.BOT_NAME || 'WhatsApp AI Assistant',
    autoReplyEnabled: process.env.AUTO_REPLY_ENABLED === 'true',
    replyDelay: parseInt(process.env.REPLY_DELAY_MS) || 2000,
    systemPrompt: process.env.SYSTEM_PROMPT || 'You are a helpful AI assistant responding to WhatsApp messages. Keep responses concise and friendly.'
  },
  contacts: {
    allowed: process.env.ALLOWED_CONTACTS ? process.env.ALLOWED_CONTACTS.split(',').map(c => c.trim()) : [],
    blocked: process.env.BLOCKED_CONTACTS ? process.env.BLOCKED_CONTACTS.split(',').map(c => c.trim()) : []
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
}

function validateConfig() {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is required. Please set it in your .env file.')
  }
  
  if (!config.groq.apiUrl) {
    throw new Error('GROQ_API_URL is required. Please set it in your .env file.')
  }
  
  return true
}

module.exports = {
  config,
  validateConfig
} 