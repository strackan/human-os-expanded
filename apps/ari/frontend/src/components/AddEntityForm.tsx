import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient, { Entity } from '../api/client'

interface AddEntityFormProps {
  onEntityCreated?: (entity: Entity) => void
  onClose?: () => void
}

export default function AddEntityForm({ onEntityCreated, onClose }: AddEntityFormProps) {
  const queryClient = useQueryClient()
  const [entityType, setEntityType] = useState<'person' | 'company'>('company')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('content_syndication')
  const [aliases, setAliases] = useState('')

  // Person-specific fields
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')

  // Company-specific fields
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const metadata: Record<string, unknown> = {}

      if (entityType === 'person') {
        if (jobTitle) metadata.job_title = jobTitle
        if (company) metadata.company = company
      } else {
        if (websiteUrl) metadata.website_url = websiteUrl
        if (description) metadata.description = description
      }

      const newEntity = {
        name: name.trim(),
        type: entityType,
        category,
        aliases: aliases.split(',').map(a => a.trim()).filter(Boolean),
        metadata,
      }

      return apiClient.createEntity(newEntity)
    },
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      onEntityCreated?.(entity)
      // Reset form
      setName('')
      setAliases('')
      setJobTitle('')
      setCompany('')
      setWebsiteUrl('')
      setDescription('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Add New Entity</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 text-2xl"
          >
            &times;
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entity Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Entity Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEntityType('company')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                entityType === 'company'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => setEntityType('person')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                entityType === 'person'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
              }`}
            >
              Person
            </button>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            {entityType === 'company' ? 'Company Name' : 'Full Name'} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={entityType === 'company' ? 'e.g., Acme Corp' : 'e.g., John Smith'}
            className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="content_syndication">Content Syndication</option>
            <option value="technology">Technology</option>
            <option value="marketing">Marketing</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Conditional Fields based on Entity Type */}
        <AnimatePresence mode="wait">
          {entityType === 'person' ? (
            <motion.div
              key="person-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., CEO, Marketing Director"
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="company-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g., https://example.com"
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the company..."
                  rows={2}
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aliases Field */}
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Aliases (comma-separated)
          </label>
          <input
            type="text"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="e.g., ACME, Acme Corporation"
            className="w-full px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <p className="text-xs text-purple-400/60 mt-1">
            Alternative names AI might use when mentioning this entity
          </p>
        </div>

        {/* Error Display */}
        {createMutation.isError && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            Failed to create entity: {(createMutation.error as Error).message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-purple-900/30 text-purple-300 font-medium rounded-lg hover:bg-purple-900/50 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!name.trim() || createMutation.isPending}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">&#9696;</span>
                Creating...
              </span>
            ) : (
              'Create & Run Test'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
