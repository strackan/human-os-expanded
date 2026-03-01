/**
 * API client for deliverables endpoints
 */

const API_BASE = '/api/v1'

export interface CustomerInfo {
  slug: string
  name: string
  deliverable_count: number
}

export interface DeliverableInfo {
  filename: string
  title: string
  path: string
}

export interface DeliverableContent {
  slug: string
  filename: string
  title: string
  content: string
}

class DeliverablesClient {
  private baseUrl: string

  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * List all customers with deliverables
   */
  async listCustomers(): Promise<CustomerInfo[]> {
    return this.fetch<CustomerInfo[]>('/deliverables/')
  }

  /**
   * List deliverables for a customer
   */
  async listDeliverables(slug: string): Promise<DeliverableInfo[]> {
    return this.fetch<DeliverableInfo[]>(`/deliverables/${slug}`)
  }

  /**
   * Get markdown content for a deliverable
   */
  async getDeliverable(slug: string, doc: string): Promise<DeliverableContent> {
    return this.fetch<DeliverableContent>(`/deliverables/${slug}/${doc}`)
  }

  /**
   * Get URL for PDF download
   */
  getPdfUrl(slug: string, doc: string): string {
    return `${this.baseUrl}/deliverables/${slug}/${doc}/pdf`
  }

  /**
   * Get URL for PPTX download
   */
  getPptxUrl(slug: string): string {
    return `${this.baseUrl}/deliverables/${slug}/proposal/pptx`
  }

  /**
   * Download PDF
   */
  async downloadPdf(slug: string, doc: string): Promise<void> {
    const url = this.getPdfUrl(slug, doc)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = doc.replace('.md', '.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  /**
   * Download PPTX
   */
  async downloadPptx(slug: string): Promise<void> {
    const url = this.getPptxUrl(slug)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download PPTX: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${slug}-proposal.pptx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
}

export const deliverablesClient = new DeliverablesClient()
export default deliverablesClient
