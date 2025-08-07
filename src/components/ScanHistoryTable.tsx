import React, { useState, useEffect } from 'react';
import ComponentCard from './common/ComponentCard';
import Badge from './ui/badge/Badge';
import Button from './ui/button/Button';
import { ScanType } from './UnifiedScanModal';

interface ScanHistoryEntry {
  id: string;
  scanType: ScanType;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  details: {
    platform?: string;
    profileUrl?: string;
    kolId?: string;
    searchQuery?: string;
  };
  results?: {
    scannedProfiles?: number;
    postsMatched?: number;
    message?: string;
  };
}

interface ScanHistoryTableProps {
  limit?: number;
  compact?: boolean;
  onViewDetails?: (scan: ScanHistoryEntry) => void;
}

export const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({
  limit = 10,
  compact = false,
  onViewDetails
}) => {
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadScanHistory();
    
    // Set up interval to refresh history
    const interval = setInterval(loadScanHistory, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadScanHistory = () => {
    // Load from localStorage (in production, this would be an API call)
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    setScanHistory(history);
  };

  const getScanTypeLabel = (type: ScanType) => {
    switch (type) {
      case 'daily': return 'Daily Scan';
      case 'hashtag': return 'Hashtag Scan';
      case 'profile': return 'Profile Scan';
      case 'manual': return 'Manual Search';
      default: return 'Unknown';
    }
  };

  const getScanTypeIcon = (type: ScanType) => {
    switch (type) {
      case 'daily': return '📅';
      case 'hashtag': return '#️⃣';
      case 'profile': return '👤';
      case 'manual': return '🔎';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const displayedHistory = showAll ? scanHistory : scanHistory.slice(0, limit);

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Scans
          </h3>
          <button
            onClick={loadScanHistory}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Refresh
          </button>
        </div>
        
        {scanHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No scan history available
          </p>
        ) : (
          <div className="space-y-2">
            {displayedHistory.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getScanTypeIcon(scan.scanType)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getScanTypeLabel(scan.scanType)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(scan.timestamp)}
                    </p>
                  </div>
                </div>
                <Badge color={getStatusColor(scan.status)} size="sm">
                  {scan.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        {scanHistory.length > limit && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Show all ({scanHistory.length})
          </button>
        )}
      </div>
    );
  }

  return (
    <ComponentCard title="📊 Scan History">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {displayedHistory.length} of {scanHistory.length} scans
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={loadScanHistory}
          >
            🔄 Refresh
          </Button>
        </div>

        {scanHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400">
              No scans have been performed yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Start a scan to see history here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Results
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getScanTypeIcon(scan.scanType)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getScanTypeLabel(scan.scanType)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(scan.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(scan.timestamp)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {scan.details.platform && (
                          <p>Platform: {scan.details.platform}</p>
                        )}
                        {scan.details.searchQuery && (
                          <p>Query: {scan.details.searchQuery}</p>
                        )}
                        {!scan.details.platform && !scan.details.searchQuery && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {scan.results?.scannedProfiles !== undefined && (
                          <p className="text-gray-900 dark:text-white">
                            {scan.results.scannedProfiles} profiles
                          </p>
                        )}
                        {scan.results?.postsMatched !== undefined && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {scan.results.postsMatched} matches
                          </p>
                        )}
                        {!scan.results && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge color={getStatusColor(scan.status)}>
                        {scan.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails?.(scan)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {scanHistory.length > limit && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${scanHistory.length})`}
            </Button>
          </div>
        )}
      </div>
    </ComponentCard>
  );
};