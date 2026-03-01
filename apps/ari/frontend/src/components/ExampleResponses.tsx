import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Response {
  provider: string
  prompt: string
  response: string
  position: number
}

interface ExampleResponsesProps {
  entityName: string
  responses: Response[]
}

const PROVIDER_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  openai: { name: 'ChatGPT', color: '#10b981', icon: '🤖' },
  anthropic: { name: 'Claude', color: '#8b5cf6', icon: '🧠' },
  perplexity: { name: 'Perplexity', color: '#3b82f6', icon: '🔍' },
  gemini: { name: 'Gemini', color: '#f59e0b', icon: '✨' },
}

function ExampleResponses({ entityName, responses }: ExampleResponsesProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Highlight entity name in response
  const highlightEntity = (text: string) => {
    const regex = new RegExp(`(\\*\\*${entityName}\\*\\*|${entityName})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) => {
      if (part.toLowerCase().includes(entityName.toLowerCase())) {
        return (
          <span key={i} className="bg-indigo-500/30 text-indigo-300 px-1 rounded font-semibold">
            {part.replace(/\*\*/g, '')}
          </span>
        )
      }
      return part
    })
  }

  const currentResponse = responses[activeIndex]
  const provider = PROVIDER_CONFIG[currentResponse.provider] || {
    name: currentResponse.provider,
    color: '#6366f1',
    icon: '🤖',
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/20 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Example AI Responses</h3>
        <div className="text-sm text-purple-300/60">Proof {entityName} is being recommended</div>
      </div>

      {/* Response tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {responses.map((response, index) => {
          const p = PROVIDER_CONFIG[response.provider] || { name: response.provider, icon: '🤖' }
          return (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeIndex === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
              {response.position === 1 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  #1
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Response content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Prompt */}
          <div className="p-3 rounded-lg bg-purple-900/30 border-l-4 border-indigo-500">
            <div className="text-xs text-purple-400 mb-1">Prompt:</div>
            <div className="text-purple-200 font-medium">"{currentResponse.prompt}"</div>
          </div>

          {/* Response */}
          <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{provider.icon}</span>
              <span className="text-sm font-medium" style={{ color: provider.color }}>
                {provider.name}
              </span>
              {currentResponse.position && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Position #{currentResponse.position}
                </span>
              )}
            </div>
            <div className="text-purple-100/90 leading-relaxed">
              {highlightEntity(currentResponse.response)}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {responses.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              activeIndex === index ? 'bg-indigo-500 w-4' : 'bg-purple-700 hover:bg-purple-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ExampleResponses
