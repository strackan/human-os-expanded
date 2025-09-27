export interface ChartTemplate {
  falling: any;
  flat: any;
  rising: any;
}

export interface ChartTemplates {
  yoyGrowth: ChartTemplate;
  lastMonth: ChartTemplate;
  usageTrend: ChartTemplate;
  userLicenses: ChartTemplate;
}

// Chart Templates for different trend patterns
export const chartTemplates: ChartTemplates = {
  yoyGrowth: {
    falling: {
      label: 'YoY Growth',
      value: '-2.1% Annual',
      trend: 'declining',
      trendValue: '-2.1%',
      chart: {
        type: 'line',
        data: [
          { month: 'Jan', value: 5.2 },
          { month: 'Feb', value: 4.8 },
          { month: 'Mar', value: 3.9 },
          { month: 'Apr', value: 2.1 },
          { month: 'May', value: 1.2 },
          { month: 'Jun', value: 0.5 },
          { month: 'Jul', value: -0.8 },
          { month: 'Aug', value: -1.5 },
          { month: 'Sep', value: -2.1 },
          { month: 'Oct', value: -2.8 },
          { month: 'Nov', value: -3.2 },
          { month: 'Dec', value: -2.1 }
        ],
        threshold: 0,
        color: '#ef4444'
      }
    },
    flat: {
      label: 'YoY Growth',
      value: '+1.2% Annual',
      trend: 'flat',
      trendValue: '+1.2%',
      chart: {
        type: 'line',
        data: [
          { month: 'Jan', value: 1.8 },
          { month: 'Feb', value: 2.1 },
          { month: 'Mar', value: 1.5 },
          { month: 'Apr', value: 0.9 },
          { month: 'May', value: 1.2 },
          { month: 'Jun', value: 1.8 },
          { month: 'Jul', value: 2.3 },
          { month: 'Aug', value: 1.7 },
          { month: 'Sep', value: 0.8 },
          { month: 'Oct', value: 1.4 },
          { month: 'Nov', value: 1.9 },
          { month: 'Dec', value: 1.2 }
        ],
        threshold: 0,
        color: '#f59e0b'
      }
    },
    rising: {
      label: 'YoY Growth',
      value: '+8.7% Annual',
      trend: 'growing',
      trendValue: '+8.7%',
      chart: {
        type: 'line',
        data: [
          { month: 'Jan', value: 2.1 },
          { month: 'Feb', value: 3.2 },
          { month: 'Mar', value: 4.1 },
          { month: 'Apr', value: 5.3 },
          { month: 'May', value: 6.2 },
          { month: 'Jun', value: 7.1 },
          { month: 'Jul', value: 7.8 },
          { month: 'Aug', value: 8.2 },
          { month: 'Sep', value: 8.5 },
          { month: 'Oct', value: 8.7 },
          { month: 'Nov', value: 8.9 },
          { month: 'Dec', value: 8.7 }
        ],
        threshold: 0,
        color: '#10b981'
      }
    }
  },

  lastMonth: {
    falling: {
      label: 'Last Month',
      value: '-0.8% Flat',
      trend: 'declining',
      trendValue: '-0.8%',
      chart: {
        type: 'bar',
        data: [
          { week: 'W1', value: 2.1 },
          { week: 'W2', value: 1.8 },
          { week: 'W3', value: 1.2 },
          { week: 'W4', value: 0.5 },
          { week: 'W5', value: -0.8 }
        ],
        threshold: 0,
        color: '#ef4444'
      }
    },
    flat: {
      label: 'Last Month',
      value: '+0.2% Flat',
      trend: 'flat',
      trendValue: '+0.2%',
      chart: {
        type: 'bar',
        data: [
          { week: 'W1', value: 0.8 },
          { week: 'W2', value: 1.2 },
          { week: 'W3', value: 0.5 },
          { week: 'W4', value: -0.3 },
          { week: 'W5', value: 0.2 }
        ],
        threshold: 0,
        color: '#f59e0b'
      }
    },
    rising: {
      label: 'Last Month',
      value: '+3.4% Growing',
      trend: 'growing',
      trendValue: '+3.4%',
      chart: {
        type: 'bar',
        data: [
          { week: 'W1', value: 1.2 },
          { week: 'W2', value: 1.8 },
          { week: 'W3', value: 2.3 },
          { week: 'W4', value: 2.9 },
          { week: 'W5', value: 3.4 }
        ],
        threshold: 0,
        color: '#10b981'
      }
    }
  },

  usageTrend: {
    falling: {
      title: 'Weekly Users',
      showReferenceLine: true,
      referenceLineLabel: 'Uplift Threshold',
      referenceLineHeight: 10,
      data: [3, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 7, 8, 7, 7, 7, 6, 5, 6, 4],
      chartContextLabel: 'Usage declining over time. Needs attention.',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 15,
      dataColors: { threshold: 5, belowColor: 'bg-orange-600', aboveColor: 'bg-green-500' }
    },
    flat: {
      title: 'Weekly Users',
      showReferenceLine: true,
      referenceLineLabel: 'Uplift Threshold',
      referenceLineHeight: 10,
      data: [3, 3, 3, 3.2, 3.6, 2.7, 3.1, 3.5, 3.8, 3.2, 3.6, 3.4, 3.7, 3.3, 3.5, 3.8, 3.2, 3.6, 3.4, 3.7, 3.3, 3.5],
      chartContextLabel: 'Usage hovering around license limit.',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 15,
      dataColors: { threshold: 5, belowColor: 'bg-orange-600', aboveColor: 'bg-green-500' }
    },
    rising: {
      title: 'Weekly Users',
      showReferenceLine: true,
      referenceLineLabel: 'Uplift Threshold',
      referenceLineHeight: 10,
      data: [3, 3, 4, 5, 4, 6, 7, 6, 8, 9, 8, 10, 11, 10, 12, 13, 12, 14, 15, 14, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 22, 24, 25, 24, 26, 27, 26, 28, 29],
      chartContextLabel: 'Usage growing significantly above license limit.',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 30,
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    }
  },

  userLicenses: {
    falling: {
      title: 'License Usage',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 10,
      data: [1, 1, 1, 1, 0, 1, 1, 2, 2, 3, 2, 3, 4, 4, 3, 4, 4, 5, 4, 3, 1, 2, 4, 3, 3, 4, 6, 5, 5, 6, 4, 2, 5, 7, 4, 3, 6, 7, 2, 4],
      chartContextLabel: 'License consumption is low compared to total users',
      chartContextColor: 'text-yellow-600',
      chartMin: 0,
      chartMax: 15,
      dataColors: { threshold: 5, belowColor: 'bg-yellow-600', aboveColor: 'bg-green-500' }
    },
    flat: {
      title: 'License Usage',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 10,
      data: [3, 3, 3, 3, 3, 3, 3, 4, 4, 5, 4, 5, 6, 6, 5, 6, 6, 7, 6, 5, 3, 4, 6, 5, 5, 6, 8, 7, 7, 8, 6, 4, 7, 9, 6, 5, 8, 9, 4, 6],
      chartContextLabel: 'License consumption is balanced with total users',
      chartContextColor: 'text-orange-600',
      chartMin: 0,
      chartMax: 15,
      dataColors: { threshold: 5, belowColor: 'bg-orange-600', aboveColor: 'bg-green-500' }
    },
    rising: {
      title: 'License Usage',
      showReferenceLine: true,
      referenceLineLabel: 'License Limit',
      referenceLineHeight: 10,
      data: [5, 5, 6, 7, 6, 8, 9, 8, 10, 11, 10, 12, 13, 12, 14, 15, 14, 16, 17, 16, 18, 19, 18, 20, 21, 20, 22, 23, 22, 24, 25, 24, 26, 27, 26, 28, 29, 28, 30, 31],
      chartContextLabel: 'High license consumption with growing user base',
      chartContextColor: 'text-green-600',
      chartMin: 0,
      chartMax: 35,
      dataColors: { threshold: 20, belowColor: 'bg-blue-500', aboveColor: 'bg-green-500' }
    }
  }
};

// Helper function to get chart template by type and trend
export const getChartTemplate = (chartType: keyof ChartTemplates, trend: 'falling' | 'flat' | 'rising') => {
  return chartTemplates[chartType][trend];
};

// Helper function to resolve chart template variables
export const resolveChartTemplate = (templateString: string, chartType: keyof ChartTemplates, trend: 'falling' | 'flat' | 'rising') => {
  const template = getChartTemplate(chartType, trend);
  
  // Replace template variables with actual values
  return templateString
    .replace(/\{\{chart\.(\w+)\.(\w+)\}\}/g, (match, type, trend) => {
      const chartTemplate = getChartTemplate(type as keyof ChartTemplates, trend as 'falling' | 'flat' | 'rising');
      return JSON.stringify(chartTemplate);
    })
    .replace(/\{\{chart\.(\w+)\.(\w+)\.(\w+)\}\}/g, (match, type, trend, property) => {
      const chartTemplate = getChartTemplate(type as keyof ChartTemplates, trend as 'falling' | 'flat' | 'rising');
      return chartTemplate[property] || '';
    });
};
