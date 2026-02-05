require('dotenv').config()
const axios = require('axios')

async function testGroqAPI() {
  console.log('🚀 Testing Groq API connection...')
  console.log('API Key:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 10)}...` : 'NOT SET')
  console.log('API URL:', process.env.GROQ_API_URL)
  console.log('Model:', process.env.GROQ_MODEL)
  console.log('')

  try {
    const response = await axios.post(
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond briefly.'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    console.log('✅ Groq API Test Successful!')
    console.log('Response:', response.data.choices[0].message.content)
    console.log('Model used:', response.data.model)
    console.log('Usage:', response.data.usage)
    console.log('')
    console.log('🎉 Your Groq API key is working correctly!')

  } catch (error) {
    console.log('❌ Groq API Test Failed!')
    console.log('Status:', error.response?.status)
    console.log('Status Text:', error.response?.statusText)
    console.log('Error:', error.response?.data || error.message)
    console.log('')
    
    if (error.response?.status === 401) {
      console.log('🔑 This is an authentication error. Please check:')
      console.log('1. Your Groq API key is correct')
      console.log('2. Your API key is active and not expired')
      console.log('3. Get a new API key from: https://console.groq.com/')
    } else if (error.response?.status === 429) {
      console.log('⏱️ Rate limit exceeded. Please wait and try again.')
    } else if (error.response?.status === 400) {
      console.log('⚠️ Bad request. Check your model name and request format.')
    }
  }
}

testGroqAPI() 