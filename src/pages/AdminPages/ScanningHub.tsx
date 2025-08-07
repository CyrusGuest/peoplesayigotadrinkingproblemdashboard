import React, { useState } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { UnifiedScanModal } from "../../components/UnifiedScanModal";
import { ScanHistoryTable } from "../../components/ScanHistoryTable";
import { showToast } from "../../utils/toast";

export default function ScanningHub() {
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<'daily' | 'hashtag' | 'profile' | 'manual'>('daily');

  const handleQuickScan = (type: 'daily' | 'hashtag' | 'profile' | 'manual') => {
    setSelectedScanType(type);
    setScanModalOpen(true);
  };

  const handleScanComplete = () => {
    showToast.success('Scan completed successfully!');
    // Trigger any data refresh needed
  };

  return (
    <>
      <PageMeta title="Scanning Hub | Frontline" description="Centralized content scanning and tracking" />
      <PageBreadcrumb pageTitle="Scanning Hub" />
      
      <div className="space-y-6 lg:ml-64 p-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Scanning Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">Centralized scanning and tracking for all KOL content</p>
          </div>
          
          <Button
            onClick={() => setScanModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔍 Open Scanner
          </Button>
        </div>

        {/* Quick Scan Actions */}
        <ComponentCard title="⚡ Quick Scan Actions">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">📅</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Daily Compliance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Check all posts scheduled for today and update their status
                </p>
                <Button
                  size="sm"
                  onClick={() => handleQuickScan('daily')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Daily Scan
                </Button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">#️⃣</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Hashtag Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Search for campaign hashtags across all KOL profiles
                </p>
                <Button
                  size="sm"
                  onClick={() => handleQuickScan('hashtag')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Start Hashtag Scan
                </Button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profile Scan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Scan a specific KOL profile for recent posts
                </p>
                <Button
                  size="sm"
                  onClick={() => handleQuickScan('profile')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Profile Scan
                </Button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">🔎</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Manual Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Custom search with specific keywords or parameters
                </p>
                <Button
                  size="sm"
                  onClick={() => handleQuickScan('manual')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Start Manual Search
                </Button>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Scan Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts Found</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">47</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profiles Scanned</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">23</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <ScanHistoryTable limit={10} />

        {/* How It Works */}
        <ComponentCard title="📖 How Scanning Works">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Choose Scan Type</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select from Daily, Hashtag, Profile, or Manual scan based on your needs
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Configure Parameters</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set platform, profile URLs, or search queries as needed
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Automatic Processing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    System automatically scans profiles and updates post statuses
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Review Results</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View scan history and take action on late or missing posts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Unified Scan Modal */}
      <UnifiedScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        availableScanTypes={['daily', 'hashtag', 'profile', 'manual']}
        defaultScanType={selectedScanType}
        onScanComplete={handleScanComplete}
      />
    </>
  );
};