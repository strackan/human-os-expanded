import { WorkflowConfig } from '../WorkflowConfig';

export const pricingAnalysisDemoConfig: WorkflowConfig = {
  customer: {
    name: 'Precision Analytics Corp',
    nextCustomer: 'Data Insights LLC'
  },
  layout: {
    modalDimensions: { width: 85, height: 90, top: 5, left: 7.5 },
    dividerPosition: 60,
    chatWidth: 40,
    splitModeDefault: true
  },
  customerOverview: {
    metrics: {
      arr: {
        label: 'ARR',
        value: '$420,000',
        trend: 'up',
        trendValue: '+32%',
        status: 'green'
      },
      licenseUnitPrice: {
        label: 'License Unit Price',
        value: '$6.50',
        sublabel: '(65% value)',
        status: 'orange',
        trend: 'Below market rate - expansion opportunity'
      },
      renewalDate: {
        label: 'Renewal Date',
        value: 'Jul 18, 2025',
        sublabel: '85 days',
        status: 'orange'
      },
      primaryContact: {
        label: 'Primary Contact',
        value: 'Dr. Rachel Thompson',
        role: 'Chief Data Officer'
      },
      riskScore: {
        label: 'Risk Score',
        value: '2.5/10',
        status: 'green',
        sublabel: 'Low renewal risk'
      },
      growthScore: {
        label: 'Growth Score',
        value: '9.5/10',
        status: 'green',
        sublabel: 'Exceptional expansion potential'
      },
      yoyGrowth: {
        label: 'YoY Growth',
        value: '+47%',
        status: 'green',
        sparkData: [4, 5, 7, 8, 10, 12, 14],
        sublabel: 'Annual'
      },
      lastMonth: {
        label: 'Last Month',
        value: '+18%',
        status: 'green',
        sparkData: [10, 11, 12, 13, 14, 15, 16],
        sublabel: 'Accelerating rapidly'
      }
    }
  },
  analytics: {
    usageTrend: {
      title: 'Usage Trend',
      showReferenceLine: true,
      referenceLineLabel: 'Current License Limit',
      referenceLineHeight: 20,
      data: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
      chartMin: 5,
      chartMax: 35,
      chartContextLabel: '⚠️ +250% growth - exceeding capacity',
      chartContextColor: 'text-red-600',
      dataColors: {
        threshold: 20,
        belowColor: 'bg-blue-500',
        aboveColor: 'bg-red-500'
      }
    },
    userLicenses: {
      title: 'License Utilization',
      showReferenceLine: true,
      referenceLineLabel: 'Licensed Capacity',
      referenceLineHeight: 25,
      data: [15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
      chartMin: 10,
      chartMax: 40,
      chartContextLabel: '📈 +133% over licensed capacity',
      chartContextColor: 'text-red-600',
      dataColors: { threshold: 25, belowColor: 'bg-green-500', aboveColor: 'bg-red-500' }
    },
    renewalInsights: {
      renewalStage: 'Pricing Strategy',
      confidence: 89,
      recommendedAction: 'Execute Strategic Price Optimization',
      keyReasons: [
        { category: 'Value Realization', detail: '47% growth demonstrates exceptional platform value' },
        { category: 'Market Position', detail: 'Currently 35% below market rate - significant upside opportunity' },
        { category: 'Usage Patterns', detail: 'Exceeding licensed capacity - immediate expansion required' },
        { category: 'Competitive Landscape', detail: 'Strong differentiation supports premium pricing strategy' }
      ]
    }
  },
  chat: {
    placeholder: 'Ask about pricing strategy, market analysis, or expansion opportunities...',
    aiGreeting: "Welcome to the Pricing Analysis Demo! I'll show you how our pricing artifact helps optimize renewal pricing strategies.",
    mode: 'dynamic',
    dynamicFlow: {
      startsWith: 'ai',
      defaultMessage: "I'm sorry, I didn't understand that. Please try one of the available options or ask about pricing analysis features.",
      initialMessage: {
        text: "Welcome to the **Pricing Analysis Demo**! 💰\n\nThis demo showcases how our pricing analysis artifact helps CSMs develop data-driven pricing strategies. Precision Analytics Corp is significantly underpriced with exceptional growth - perfect for strategic pricing optimization.\n\nWhat would you like to explore?",
        buttons: [
          { label: 'View pricing analysis', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
          { label: 'Understand market positioning', value: 'market-analysis', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
          { label: 'See expansion opportunities', value: 'expansion-analysis', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
        ],
        nextBranches: {
          'show-pricing': 'display-pricing-analysis',
          'market-analysis': 'market-positioning',
          'expansion-analysis': 'expansion-opportunities'
        }
      },
      branches: {
        'display-pricing-analysis': {
          response: "Here's the **Comprehensive Pricing Analysis** for Precision Analytics Corp. Notice how it shows current pricing metrics, comparative market analysis, and AI-powered recommendations for optimization.",
          delay: 1,
          actions: ['showArtifact'],
          artifactId: 'pricing-strategy-analysis',
          buttons: [
            { label: 'Analyze risk factors', value: 'risk-analysis', 'label-background': 'bg-red-100', 'label-text': 'text-red-800' },
            { label: 'Review opportunities', value: 'opportunity-analysis', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'See recommendations', value: 'pricing-recommendations', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' }
          ],
          nextBranches: {
            'risk-analysis': 'analyze-risks',
            'opportunity-analysis': 'analyze-opportunities',
            'pricing-recommendations': 'recommendation-detail'
          }
        },
        'market-positioning': {
          response: "**Market Positioning Analysis:**\n\n📊 **Current Position** - 35th percentile (significantly underpriced)\n💰 **Market Average** - $10.20/seat vs. their $6.50/seat\n🎯 **Competitive Landscape** - Premium features justify higher pricing\n📈 **Value Realization** - 47% growth proves exceptional ROI\n🏆 **Pricing Power** - Strong differentiation supports optimization\n\nTheir current pricing leaves significant value on the table.",
          delay: 1,
          buttons: [
            { label: 'See detailed analysis', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'View benchmarking data', value: 'benchmarking-deep-dive', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Explore optimization strategy', value: 'optimization-strategy', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' }
          ],
          nextBranches: {
            'show-pricing': 'display-pricing-analysis',
            'benchmarking-deep-dive': 'benchmarking-analysis',
            'optimization-strategy': 'strategy-development'
          }
        },
        'expansion-opportunities': {
          response: "**Expansion Opportunity Analysis:**\n\n🚀 **Usage Growth** - 250% increase indicates massive expansion potential\n💎 **Value Realization** - Strong ROI supports premium pricing discussion\n📈 **Capacity Exceeded** - Already using 140% of licensed capacity\n🎯 **Strategic Timing** - 85 days provides optimal negotiation window\n💰 **Revenue Upside** - Potential $180K+ ARR increase with proper positioning\n\nThis is a textbook expansion and pricing optimization opportunity.",
          delay: 1,
          buttons: [
            { label: 'See pricing analysis', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'View usage modeling', value: 'usage-modeling', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Design pricing strategy', value: 'strategy-design', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' }
          ],
          nextBranches: {
            'show-pricing': 'display-pricing-analysis',
            'usage-modeling': 'model-usage-growth',
            'strategy-design': 'design-strategy'
          }
        },
        'analyze-risks': {
          response: "**Risk Factor Analysis:**\n\n🟢 **Low Overall Risk** - Strong customer relationship and value realization\n🟡 **Price Sensitivity** - May need gradual increase strategy vs. immediate jump\n🟢 **Competitive Threat** - Minimal risk due to strong platform differentiation\n🟡 **Budget Cycles** - Need to align with their fiscal planning process\n🟢 **Usage Dependency** - High usage makes switching cost prohibitive\n\n**Mitigation Strategy:** Phased pricing approach with clear value justification.",
          delay: 1,
          buttons: [
            { label: 'See mitigation strategies', value: 'mitigation-strategies', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Review opportunities', value: 'opportunity-analysis', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'View different scenario', value: 'show-high-risk-example', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' }
          ],
          nextBranches: {
            'mitigation-strategies': 'explain-mitigation',
            'opportunity-analysis': 'analyze-opportunities',
            'show-high-risk-example': 'display-high-risk-analysis'
          }
        },
        'analyze-opportunities': {
          response: "**Strategic Opportunities Analysis:**\n\n💎 **Premium Tier Migration** - Move to enterprise pricing tier (+$3.70/seat)\n📈 **Usage-Based Expansion** - Additional capacity for 40% over-usage\n🎯 **Feature Upselling** - Advanced analytics modules they're requesting\n⚡ **Multi-Year Discount** - Lock in growth with attractive long-term terms\n🏆 **Strategic Partnership** - Position as technology partnership vs. vendor relationship\n\nCombined opportunity value: $180K+ annual increase",
          delay: 1,
          buttons: [
            { label: 'See detailed recommendations', value: 'pricing-recommendations', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Model financial impact', value: 'financial-modeling', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' },
            { label: 'Compare scenarios', value: 'scenario-comparison', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' }
          ],
          nextBranches: {
            'pricing-recommendations': 'recommendation-detail',
            'financial-modeling': 'model-financials',
            'scenario-comparison': 'compare-scenarios'
          }
        },
        'recommendation-detail': {
          response: "**AI-Powered Pricing Recommendations:**\n\n🎯 **Primary Recommendation** - 38% price increase to $9.00/seat (market-aligned)\n📊 **Implementation Strategy** - Phased approach over 6 months\n💰 **Value Justification** - ROI metrics and competitive differentiation\n⏰ **Timing Optimization** - Align with their Q3 budget planning cycle\n🤝 **Negotiation Framework** - Multi-year discount options for commitment\n\n**Expected Outcome:** $180K ARR increase with 94% retention probability",
          delay: 1,
          buttons: [
            { label: 'See implementation plan', value: 'implementation-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Model different scenarios', value: 'scenario-modeling', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'View high-risk example', value: 'show-high-risk-example', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' }
          ],
          nextBranches: {
            'implementation-planning': 'plan-implementation',
            'scenario-modeling': 'model-scenarios',
            'show-high-risk-example': 'display-high-risk-analysis'
          }
        },
        'benchmarking-analysis': {
          response: "**Competitive Benchmarking Deep Dive:**\n\n📊 **Industry Average** - $10.20/seat for similar analytics platforms\n🏆 **Premium Competitors** - $12.50-15.00/seat for enterprise features\n💎 **Value-Added Services** - Professional services commanding 25-40% premium\n📈 **Growth Stage Pricing** - High-growth companies typically pay 15-20% above market\n🎯 **Feature Comparison** - Your platform offers 30% more capabilities than average\n\nConclusion: Current pricing is 36% below fair market value",
          delay: 1,
          buttons: [
            { label: 'Back to pricing analysis', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'See optimization strategy', value: 'optimization-strategy', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-pricing': 'display-pricing-analysis',
            'optimization-strategy': 'strategy-development',
            'complete-demo': 'demo-complete'
          }
        },
        'display-high-risk-analysis': {
          response: "Here's a **High-Risk Pricing Scenario** for comparison. Notice how the artifact adapts its recommendations for customers with competitive threats, budget constraints, and pricing sensitivity.",
          delay: 1,
          actions: ['removeArtifact', 'showArtifact'],
          artifactId: 'high-risk-pricing-analysis',
          buttons: [
            { label: 'Compare with low-risk example', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Analyze risk mitigation', value: 'risk-mitigation-strategies', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-pricing': 'display-pricing-analysis',
            'risk-mitigation-strategies': 'explain-risk-mitigation',
            'complete-demo': 'demo-complete'
          }
        },
        'strategy-development': {
          response: "**Pricing Optimization Strategy Framework:**\n\n🎯 **Phase 1: Value Documentation** - Compile ROI metrics and success stories\n📊 **Phase 2: Market Positioning** - Present competitive analysis and benchmarking\n💰 **Phase 3: Gradual Implementation** - Phased pricing increases with value milestones\n🤝 **Phase 4: Partnership Discussion** - Position as strategic technology partnership\n📈 **Phase 5: Expansion Planning** - Align pricing with growth trajectory\n\nThis systematic approach maximizes acceptance while optimizing revenue.",
          delay: 1,
          buttons: [
            { label: 'See detailed implementation', value: 'implementation-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'View pricing scenarios', value: 'scenario-modeling', 'label-background': 'bg-purple-100', 'label-text': 'text-purple-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'implementation-planning': 'plan-implementation',
            'scenario-modeling': 'model-scenarios',
            'complete-demo': 'demo-complete'
          }
        },
        'plan-implementation': {
          response: "**Implementation Timeline & Tactics:**\n\n📅 **Month 1** - Value documentation and ROI presentation\n📊 **Month 2** - Market analysis and competitive positioning\n💰 **Month 3** - Initial pricing discussion with 15% increase proposal\n🎯 **Month 4** - Feature enhancement rollout with value demonstration\n📈 **Month 5** - Final pricing implementation and contract renewal\n\n**Success Factors:** Continuous value demonstration, stakeholder alignment, competitive differentiation emphasis",
          delay: 1,
          buttons: [
            { label: 'Back to recommendations', value: 'pricing-recommendations', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'See risk mitigation', value: 'mitigation-strategies', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'pricing-recommendations': 'recommendation-detail',
            'mitigation-strategies': 'explain-mitigation',
            'complete-demo': 'demo-complete'
          }
        },
        'explain-mitigation': {
          response: "**Risk Mitigation Strategies:**\n\n🎯 **Value-First Approach** - Lead with ROI metrics and business outcomes\n📊 **Gradual Implementation** - Phased increases to reduce sticker shock\n🤝 **Stakeholder Alignment** - Engage finance and executive sponsors early\n💎 **Feature Justification** - Tie pricing to new capabilities and enhanced value\n⚡ **Competitive Positioning** - Demonstrate cost of switching vs. price increase\n📈 **Growth Partnership** - Frame as investment in mutual success\n\nThese strategies typically improve pricing acceptance rates by 40-60%.",
          delay: 1,
          buttons: [
            { label: 'See pricing analysis', value: 'show-pricing', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'View high-risk scenario', value: 'show-high-risk-example', 'label-background': 'bg-yellow-100', 'label-text': 'text-yellow-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'show-pricing': 'display-pricing-analysis',
            'show-high-risk-example': 'display-high-risk-analysis',
            'complete-demo': 'demo-complete'
          }
        },
        'model-scenarios': {
          response: "**Pricing Scenario Modeling:**\n\n🟢 **Conservative (15% increase)** - $7.50/seat, 98% retention, +$63K ARR\n🟡 **Moderate (25% increase)** - $8.12/seat, 95% retention, +$102K ARR\n🟠 **Aggressive (38% increase)** - $9.00/seat, 92% retention, +$154K ARR\n🔵 **Premium (50% increase)** - $9.75/seat, 87% retention, +$178K ARR\n\n**Recommendation:** Moderate approach balances revenue growth with retention risk",
          delay: 1,
          buttons: [
            { label: 'See implementation strategy', value: 'implementation-planning', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Compare risk profiles', value: 'risk-comparison', 'label-background': 'bg-orange-100', 'label-text': 'text-orange-800' },
            { label: 'Complete demo', value: 'complete-demo', 'label-background': 'bg-green-100', 'label-text': 'text-green-800' }
          ],
          nextBranches: {
            'implementation-planning': 'plan-implementation',
            'risk-comparison': 'compare-risk-profiles',
            'complete-demo': 'demo-complete'
          }
        },
        'demo-complete': {
          response: "🎉 **Pricing Analysis Demo Complete!**\n\nYou've explored how the Pricing Analysis artifact enables strategic pricing optimization:\n\n• **Market Intelligence** - Competitive benchmarking and positioning analysis\n• **Risk Assessment** - Comprehensive evaluation of pricing change risks\n• **Opportunity Identification** - Revenue expansion and optimization opportunities\n• **AI-Powered Recommendations** - Data-driven pricing strategy suggestions\n• **Scenario Modeling** - Multiple pricing approaches with impact analysis\n• **Implementation Planning** - Tactical guidance for successful execution\n\nThis artifact is essential for maximizing revenue while maintaining customer relationships!",
          delay: 1,
          actions: ['showFinalSlide'],
          buttons: [
            { label: 'Restart demo', value: 'restart', 'label-background': 'bg-blue-100', 'label-text': 'text-blue-800' },
            { label: 'Exit demo', value: 'exit', 'label-background': 'bg-gray-100', 'label-text': 'text-gray-800' }
          ]
        }
      }
    },
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: true,
      artifactsToggle: true
    }
  },
  artifacts: {
    sections: [
      {
        id: 'pricing-strategy-analysis',
        title: 'Pricing Strategy Analysis',
        type: 'pricing-analysis',
        visible: false,
        content: {
            title: 'Q2 Pricing Strategy Analysis',
            customerName: 'Precision Analytics Corp',
            currentPrice: 420000,
            currentARR: 420000,
            pricePerUnit: 6.50,
            unitType: 'seat/month',
            comparativeAnalysis: {
              averagePrice: 10.20,
              percentile: 35,
              similarCustomerCount: 127
            },
            usageMetrics: {
              currentUsage: 140,
              usageGrowth: 250,
              usageEfficiency: 92
            },
            riskFactors: [
              {
                title: 'Price Sensitivity Concern',
                description: 'Customer may resist significant price increases despite strong value realization',
                impact: 'medium'
              },
              {
                title: 'Budget Cycle Timing',
                description: 'Renewal occurs mid-fiscal year which may impact budget availability',
                impact: 'low'
              },
              {
                title: 'Competitive Evaluation Risk',
                description: 'Large price increase might trigger competitive vendor evaluation',
                impact: 'low'
              }
            ],
            opportunities: [
              {
                title: 'Market Rate Alignment',
                description: 'Currently priced 36% below market average with significant upside potential',
                potential: 'high'
              },
              {
                title: 'Usage-Based Expansion',
                description: 'Already exceeding licensed capacity by 40% - immediate expansion justification',
                potential: 'high'
              },
              {
                title: 'Premium Feature Adoption',
                description: 'Strong interest in advanced analytics modules supports tier migration',
                potential: 'high'
              },
              {
                title: 'Multi-Year Commitment',
                description: 'Opportunity for strategic partnership with long-term pricing commitment',
                potential: 'medium'
              }
            ],
            recommendation: {
              priceIncrease: 38,
              newAnnualPrice: 579600,
              reasons: [
                'Market benchmarking supports $9.00/seat pricing for comparable features',
                'Exceptional 47% YoY growth demonstrates strong value realization and ROI',
                'Usage patterns indicate immediate need for capacity expansion',
                'Competitive differentiation justifies premium pricing position',
                'Strong customer relationship reduces churn risk from pricing optimization'
              ]
            }
          }
      },
      {
        id: 'high-risk-pricing-analysis',
        title: 'High-Risk Pricing Analysis',
        type: 'pricing-analysis',
        visible: false,
        content: {
            title: 'High-Risk Pricing Analysis',
            customerName: 'Budget-Conscious Systems Inc',
            currentPrice: 240000,
            currentARR: 240000,
            pricePerUnit: 8.00,
            unitType: 'seat/month',
            comparativeAnalysis: {
              averagePrice: 10.20,
              percentile: 68,
              similarCustomerCount: 89
            },
            usageMetrics: {
              currentUsage: 78,
              usageGrowth: 12,
              usageEfficiency: 67
            },
            riskFactors: [
              {
                title: 'Active Competitive Evaluation',
                description: 'Customer is currently evaluating 2 competitive alternatives with lower pricing',
                impact: 'high'
              },
              {
                title: 'Budget Constraints',
                description: 'Finance team has indicated budget pressure and cost reduction initiatives',
                impact: 'high'
              },
              {
                title: 'Limited Usage Growth',
                description: 'Only 12% usage growth indicates potential value realization challenges',
                impact: 'medium'
              },
              {
                title: 'Contract Flexibility',
                description: 'Current contract allows for early termination with 60-day notice',
                impact: 'high'
              }
            ],
            opportunities: [
              {
                title: 'Value Demonstration',
                description: 'Opportunity to better communicate ROI and business impact',
                potential: 'medium'
              },
              {
                title: 'Feature Optimization',
                description: 'Underutilized features could drive better value realization',
                potential: 'medium'
              },
              {
                title: 'Multi-Year Discount',
                description: 'Long-term commitment could offset pricing concerns',
                potential: 'low'
              }
            ],
            recommendation: {
              priceIncrease: 5,
              newAnnualPrice: 252000,
              reasons: [
                'Minimal increase maintains competitive position while addressing cost inflation',
                'Focus on value realization improvement before aggressive pricing',
                'Retain customer relationship while building stronger value foundation',
                'Consider pricing freeze in exchange for multi-year commitment',
                'Prioritize feature adoption and usage optimization over price increases'
              ]
            }
          }
      }
    ]
  },
  sidePanel: {
    enabled: true,
    title: {
      text: "Pricing Analysis Demo",
      subtitle: "Precision Analytics Corp",
      icon: "💰"
    },
    steps: [
      {
        id: "demo-intro",
        title: "Demo Introduction",
        description: "Overview of pricing analysis capabilities",
        status: "completed",
        workflowBranch: "initial",
        icon: "👋"
      },
      {
        id: "pricing-review",
        title: "Pricing Review",
        description: "Analyze current pricing and market position",
        status: "in-progress",
        workflowBranch: "display-pricing-analysis",
        icon: "📊"
      },
      {
        id: "opportunity-analysis",
        title: "Opportunity Analysis",
        description: "Identify revenue optimization opportunities",
        status: "pending",
        workflowBranch: "analyze-opportunities",
        icon: "🎯"
      },
      {
        id: "strategy-development",
        title: "Strategy Development",
        description: "Develop implementation strategy and timeline",
        status: "pending",
        workflowBranch: "strategy-development",
        icon: "🚀"
      }
    ],
    progressMeter: {
      currentStep: 2,
      totalSteps: 4,
      progressPercentage: 50,
      showPercentage: true,
      showStepNumbers: true
    },
    showProgressMeter: true,
    showSteps: true
  }
};