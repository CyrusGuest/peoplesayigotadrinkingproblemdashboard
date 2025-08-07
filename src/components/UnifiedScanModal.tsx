import React, { useState, useEffect } from 'react';
import { Modal } from './ui/modal';
import Button from './ui/button/Button';
import Input from './form/input/InputField';
import Select from './form/Select';
import Label from './form/Label';
import { apiService } from '../services/api';
import { showToast } from '../utils/toast';

export type ScanType = 'daily' | 'hashtag' | 'profile' | 'manual';

interface UnifiedScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableScanTypes?: ScanType[];
  defaultScanType?: ScanType;
  pageContext?: 'calendar' | 'creators' | 'deliverables';
  onScanComplete?: () => void;
}

export const UnifiedScanModal: React.FC<UnifiedScanModalProps> = ({
  isOpen,
  onClose,
  availableScanTypes = ['daily', 'hashtag', 'profile', 'manual'],
  defaultScanType = 'daily',
  pageContext = 'calendar',
  onScanComplete
}) => {
  const [scanType, setScanType] = useState<ScanType>(defaultScanType);
  const [scanning, setScanning] = useState(false);
  const [scanConfig, setScanConfig] = useState({
    platform: '' as 'instagram' | 'tiktok' | '',
    profileUrl: '',
    kolId: '',
    searchQuery: '',
    resultsLimit: 10
  });

  useEffect(() => {
    if (isOpen) {
      setScanType(defaultScanType);
      setScanConfig({
        platform: '',
        profileUrl: '',
        kolId: '',
        searchQuery: '',
        resultsLimit: 10
      });
    }
  }, [isOpen, defaultScanType]);

  const getScanTypeInfo = (type: ScanType) => {
    switch (type) {
      case 'daily':
        return {
          title: '📡 Daily Compliance Scan',
          description: 'Automatically check all scheduled posts for today and update their status',
          icon: '📅',
          color: 'blue'
        };
      case 'hashtag':
        return {
          title: '🏷️ Hashtag Tracking Scan',
          description: 'Search for posts containing campaign hashtags across all KOL profiles',
          icon: '#️⃣',
          color: 'purple'
        };
      case 'profile':
        return {
          title: '👤 Profile Content Scan',
          description: 'Scan a specific KOL profile for recent posts and content',
          icon: '🔍',
          color: 'green'
        };
      case 'manual':
        return {
          title: '🎯 Manual Content Search',
          description: 'Search for specific content using keywords or hashtags',
          icon: '🔎',
          color: 'orange'
        };
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      let result;
      
      switch (scanType) {
        case 'daily':
          result = await apiService.triggerDailyScan();
          showToast.success('Daily scan completed successfully');
          break;
          
        case 'hashtag':
          result = await apiService.triggerCalendarHashtagScan();
          showToast.success(`Hashtag scan completed! ${result.scannedProfiles} profiles scanned`);
          break;
          
        case 'profile':
          if (!scanConfig.kolId || !scanConfig.platform) {
            showToast.error('Please select a KOL and platform');
            return;
          }
          result = await apiService.triggerManualScan(scanConfig.kolId, scanConfig.platform);
          showToast.success('Profile scan completed');
          break;
          
        case 'manual':
          if (!scanConfig.platform || !scanConfig.profileUrl) {
            showToast.error('Please provide platform and profile URL');
            return;
          }
          // This would call a manual search endpoint
          showToast.info('Manual search feature coming soon');
          break;
      }
      
      // Store scan in history (this would be an API call)
      await storeScanHistory({
        scanType,
        timestamp: new Date().toISOString(),
        status: 'completed',
        details: scanConfig,
        results: result
      });
      
      onScanComplete?.();
      onClose();
    } catch (error: any) {
      showToast.error(error.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const storeScanHistory = async (scanData: any) => {
    // This would be an API call to store scan history
    // For now, we'll store in localStorage
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    history.unshift({
      ...scanData,
      id: Date.now().toString()
    });
    // Keep only last 50 scans
    localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)));
  };

  const typeInfo = getScanTypeInfo(scanType);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{typeInfo.icon}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Content Scanning Center
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated content detection and tracking
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Scan Type Selector */}
          <div className="mb-6">
            <Label>Select Scan Type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {availableScanTypes.map((type) => {
                const info = getScanTypeInfo(type);
                return (
                  <button
                    key={type}
                    onClick={() => setScanType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      scanType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{info.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {info.title.split(' ').slice(1).join(' ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scan Configuration */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {typeInfo.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {typeInfo.description}
            </p>

            {/* Additional fields based on scan type */}
            {(scanType === 'profile' || scanType === 'manual') && (
              <div className="space-y-4">
                <div>
                  <Label>Platform</Label>
                  <Select
                    defaultValue={scanConfig.platform}
                    onChange={(value) => setScanConfig(prev => ({ 
                      ...prev, 
                      platform: value as 'instagram' | 'tiktok' 
                    }))}
                    options={[
                      { value: '', label: 'Select platform...' },
                      { value: 'instagram', label: 'Instagram' },
                      { value: 'tiktok', label: 'TikTok' }
                    ]}
                  />
                </div>

                {scanType === 'manual' && (
                  <>
                    <div>
                      <Label>Profile URL</Label>
                      <Input
                        type="url"
                        value={scanConfig.profileUrl}
                        onChange={(e) => setScanConfig(prev => ({ 
                          ...prev, 
                          profileUrl: e.target.value 
                        }))}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div>
                      <Label>Search Query (Optional)</Label>
                      <Input
                        type="text"
                        value={scanConfig.searchQuery}
                        onChange={(e) => setScanConfig(prev => ({ 
                          ...prev, 
                          searchQuery: e.target.value 
                        }))}
                        placeholder="Keywords or hashtags to search for"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Scan Info */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {scanType === 'daily' && 'This will check all posts scheduled for today and update their status automatically.'}
                  {scanType === 'hashtag' && 'Searches for campaign hashtags across all active KOL profiles.'}
                  {scanType === 'profile' && 'Scans recent posts from a specific KOL profile.'}
                  {scanType === 'manual' && 'Perform a custom search with specific parameters.'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {scanning && 'Scanning in progress...'}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={scanning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScan}
                disabled={scanning}
                className={`${
                  typeInfo.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  typeInfo.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  typeInfo.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-orange-600 hover:bg-orange-700'
                } text-white`}
              >
                {scanning ? 'Scanning...' : `Start ${scanType === 'daily' ? 'Daily' : scanType === 'hashtag' ? 'Hashtag' : scanType === 'profile' ? 'Profile' : 'Manual'} Scan`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};