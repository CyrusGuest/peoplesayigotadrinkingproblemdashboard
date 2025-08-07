import React, { useState } from 'react';
import { useBackgroundProcesses, BackgroundProcess } from '../context/BackgroundProcessContext';
import Button from './ui/button/Button';
import Badge from './ui/badge/Badge';

const BackgroundProcessWidget: React.FC = () => {
  const { activeProcesses, cancelProcess } = useBackgroundProcesses();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeProcesses.length === 0) {
    return null;
  }

  const getProcessIcon = (type: string) => {
    switch (type) {
      case 'scraping':
        return '🔍';
      case 'report':
        return '📊';
      case 'analysis':
        return '📈';
      case 'export':
        return '📤';
      default:
        return '⚙️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'primary';
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">⚡</span>
          <span className="font-medium text-gray-900 dark:text-white">
            Background Tasks
          </span>
          <Badge color="primary">
            {activeProcesses.length}
          </Badge>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {activeProcesses.map((process) => (
            <div
              key={process.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getProcessIcon(process.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {process.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {process.description}
                    </p>
                  </div>
                </div>
                <Badge color={getStatusColor(process.status)}>
                  {process.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{process.currentStep || 'Processing...'}</span>
                  <span>{process.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${process.progress}%` }}
                  />
                </div>
              </div>

              {/* Process Info */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Started {formatDuration(process.startedAt)} ago</span>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    cancelProcess(process.id);
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed View */}
      {!isExpanded && activeProcesses.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>⚡</span>
            <span>{activeProcesses.length} active task{activeProcesses.length !== 1 ? 's' : ''}</span>
          </div>
          {activeProcesses.slice(0, 2).map((process) => (
            <div key={process.id} className="mt-1 flex items-center space-x-2">
              <span className="text-xs">{getProcessIcon(process.type)}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {process.title}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div
                  className="bg-brand-500 h-1 rounded-full"
                  style={{ width: `${process.progress}%` }}
                />
              </div>
            </div>
          ))}
          {activeProcesses.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              +{activeProcesses.length - 2} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundProcessWidget; 