const { validateConfig } = require('./config/config')
const logger = require('./utils/logger')
const WhatsAppService = require('./services/whatsapp-service')

class WhatsAppAIAgent {
  constructor() {
    this.whatsappService = null
    this.isRunning = false
  }

  async start() {
    try {
      // Validate configuration
      validateConfig()
      logger.info('Configuration validated successfully')

      // Create logs directory if it doesn't exist
      const fs = require('fs')
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs')
      }

      console.log('🤖 Starting WhatsApp AI Agent...')
      console.log('📋 Configuration:')
      console.log('   - Groq API: Configured')
      console.log('   - Auto-reply: Enabled')
      console.log('   - Bot Name: WhatsApp AI Assistant')
      console.log('')

      // Initialize WhatsApp service
      this.whatsappService = new WhatsAppService()
      await this.whatsappService.initialize()

      this.isRunning = true
      this.setupGracefulShutdown()

      logger.info('WhatsApp AI Agent started successfully')

    } catch (error) {
      logger.error('Failed to start WhatsApp AI Agent', { error: error.message })
      console.error('❌ Failed to start:', error.message)
      process.exit(1)
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`)
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
      
      this.isRunning = false
      
      if (this.whatsappService) {
        await this.whatsappService.destroy()
      }
      
      logger.info('WhatsApp AI Agent shut down successfully')
      console.log('✅ WhatsApp AI Agent shut down successfully')
      process.exit(0)
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack })
      console.error('❌ Uncaught exception:', error.message)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise })
      console.error('❌ Unhandled rejection:', reason)
      process.exit(1)
    })
  }

  getStatus() {
    if (!this.whatsappService) {
      return { status: 'not_initialized' }
    }

    return {
      status: this.isRunning ? 'running' : 'stopped',
      ...this.whatsappService.getStatus()
    }
  }
}

// Start the application
async function main() {
  const agent = new WhatsAppAIAgent()
  await agent.start()
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  })
}

module.exports = WhatsAppAIAgent 