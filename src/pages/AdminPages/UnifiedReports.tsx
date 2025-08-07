import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, SocialMediaReport, User } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { showToast } from "../../utils/toast";

// Unified scan/report type that combines all scan types
interface UnifiedScanReport {
  id: string;
  type: 'social_media' | 'kol_calendar' | 'hashtag' | 'profile' | 'daily' | 'manual' | 'individual_video';
  source: 'admin_tools' | 'kol_calendar' | 'creator_page' | 'deliverables' | 'api';
  platform?: 'instagram' | 'tiktok' | 'both';
  status: 'completed' | 'failed' | 'in_progress';
  createdAt: string;
  createdBy: string;
  creatorId?: string;
  creatorName?: string;
  
  // Scan-specific data
  scanType?: string;
  profileUrl?: string;
  searchQuery?: string;
  resultsCount?: number;
  
  // Report data (for social media scrapes)
  report?: SocialMediaReport;
  
  // KOL scan data
  postsMatched?: number;
  scannedProfiles?: number;
  
  // Common metrics
  metrics?: {
    totalViews?: number;
    totalLikes?: number;
    totalComments?: number;
    totalShares?: number;
    engagementRate?: number;
  };
  
  // Raw data storage
  rawData?: any;
}

export default function UnifiedReports() {
  const [reports, setReports] = useState<UnifiedScanReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<UnifiedScanReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load from multiple sources
      const [usersData, localScans] = await Promise.all([
        apiService.getAllUsers(),
        loadLocalScanHistory(),
      ]);
      
      setUsers(usersData);
      
      // Combine all scan sources
      const allReports = [
        ...localScans,
        // Add API-based reports when endpoint is ready
      ];
      
      setReports(allReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalScanHistory = (): UnifiedScanReport[] => {
    // Load from localStorage for now
    const scanHistory = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    
    return scanHistory.map((scan: any) => ({
      id: scan.id || Date.now().toString(),
      type: scan.scanType || 'manual',
      source: 'admin_tools',
      status: scan.status || 'completed',
      createdAt: scan.timestamp || new Date().toISOString(),
      createdBy: 'admin',
      platform: scan.details?.platform,
      searchQuery: scan.details?.searchQuery,
      resultsCount: scan.results?.postsMatched,
      scannedProfiles: scan.results?.scannedProfiles,
      rawData: scan
    }));
  };

  const handleViewDetails = (report: UnifiedScanReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      // Remove from localStorage for now
      const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
      const updated = history.filter((h: any) => h.id !== reportId);
      localStorage.setItem('scanHistory', JSON.stringify(updated));
      
      showToast.success('Report deleted successfully');
      loadData();
    } catch (error) {
      showToast.error('Failed to delete report');
    }
  };

  const handleExportReport = (report: UnifiedScanReport) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `report-${report.type}-${report.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast.success('Report exported successfully');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'social_media': return '📱';
      case 'kol_calendar': return '📅';
      case 'hashtag': return '#️⃣';
      case 'profile': return '👤';
      case 'daily': return '📆';
      case 'manual': return '🔍';
      case 'individual_video': return '🎬';
      default: return '📊';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'social_media': return 'primary';
      case 'kol_calendar': return 'success';
      case 'hashtag': return 'warning';
      case 'profile': return 'info';
      case 'daily': return 'default';
      default: return 'default';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'admin_tools': return 'Admin Tools';
      case 'kol_calendar': return 'KOL Calendar';
      case 'creator_page': return 'Creator Page';
      case 'deliverables': return 'Deliverables';
      case 'api': return 'API';
      default: return source;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCreatorName = (creatorId?: string) => {
    if (!creatorId) return 'N/A';
    const creator = users.find(u => u.userId === creatorId);
    return creator ? creator.name : 'Unknown';
  };

  // Apply filters
  const filteredReports = reports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesSource = filterSource === 'all' || report.source === filterSource;
    const matchesPlatform = filterPlatform === 'all' || report.platform === filterPlatform;
    const matchesCreator = filterCreator === 'all' || 
      (filterCreator === 'unassigned' && !report.creatorId) ||
      report.creatorId === filterCreator;
    
    // Date range filter
    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const reportDate = new Date(report.createdAt);
      const now = new Date();
      
      switch (filterDateRange) {
        case 'today':
          matchesDate = reportDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = reportDate >= monthAgo;
          break;
      }
    }
    
    const matchesSearch = !searchQuery || 
      report.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.searchQuery && report.searchQuery.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSource && matchesPlatform && matchesCreator && matchesDate && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 lg:ml-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Unified Reports | Frontline" description="All scan reports and analytics" />
      <PageBreadcrumb pageTitle="Unified Reports" />
      
      <div className="space-y-6 lg:ml-64 p-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unified Reports Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              All scan reports and analytics from across the platform
            </p>
          </div>
          
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Scans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reports.length > 0 
                    ? Math.round((reports.filter(r => r.status === 'completed').length / reports.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Sources</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {[...new Set(reports.map(r => r.source))].length}
                </p>
              </div>
              <div className="text-3xl">🔗</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ComponentCard title="🔍 Filters">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select
                  defaultValue={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'social_media', label: 'Social Media' },
                    { value: 'daily', label: 'Daily Scan' },
                    { value: 'hashtag', label: 'Hashtag Scan' },
                    { value: 'profile', label: 'Profile Scan' },
                    { value: 'manual', label: 'Manual Search' },
                    { value: 'individual_video', label: 'Video Analysis' },
                  ]}
                />
              </div>
              
              <div>
                <Label>Source</Label>
                <Select
                  defaultValue={filterSource}
                  onChange={setFilterSource}
                  options={[
                    { value: 'all', label: 'All Sources' },
                    { value: 'admin_tools', label: 'Admin Tools' },
                    { value: 'kol_calendar', label: 'KOL Calendar' },
                    { value: 'creator_page', label: 'Creator Page' },
                    { value: 'deliverables', label: 'Deliverables' },
                    { value: 'api', label: 'API' },
                  ]}
                />
              </div>
              
              <div>
                <Label>Platform</Label>
                <Select
                  defaultValue={filterPlatform}
                  onChange={setFilterPlatform}
                  options={[
                    { value: 'all', label: 'All Platforms' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'tiktok', label: 'TikTok' },
                  ]}
                />
              </div>
              
              <div>
                <Label>Creator</Label>
                <Select
                  defaultValue={filterCreator}
                  onChange={setFilterCreator}
                  options={[
                    { value: 'all', label: 'All Creators' },
                    { value: 'unassigned', label: 'Unassigned' },
                    ...users
                      .filter(u => u.role === 'creator')
                      .map(u => ({ value: u.userId, label: u.name }))
                  ]}
                />
              </div>
              
              <div>
                <Label>Date Range</Label>
                <Select
                  defaultValue={filterDateRange}
                  onChange={setFilterDateRange}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'Last 7 Days' },
                    { value: 'month', label: 'Last 30 Days' },
                  ]}
                />
              </div>
              
              <div>
                <Label>Search</Label>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reports..."
                />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Reports Table */}
        <ComponentCard title={`📊 Reports (${filteredReports.length})`}>
          <div className="p-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-500 dark:text-gray-400">
                  No reports found matching your filters
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
                        Source
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Creator
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Results
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
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
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getTypeIcon(report.type)}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {report.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge color="default" size="sm">
                            {getSourceLabel(report.source)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {report.platform ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {report.platform}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getCreatorName(report.creatorId)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {report.resultsCount !== undefined && (
                              <p className="text-gray-900 dark:text-white">
                                {report.resultsCount} results
                              </p>
                            )}
                            {report.scannedProfiles !== undefined && (
                              <p className="text-gray-600 dark:text-gray-400">
                                {report.scannedProfiles} profiles
                              </p>
                            )}
                            {!report.resultsCount && !report.scannedProfiles && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(report.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            color={report.status === 'completed' ? 'success' : report.status === 'failed' ? 'error' : 'warning'}
                            size="sm"
                          >
                            {report.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(report)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportReport(report)}
                            >
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Report Details
            </h3>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Report Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{getTypeIcon(selectedReport.type)}</span>
                    <span className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                      {selectedReport.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>Created</Label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
                
                <div>
                  <Label>Source</Label>
                  <Badge color="default" size="lg">
                    {getSourceLabel(selectedReport.source)}
                  </Badge>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Badge 
                    color={selectedReport.status === 'completed' ? 'success' : selectedReport.status === 'failed' ? 'error' : 'warning'}
                    size="lg"
                  >
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>

              {/* Metrics if available */}
              {selectedReport.metrics && (
                <div>
                  <Label>Metrics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {selectedReport.metrics.totalViews !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(selectedReport.metrics.totalViews)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                      </div>
                    )}
                    {selectedReport.metrics.totalLikes !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(selectedReport.metrics.totalLikes)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                      </div>
                    )}
                    {selectedReport.metrics.totalComments !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(selectedReport.metrics.totalComments)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                      </div>
                    )}
                    {selectedReport.metrics.engagementRate !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedReport.metrics.engagementRate.toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div>
                <Label>Raw Data</Label>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                    {JSON.stringify(selectedReport.rawData || selectedReport, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleExportReport(selectedReport)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};