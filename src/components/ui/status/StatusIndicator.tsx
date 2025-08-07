import React from 'react';

interface StatusIndicatorProps {
  status: string;
  type?: 'payment' | 'creator' | 'deliverable' | 'general';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

export default function StatusIndicator({ 
  status, 
  type = 'general', 
  size = 'md', 
  showIcon = true, 
  showLabel = true 
}: StatusIndicatorProps) {
  
  const getStatusConfig = (status: string, type: string) => {
    const configs: Record<string, Record<string, { color: string; icon: string; label: string }>> = {
      payment: {
        pending: {
          color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
          icon: '⏳',
          label: 'Pending Review'
        },
        approved: {
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
          icon: '✅',
          label: 'Approved'
        },
        paid: {
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
          icon: '💰',
          label: 'Paid'
        },
        denied: {
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
          icon: '❌',
          label: 'Denied'
        },
        on_hold: {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
          icon: '⏸️',
          label: 'On Hold'
        }
      },
      creator: {
        active: {
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
          icon: '🟢',
          label: 'Active'
        },
        inactive: {
          color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700',
          icon: '⚪',
          label: 'Inactive'
        },
        high_performer: {
          color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
          icon: '⭐',
          label: 'Top Performer'
        },
        needs_attention: {
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
          icon: '⚠️',
          label: 'Needs Attention'
        }
      },
      deliverable: {
        submitted: {
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
          icon: '📤',
          label: 'Submitted'
        },
        processing: {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
          icon: '⚙️',
          label: 'Processing'
        },
        completed: {
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
          icon: '✅',
          label: 'Completed'
        },
        high_engagement: {
          color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
          icon: '🔥',
          label: 'High Engagement'
        },
        low_engagement: {
          color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
          icon: '📉',
          label: 'Low Engagement'
        }
      },
      general: {
        success: {
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
          icon: '✅',
          label: 'Success'
        },
        warning: {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
          icon: '⚠️',
          label: 'Warning'
        },
        error: {
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
          icon: '❌',
          label: 'Error'
        },
        info: {
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
          icon: 'ℹ️',
          label: 'Info'
        }
      }
    };

    return configs[type]?.[status] || configs.general.info;
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig(status, type);
  const sizeClasses = getSizeClasses(size);

  return (
    <span 
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${config.color} ${sizeClasses}`}
    >
      {showIcon && (
        <span className="text-xs">{config.icon}</span>
      )}
      {showLabel && (
        <span>{config.label}</span>
      )}
    </span>
  );
}

// Export individual status components for convenience
export const PaymentStatus = ({ status, ...props }: Omit<StatusIndicatorProps, 'type'>) => (
  <StatusIndicator status={status} type="payment" {...props} />
);

export const CreatorStatus = ({ status, ...props }: Omit<StatusIndicatorProps, 'type'>) => (
  <StatusIndicator status={status} type="creator" {...props} />
);

export const DeliverableStatus = ({ status, ...props }: Omit<StatusIndicatorProps, 'type'>) => (
  <StatusIndicator status={status} type="deliverable" {...props} />
); 