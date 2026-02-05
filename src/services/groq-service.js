const axios = require('axios')
const { config } = require('../config/config')
const logger = require('../utils/logger')

class GroqService {
  constructor() {
    this.apiKey = config.groq.apiKey
    this.apiUrl = config.groq.apiUrl
    this.systemPrompt = config.bot.systemPrompt
    this.model = config.groq.model
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
          model: this.model,
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
        logger.info('Groq response generated successfully', {
          userMessage: userMessage.substring(0, 100),
          responseLength: aiResponse.length,
          model: this.model
        })
        return aiResponse
      }

      throw new Error('Invalid response format from Groq API')
    } catch (error) {
      logger.error('Error generating Groq response', {
        error: error.message,
        userMessage: userMessage.substring(0, 100),
        status: error.response?.status,
        statusText: error.response?.statusText
      })

      // Return specific fallback responses based on error type
      if (error.response?.status === 402) {
        return "⚠️ I'm temporarily unavailable due to insufficient API credits. The free tier limit may have been reached."
      } else if (error.response?.status === 401) {
        return "🔑 Authentication error: Please check your Groq API key configuration."
      } else if (error.response?.status === 429) {
        return "⏱️ I'm receiving too many requests right now. Please wait a moment and try again."
      } else if (error.response?.status === 400) {
        return "⚠️ There was an issue with the request format. Please try again."
      }

      // Return a general fallback response
      return "I'm sorry, I'm having trouble processing your message right now. Please try again later."
    }
  }

  async testConnection() {
    try {
      const testResponse = await this.generateResponse('Hello, this is a test message.')
      logger.info('Groq API connection test successful')
      return true
    } catch (error) {
      logger.error('Groq API connection test failed', { error: error.message })
      return false
    }
  }
}

module.exports = GroqService 