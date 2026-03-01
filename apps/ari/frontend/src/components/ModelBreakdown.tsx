import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ModelBreakdownProps {
  entityName: string
  providerScores: Record<string, number>
}

const PROVIDER_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  openai: { name: 'ChatGPT', color: '#10b981', icon: '🤖' },
  anthropic: { name: 'Claude', color: '#8b5cf6', icon: '🧠' },
  perplexity: { name: 'Perplexity', color: '#3b82f6', icon: '🔍' },
  gemini: { name: 'Gemini', color: '#f59e0b', icon: '✨' },
}

function ModelBreakdown({ entityName, providerScores }: ModelBreakdownProps) {
  const data = Object.entries(providerScores).map(([provider, score]) => ({
    provider,
    name: PROVIDER_CONFIG[provider]?.name || provider,
    score,
    color: PROVIDER_CONFIG[provider]?.color || '#6366f1',
    icon: PROVIDER_CONFIG[provider]?.icon || '🤖',
  }))

  // Sort by score descending
  data.sort((a, b) => b.score - a.score)

  const maxScore = Math.max(...data.map(d => d.score))
  const minScore = Math.min(...data.map(d => d.score))
  const variance = maxScore - minScore

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/20 card-hover">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Model Breakdown</h3>
        <div className="text-sm text-purple-300/60">
          How each AI views {entityName}
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} stroke="#8b5cf680" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#8b5cf680"
              fontSize={12}
              width={80}
              tick={{ fill: '#c4b5fd' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1b4b',
                border: '1px solid #6366f1',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [`${value} ARI`, 'Score']}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {data.map((item, index) => (
          <motion.div
            key={item.provider}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-purple-900/30 rounded-lg p-3 text-center"
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-sm text-purple-300/80">{item.name}</div>
            <div className="text-xl font-bold" style={{ color: item.color }}>
              {item.score}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Variance insight */}
      {variance > 15 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-400">⚠️</span>
            <p className="text-amber-200/80 text-sm">
              <strong>High variance detected:</strong> {maxScore - minScore} point difference between models.
              {entityName} performs best on {data[0].name} ({data[0].score}) and worst on{' '}
              {data[data.length - 1].name} ({data[data.length - 1].score}).
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ModelBreakdown
