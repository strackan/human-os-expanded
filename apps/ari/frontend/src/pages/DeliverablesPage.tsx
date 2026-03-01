import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import deliverablesClient from '../api/deliverables'
import DeliverableNav from '../components/deliverables/DeliverableNav'
import DeliverableViewer from '../components/deliverables/DeliverableViewer'
import ExportButtons from '../components/deliverables/ExportButtons'

export default function DeliverablesPage() {
  const { slug, doc } = useParams<{ slug?: string; doc?: string }>()
  const navigate = useNavigate()

  // Fetch customers
  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => deliverablesClient.listCustomers(),
  })

  // Fetch deliverables for selected customer
  const {
    data: deliverables = [],
    isLoading: deliverablesLoading,
  } = useQuery({
    queryKey: ['deliverables', slug],
    queryFn: () => deliverablesClient.listDeliverables(slug!),
    enabled: !!slug,
  })

  // Fetch document content
  const {
    data: content,
    isLoading: contentLoading,
  } = useQuery({
    queryKey: ['deliverable', slug, doc],
    queryFn: () => deliverablesClient.getDeliverable(slug!, doc!),
    enabled: !!slug && !!doc,
  })

  // Navigate to first deliverable when customer is selected
  useEffect(() => {
    if (slug && deliverables.length > 0 && !doc) {
      navigate(`/deliverables/${slug}/${deliverables[0].filename}`, { replace: true })
    }
  }, [slug, deliverables, doc, navigate])

  // Navigate to first customer when page loads
  useEffect(() => {
    if (!slug && customers.length > 0) {
      navigate(`/deliverables/${customers[0].slug}`, { replace: true })
    }
  }, [slug, customers, navigate])

  const handleSelectCustomer = (newSlug: string) => {
    navigate(`/deliverables/${newSlug}`)
  }

  const handleSelectDoc = (filename: string) => {
    navigate(`/deliverables/${slug}/${filename}`)
  }

  const selectedCustomer = customers.find((c) => c.slug === slug)
  const selectedDeliverable = deliverables.find((d) => d.filename === doc)
  const isProposal = doc?.includes('proposal') || doc?.startsWith('01-')

  // Loading state
  if (customersLoading) {
    return (
      <div className="min-h-screen bg-deliverable-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-deliverable-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-deliverable-text-secondary">Loading deliverables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deliverable-background flex">
      {/* Sidebar Navigation */}
      <DeliverableNav
        customers={customers}
        selectedCustomer={slug || null}
        deliverables={deliverables}
        selectedDoc={doc || null}
        onSelectCustomer={handleSelectCustomer}
        onSelectDoc={handleSelectDoc}
        isLoading={deliverablesLoading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with export buttons */}
        {slug && doc && (
          <div className="bg-deliverable-surface border-b border-deliverable-border px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-deliverable-text-primary">
                {selectedDeliverable?.title || doc}
              </h2>
              <p className="text-sm text-deliverable-text-secondary">
                {selectedCustomer?.name}
              </p>
            </div>
            <ExportButtons
              slug={slug}
              doc={doc}
              showPptx={isProposal}
            />
          </div>
        )}

        {/* Document content */}
        <div className="flex-1 overflow-y-auto">
          {contentLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 border-4 border-deliverable-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-deliverable-text-secondary">Loading document...</p>
              </div>
            </div>
          ) : content ? (
            <DeliverableViewer
              content={content.content}
              title={content.title}
              customerName={selectedCustomer?.name || slug || ''}
            />
          ) : slug ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-deliverable-highlight flex items-center justify-center">
                  <svg className="w-8 h-8 text-deliverable-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-deliverable-text-secondary">
                  Select a document from the sidebar
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-deliverable-accent to-deliverable-accent-warm flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">ARI</span>
                </div>
                <h2 className="text-xl font-semibold text-deliverable-text-primary mb-2">
                  Client Deliverables
                </h2>
                <p className="text-deliverable-text-secondary mb-6">
                  View and export branded client reports, analysis documents, and proposals.
                </p>
                {customers.length === 0 && (
                  <p className="text-sm text-deliverable-text-secondary bg-deliverable-highlight rounded-lg px-4 py-3">
                    No customers found. Add deliverables to the <code className="bg-deliverable-border px-1 rounded">customers/</code> directory.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
