// KPI Widget Configuration - All KPIs locked to 3x1 size
export const KPI_WIDGET_SIZE = {
  width: 3,
  height: 1,
  locked: true
};

export const KPI_WIDGETS = [
  'total-applications',
  'spending-2024',
  'spending-2025',
  'total-savings',
  'patch-compliance',
  'license-utilization',
  'renewals-30',
  'cost-per-employee',
  'high-risk',
  'medium-risk',
  'low-risk'
];

export const isKPIWidget = (widgetType: string): boolean => {
  return KPI_WIDGETS.includes(widgetType);
};

export const getWidgetSize = (widgetType: string) => {
  if (isKPIWidget(widgetType)) {
    return { ...KPI_WIDGET_SIZE };
  }
  // Return default for non-KPI widgets
  return null;
};
