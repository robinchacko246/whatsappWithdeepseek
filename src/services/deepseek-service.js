const axios = require('axios')
const { config } = require('../config/config')
const logger = require('../utils/logger')

class DeepSeekService {
  constructor() {
    this.apiKey = config.deepseek.apiKey
    this.apiUrl = config.deepseek.apiUrl
    this.systemPrompt = config.bot.systemPrompt
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ]

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      )

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const aiResponse = response.data.choices[0].message.content.trim()
        logger.info('DeepSeek response generated successfully', {
          userMessage: userMessage.substring(0, 100),
          responseLength: aiResponse.length
        })
        return aiResponse
      }

      throw new Error('Invalid response format from DeepSeek API')
    } catch (error) {
      logger.error('Error generating DeepSeek response', {
        error: error.message,
        userMessage: userMessage.substring(0, 100),
        status: error.response?.status,
        statusText: error.response?.statusText
      })

      // Return specific fallback responses based on error type
      if (error.response?.status === 402) {
        return "⚠️ I'm temporarily unavailable due to insufficient API credits. Please add credits to your DeepSeek account at platform.deepseek.com to continue using the AI assistant."
      } else if (error.response?.status === 401) {
        return "🔑 Authentication error: Please check your DeepSeek API key configuration."
      } else if (error.response?.status === 429) {
        return "⏱️ I'm receiving too many requests right now. Please wait a moment and try again."
      }

      // Return a general fallback response
      return "I'm sorry, I'm having trouble processing your message right now. Please try again later."
    }
  }

  async testConnection() {
    try {
      const testResponse = await this.generateResponse('Hello, this is a test message.')
      logger.info('DeepSeek API connection test successful')
      return true
    } catch (error) {
      logger.error('DeepSeek API connection test failed', { error: error.message })
      return false
    }
  }
}

module.exports = DeepSeekService 