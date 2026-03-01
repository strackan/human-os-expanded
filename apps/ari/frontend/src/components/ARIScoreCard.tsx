import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ARIScoreCardProps {
  entityName: string
  score: number
  mentionRate: number
  totalPrompts: number
  onNameClick?: () => void
}

function ARIScoreCard({ entityName, score, mentionRate, totalPrompts, onNameClick }: ARIScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0)

  // Animate score counting up
  useEffect(() => {
    const duration = 1500 // ms
    const steps = 60
    const increment = score / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  // Get color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'from-green-400 to-emerald-500'
    if (s >= 60) return 'from-indigo-400 to-purple-500'
    if (s >= 40) return 'from-amber-400 to-orange-500'
    return 'from-red-400 to-rose-500'
  }

  // Get score label
  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/20 card-hover">
      <div className="text-center">
        {/* Entity Name */}
        <h2
          className={`text-xl font-semibold text-purple-200 mb-4 ${onNameClick ? 'cursor-pointer hover:text-indigo-300 transition-colors' : ''}`}
          onClick={onNameClick}
        >
          {entityName}
          {onNameClick && <span className="ml-2 text-sm text-purple-400">→</span>}
        </h2>

        {/* Score Display */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative inline-block"
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r ${getScoreColor(score)} rounded-full`} />

          {/* Score number */}
          <div className={`relative text-8xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
            {displayScore}
          </div>
        </motion.div>

        {/* Score label */}
        <div className="mt-2">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getScoreColor(score)} text-white`}>
            {getScoreLabel(score)}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-purple-900/30 rounded-lg p-3">
            <div className="text-purple-300/60">Mention Rate</div>
            <div className="text-xl font-semibold text-white">
              {Math.round(mentionRate * 100)}%
            </div>
          </div>
          <div className="bg-purple-900/30 rounded-lg p-3">
            <div className="text-purple-300/60">Prompts Tested</div>
            <div className="text-xl font-semibold text-white">{totalPrompts}</div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-purple-300/60 text-sm">
          ARI Score measures how often AI models recommend {entityName} across various prompts.
        </p>
      </div>
    </div>
  )
}

export default ARIScoreCard
