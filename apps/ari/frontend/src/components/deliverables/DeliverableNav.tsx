import type { DeliverableInfo, CustomerInfo } from '../../api/deliverables'

interface DeliverableNavProps {
  customers: CustomerInfo[]
  selectedCustomer: string | null
  deliverables: DeliverableInfo[]
  selectedDoc: string | null
  onSelectCustomer: (slug: string) => void
  onSelectDoc: (filename: string) => void
  isLoading?: boolean
}

export default function DeliverableNav({
  customers,
  selectedCustomer,
  deliverables,
  selectedDoc,
  onSelectCustomer,
  onSelectDoc,
  isLoading = false,
}: DeliverableNavProps) {
  return (
    <nav className="w-64 bg-deliverable-surface border-r border-deliverable-border h-full overflow-y-auto">
      <div className="p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-deliverable-accent to-deliverable-accent-warm flex items-center justify-center font-bold text-white text-sm">
            ARI
          </div>
          <div>
            <h1 className="text-sm font-semibold text-deliverable-text-primary">Deliverables</h1>
            <p className="text-xs text-deliverable-text-secondary">Client Reports</p>
          </div>
        </div>

        {/* Customer selector */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-deliverable-text-secondary uppercase tracking-wider mb-2">
            Customer
          </label>
          <select
            value={selectedCustomer || ''}
            onChange={(e) => onSelectCustomer(e.target.value)}
            className="w-full px-3 py-2 bg-deliverable-background border border-deliverable-border rounded-lg text-sm text-deliverable-text-primary focus:outline-none focus:ring-2 focus:ring-deliverable-accent focus:border-transparent"
            disabled={isLoading}
          >
            <option value="">Select customer...</option>
            {customers.map((customer) => (
              <option key={customer.slug} value={customer.slug}>
                {customer.name} ({customer.deliverable_count})
              </option>
            ))}
          </select>
        </div>

        {/* Document list */}
        {selectedCustomer && (
          <div>
            <label className="block text-xs font-medium text-deliverable-text-secondary uppercase tracking-wider mb-2">
              Documents
            </label>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-deliverable-highlight animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {deliverables.map((doc) => {
                  const isSelected = doc.filename === selectedDoc
                  return (
                    <li key={doc.filename}>
                      <button
                        onClick={() => onSelectDoc(doc.filename)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-deliverable-accent text-white font-medium'
                            : 'text-deliverable-text-primary hover:bg-deliverable-highlight'
                        }`}
                      >
                        {doc.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedCustomer && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-deliverable-highlight flex items-center justify-center">
              <svg className="w-6 h-6 text-deliverable-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-deliverable-text-secondary">
              Select a customer to view deliverables
            </p>
          </div>
        )}
      </div>
    </nav>
  )
}
