import React from 'react';
import Button from '../button/Button';

interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  count?: number;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickActionItem[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}

export default function QuickActions({ 
  title, 
  actions, 
  layout = 'horizontal',
  className = ''
}: QuickActionsProps) {
  
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col space-y-2';
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3';
      default:
        return 'flex flex-wrap gap-3';
    }
  };

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <div className={getLayoutClasses()}>
        {actions.map((action) => (
          <Button
            key={action.id}
            onClick={action.onClick}
            variant={action.variant || 'primary'}
            disabled={action.disabled}
            className={`${layout === 'grid' ? 'h-auto p-4 flex flex-col items-center text-center' : ''}`}
          >
            <div className={`${layout === 'grid' ? 'flex flex-col items-center space-y-2' : 'flex items-center space-x-2'}`}>
              <span className={`${layout === 'grid' ? 'text-2xl' : 'text-lg'}`}>
                {action.icon}
              </span>
              <span className="font-medium">
                {action.label}
                {action.count !== undefined && (
                  <span className="ml-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                    {action.count}
                  </span>
                )}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

// Predefined quick action sets for common scenarios
export const getPaymentActions = (
  pendingCount: number,
  onReviewPayments: () => void,
  onBulkApprove: () => void,
  onViewReports: () => void
): QuickActionItem[] => [
  {
    id: 'review-payments',
    label: 'Review Payments',
    icon: '💰',
    onClick: onReviewPayments,
    count: pendingCount,
    variant: pendingCount > 0 ? 'primary' : 'outline'
  },
  {
    id: 'bulk-approve',
    label: 'Quick Approve',
    icon: '✅',
    onClick: onBulkApprove,
    variant: 'outline',
    disabled: pendingCount === 0
  },
  {
    id: 'payment-reports',
    label: 'Payment Reports',
    icon: '📊',
    onClick: onViewReports,
    variant: 'outline'
  }
];

export const getCreatorActions = (
  onAddCreator: () => void,
  onViewCreators: () => void,
  onPerformanceReview: () => void
): QuickActionItem[] => [
  {
    id: 'add-creator',
    label: 'Add Creator',
    icon: '👤',
    onClick: onAddCreator,
    variant: 'default'
  },
  {
    id: 'view-creators',
    label: 'View All',
    icon: '👥',
    onClick: onViewCreators,
    variant: 'outline'
  },
  {
    id: 'performance-review',
    label: 'Performance Review',
    icon: '📈',
    onClick: onPerformanceReview,
    variant: 'outline'
  }
];

export const getContentActions = (
  onReviewContent: () => void,
  onGenerateReport: () => void,
  onAnalytics: () => void
): QuickActionItem[] => [
  {
    id: 'review-content',
    label: 'Review Content',
    icon: '📤',
    onClick: onReviewContent,
    variant: 'default'
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    icon: '📋',
    onClick: onGenerateReport,
    variant: 'outline'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📊',
    onClick: onAnalytics,
    variant: 'outline'
  }
]; 