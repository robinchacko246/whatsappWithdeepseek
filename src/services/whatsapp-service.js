const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { config } = require('../config/config')
const logger = require('../utils/logger')
const GroqService = require('./groq-service')
const puppeteer = require('puppeteer')

class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'whatsapp-ai-agent'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-ipc-flooding-protection',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-sync'
        ],
        executablePath: puppeteer.executablePath(), // Use bundled Chromium
        timeout: 60000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    })

    this.groqService = new GroqService()
    this.conversationHistory = new Map() // Store conversation history per contact
    this.isReady = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.setupEventHandlers()
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      logger.info('QR Code received, scan with your phone')
      qrcode.generate(qr, { small: true })
      console.log('\n📱 Scan the QR code above with your WhatsApp to connect the bot\n')
    })

    this.client.on('ready', () => {
      this.isReady = true
      logger.info('WhatsApp client is ready!')
      console.log('✅ WhatsApp AI Agent is now active and ready to respond to messages!')
    })

    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated successfully')
    })

    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp authentication failed', { error: msg })
    })

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected', { reason })
      this.isReady = false
      
      // Attempt to reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.pow(2, this.reconnectAttempts) * 1000 // Exponential backoff
        
        logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`)
        
        setTimeout(async () => {
          try {
            await this.initialize()
            this.reconnectAttempts = 0 // Reset on successful reconnection
          } catch (error) {
            logger.error('Failed to reconnect WhatsApp client', { 
              error: error.message,
              attempt: this.reconnectAttempts 
            })
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              logger.error('Max reconnection attempts reached. Manual restart required.')
              console.error('❌ Max reconnection attempts reached. Please restart the bot manually.')
            }
          }
        }, delay)
      }
    })

    this.client.on('message_create', async (message) => {
      // Only process messages sent to us (not from us)
      if (message.fromMe) return
      
      await this.handleIncomingMessage(message)
    })
  }

  async handleIncomingMessage(message) {
    try {
      if (!config.bot.autoReplyEnabled) {
        logger.debug('Auto-reply is disabled, skipping message')
        return
      }

      const contact = await message.getContact()
      const contactNumber = contact.number
      const messageBody = message.body.trim()

      // Skip empty messages or media-only messages
      if (!messageBody) {
        logger.debug('Skipping empty message')
        return
      }

      // Check if contact is blocked
      if (this.isContactBlocked(contactNumber)) {
        logger.info('Message from blocked contact ignored', { contact: contactNumber })
        return
      }

      // Check if contact is allowed (if allowlist is configured)
      if (!this.isContactAllowed(contactNumber)) {
        logger.info('Message from non-allowed contact ignored', { contact: contactNumber })
        return
      }

      logger.info('Processing incoming message', {
        from: contact.name || contactNumber,
        message: messageBody.substring(0, 100)
      })

      // Get conversation history for this contact
      const history = this.getConversationHistory(contactNumber)

      // Generate AI response
      const aiResponse = await this.groqService.generateResponse(messageBody, history)

      // Update conversation history
      this.updateConversationHistory(contactNumber, messageBody, aiResponse)

      // Add delay before sending response (to appear more natural)
      await this.delay(config.bot.replyDelay)

      // Send the AI response
      await message.reply(aiResponse)

      logger.info('AI response sent successfully', {
        to: contact.name || contactNumber,
        responseLength: aiResponse.length
      })

    } catch (error) {
      logger.error('Error handling incoming message', {
        error: error.message,
        stack: error.stack
      })
    }
  }

  isContactBlocked(contactNumber) {
    return config.contacts.blocked.includes(contactNumber)
  }

  isContactAllowed(contactNumber) {
    // If no allowed contacts are specified, allow all
    if (config.contacts.allowed.length === 0) return true
    
    return config.contacts.allowed.includes(contactNumber)
  }

  getConversationHistory(contactNumber) {
    return this.conversationHistory.get(contactNumber) || []
  }

  updateConversationHistory(contactNumber, userMessage, aiResponse) {
    const history = this.getConversationHistory(contactNumber)
    
    // Add user message and AI response
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    )

    // Keep only last 10 messages (5 exchanges) to manage memory
    if (history.length > 10) {
      history.splice(0, history.length - 10)
    }

    this.conversationHistory.set(contactNumber, history)
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async initialize() {
    try {
      logger.info('Initializing WhatsApp client...')
      
      // Test Groq connection first
      const groqConnected = await this.groqService.testConnection()
      if (!groqConnected) {
        throw new Error('Failed to connect to Groq API. Please check your API key and configuration.')
      }

      // Validate browser availability
      try {
        const browserPath = puppeteer.executablePath()
        logger.info('Using browser at:', browserPath)
      } catch (error) {
        logger.error('Browser validation failed:', error.message)
        throw new Error('Puppeteer browser not available. Please reinstall puppeteer.')
      }

      // Add timeout for initialization
      const initPromise = this.client.initialize()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('WhatsApp client initialization timeout')), 120000) // 2 minutes
      })

      await Promise.race([initPromise, timeoutPromise])
      logger.info('WhatsApp client initialization started successfully')
      
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', { error: error.message })
      throw error
    }
  }

  async destroy() {
    try {
      await this.client.destroy()
      this.isReady = false
      logger.info('WhatsApp client destroyed successfully')
    } catch (error) {
      logger.error('Error destroying WhatsApp client', { error: error.message })
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      activeConversations: this.conversationHistory.size,
      autoReplyEnabled: config.bot.autoReplyEnabled
    }
  }
}

module.exports = WhatsAppService 