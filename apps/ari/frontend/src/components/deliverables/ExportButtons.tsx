import { useState } from 'react'
import deliverablesClient from '../../api/deliverables'

interface ExportButtonsProps {
  slug: string
  doc: string
  showPptx?: boolean
}

export default function ExportButtons({ slug, doc, showPptx = false }: ExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pptxLoading, setPptxLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePdfDownload = async () => {
    setPdfLoading(true)
    setError(null)
    try {
      await deliverablesClient.downloadPdf(slug, doc)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handlePptxDownload = async () => {
    setPptxLoading(true)
    setError(null)
    try {
      await deliverablesClient.downloadPptx(slug)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download PPTX')
    } finally {
      setPptxLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* PDF Button */}
      <button
        onClick={handlePdfDownload}
        disabled={pdfLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-deliverable-accent text-white text-sm font-medium rounded-lg hover:bg-deliverable-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pdfLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        {pdfLoading ? 'Generating...' : 'Download PDF'}
      </button>

      {/* PPTX Button (only for proposals) */}
      {showPptx && (
        <button
          onClick={handlePptxDownload}
          disabled={pptxLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-deliverable-accent-warm text-white text-sm font-medium rounded-lg hover:bg-deliverable-accent-warm/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pptxLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          )}
          {pptxLoading ? 'Generating...' : 'Download PPTX'}
        </button>
      )}

      {/* Error message */}
      {error && (
        <span className="text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
