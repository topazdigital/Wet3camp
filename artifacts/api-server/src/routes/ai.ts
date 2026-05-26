import { Router } from 'express'
import OpenAI from 'openai'

const router = Router()

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  if (_openai) return _openai
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  if (!apiKey) return null
  _openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  return _openai
}

router.post('/ai/generate-bio', async (req, res) => {
  try {
    const openai = getOpenAI()
    if (!openai) {
      res.status(503).json({ message: 'AI service not configured', code: 'NO_AI' }); return
    }

    const { name, city, area, bodyType, ethnicity, height, hairColor, services = [] } = req.body as Record<string, any>
    if (!name) { res.status(400).json({ message: 'name is required' }); return }

    const traits = [
      height && `${height} tall`,
      bodyType && `${bodyType.toLowerCase()} build`,
      ethnicity && `${ethnicity}`,
      hairColor && `${hairColor.toLowerCase()} hair`,
    ].filter(Boolean).join(', ')

    const location = [area, city].filter(Boolean).join(', ') || 'Kenya'
    const topServices = Array.isArray(services) ? services.slice(0, 5).join(', ') : ''

    const prompt = `Write a professional, alluring, and elegant escort bio for a companion named ${name} based in ${location}. 
Physical attributes: ${traits || 'attractive and well-presented'}.
${topServices ? `Specialises in: ${topServices}.` : ''}
The bio should be 80-120 words, written in first person, confident but tasteful, and highlight her personality, discretion, and the quality of experience she offers. 
Do NOT include phone numbers, prices, or explicit content. Make it sophisticated and appealing to discerning clients.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.85,
    })

    const bio = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!bio) {
      res.status(500).json({ message: 'AI returned empty response' }); return
    }

    res.json({ bio })
  } catch (err: any) {
    console.error('[ai/generate-bio]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to generate bio' })
  }
})

export default router
