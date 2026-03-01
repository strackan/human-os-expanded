import { motion } from 'framer-motion'

interface Entity {
  name: string
  score: number
  isSelected?: boolean
  id?: string
}

interface CompetitorComparisonProps {
  entities: Entity[]
  onEntityClick?: (entity: Entity) => void
}

// Bar colors for each entity
const barColors = [
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-blue-500',
]

function CompetitorComparison({ entities, onEntityClick }: CompetitorComparisonProps) {
  // Sort by score descending
  const sortedEntities = [...entities].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/20 card-hover h-full">
      <h3 className="text-lg font-semibold text-white mb-4">Competitive Analysis</h3>

      {/* Score comparison bars */}
      <div className="space-y-3">
        {sortedEntities.map((entity, index) => (
          <div
            key={entity.name}
            onClick={() => onEntityClick?.(entity)}
            className={onEntityClick ? 'cursor-pointer hover:bg-purple-800/20 rounded-lg p-2 -m-2 transition-colors' : ''}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`font-medium ${entity.isSelected ? 'text-white' : 'text-purple-300'} ${onEntityClick ? 'hover:text-white' : ''}`}>
                {entity.name}
              </span>
              <span className={`font-bold ${entity.isSelected ? 'text-white' : 'text-purple-300'}`}>
                {entity.score}
              </span>
            </div>
            <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${entity.score}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                className={`h-full bg-gradient-to-r ${barColors[index % barColors.length]} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CompetitorComparison
