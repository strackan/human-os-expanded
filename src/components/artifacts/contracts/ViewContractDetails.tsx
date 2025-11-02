import React from 'react';
import { FileText, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

const ContractDetails = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Contract Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-800">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">MegaCorp Enterprise Agreement - Details</h2>
            <p className="text-sm text-gray-500">CNT-004 • Last Updated: Dec 15, 2024</p>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Financial Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Contract Value Trend</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">$180K</div>
            <div className="text-xs text-green-600">+12% vs last year</div>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>2023:</span>
                <span>$160K</span>
              </div>
              <div className="flex justify-between">
                <span>2024:</span>
                <span>$180K</span>
              </div>
              <div className="flex justify-between">
                <span>2025 (projected):</span>
                <span className="text-red-600">$207K (+15%)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Payment Performance</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">100%</div>
            <div className="text-xs text-green-600">On-time payments</div>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Average pay time:</span>
                <span>22 days</span>
              </div>
              <div className="flex justify-between">
                <span>Late payments:</span>
                <span className="text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span>Disputes:</span>
                <span className="text-green-600">0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">ROI Impact</span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">-8%</div>
            <div className="text-xs text-red-600">Due to price increases</div>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Current ROI:</span>
                <span>340%</span>
              </div>
              <div className="flex justify-between">
                <span>With 15% increase:</span>
                <span className="text-red-600">312%</span>
              </div>
              <div className="flex justify-between">
                <span>Break-even threshold:</span>
                <span>280%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Benchmarks */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Industry Benchmarks</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Liability Cap</span>
              <div className="text-right">
                <div className="text-sm font-medium text-red-600">Unlimited (High Risk)</div>
                <div className="text-xs text-gray-500">Industry: $500K-$1M</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price Escalation</span>
              <div className="text-right">
                <div className="text-sm font-medium text-red-600">15% annually</div>
                <div className="text-xs text-gray-500">Industry: 3-5%</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Termination Notice</span>
              <div className="text-right">
                <div className="text-sm font-medium text-red-600">90 days</div>
                <div className="text-xs text-gray-500">Industry: 30 days</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contract Length</span>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">24 months</div>
                <div className="text-xs text-gray-500">Industry: 12-36 months</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Negotiation Leverage</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment History</span>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">Excellent</div>
                <div className="text-xs text-gray-500">24 months, 0 late</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contract Duration</span>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">Long-term</div>
                <div className="text-xs text-gray-500">2+ years established</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Market Alternatives</span>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">3 viable options</div>
                <div className="text-xs text-gray-500">CompetitorA, B, C</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Switching Cost</span>
              <div className="text-right">
                <div className="text-sm font-medium text-amber-600">Medium</div>
                <div className="text-xs text-gray-500">~$45K setup cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Contract Terms */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Critical Contract Clauses</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">Section 8.2 - Liability & Indemnification</h4>
              <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Critical Risk</div>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded">
              &quot;Customer shall indemnify and hold harmless Provider against any and all claims, damages, losses, costs and expenses arising from Customer&apos;s use of the Services, without limitation as to amount or scope.&quot;
            </p>
            <div className="text-xs text-red-600">
              ⚠️ Unlimited liability exposure - could exceed contract value by 10x+ in worst case scenarios
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">Section 4.3 - Pricing & Escalation</h4>
              <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Critical Risk</div>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded">
              &quot;Service fees shall increase annually by fifteen percent (15%) effective on each anniversary date, automatically and without notice.&quot;
            </p>
            <div className="text-xs text-red-600">
              ⚠️ Automatic 15% increases will compound to $310K by year 5 vs industry standard 3% = $203K
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">Section 11.1 - Termination</h4>
              <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Medium Risk</div>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded">
              &quot;Either party may terminate this Agreement with ninety (90) days written notice to the other party.&quot;
            </p>
            <div className="text-xs text-amber-600">
              ⚠️ Extended notice period limits flexibility and negotiation leverage
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">Section 6.1 - Service Level Agreement</h4>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Favorable</div>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-mono bg-gray-50 p-2 rounded">
              &quot;Provider guarantees 99.5% uptime with 4-hour response time for critical issues.&quot;
            </p>
            <div className="text-xs text-green-600">
              ✓ Strong SLA terms with good penalty structure for non-compliance
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Historical Performance & Compliance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Service Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime (24 months):</span>
                <span className="font-medium text-green-600">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response time avg:</span>
                <span className="font-medium text-green-600">2.3 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SLA breaches:</span>
                <span className="font-medium text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer satisfaction:</span>
                <span className="font-medium text-green-600">4.6/5</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Contract Changes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amendments:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last amendment:</span>
                <span className="font-medium">Jun 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scope changes:</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disputes:</span>
                <span className="font-medium text-green-600">0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Key Contacts</h4>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-medium">Sarah Chen</div>
                <div className="text-gray-600">Primary Contact</div>
              </div>
              <div>
                <div className="font-medium">Mike Rodriguez</div>
                <div className="text-gray-600">Technical Lead</div>
              </div>
              <div>
                <div className="font-medium">Legal: Thompson & Associates</div>
                <div className="text-gray-600">Contract Counsel</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;