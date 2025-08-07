import { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, SocialMediaReport, User } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import { showToast } from "../../utils/toast";

export default function Reports() {
  const [reports, setReports] = useState<SocialMediaReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SocialMediaReport | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, usersData] = await Promise.all([
        apiService.getAdminReports(), // We'll need to create this endpoint
        apiService.getAllUsers(),
      ]);
      setReports(reportsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report: SocialMediaReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteReport(reportId); // We'll need to create this endpoint
      showToast.success('Report deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete report:', error);
      showToast.error('Failed to delete report');
    }
  };

  const getCreatorName = (creatorId: string) => {
    const creator = users.find(u => u.userId === creatorId);
    return creator ? creator.name : 'Unknown Creator';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷';

      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600 dark:text-green-400';
    if (rate >= 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  const filteredReports = reports.filter(report => {
    const matchesPlatform = filterPlatform === 'all' || report.platform === filterPlatform;
    const matchesCreator = filterCreator === 'all' || report.creatorId === filterCreator || (!report.creatorId && filterCreator === 'unassigned');
    const matchesSearch = !searchQuery || 
      report.profileUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.creatorId && getCreatorName(report.creatorId).toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesPlatform && matchesCreator && matchesSearch;
  });

  return (
    <>
      <PageMeta
        title="Admin Reports | Frontline"
        description="View and manage admin-generated social media reports"
      />
      <PageBreadcrumb pageTitle="Admin Reports" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Header */}
        <ComponentCard title="Social Media Reports">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Generated Reports</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reports created through the admin tools for research and analysis
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge color="info">{filteredReports.length} Reports</Badge>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
  
                  <option value="tiktok">TikTok</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Linked Creator
                </label>
                <select
                  value={filterCreator}
                  onChange={(e) => setFilterCreator(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="unassigned">Unassigned</option>
                  {users.filter(u => u.role === 'creator').map(creator => (
                    <option key={creator.userId} value={creator.userId}>
                      {creator.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by profile URL or creator name..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Reports Grid/Table */}
        <ComponentCard title="Reports Table">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading reports...</div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                {reports.length === 0 ? 'No admin reports found' : 'No reports match your filters'}
              </div>
              {reports.length === 0 && (
                <p className="text-sm text-gray-400">
                  Reports will appear here when created through Admin Tools
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Platform & Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Linked Creator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReports.map((report) => (
                    <tr key={report.reportId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getPlatformIcon(report.platform)}</span>
                          <div>
                            <Badge size="sm" color="primary">
                              {report.platform.toUpperCase()}
                            </Badge>
                            <p className="text-sm text-gray-900 dark:text-white font-medium mt-1">
                              {report.profileUrl.replace(/^https?:\/\//, '').substring(0, 30)}...
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {report.analytics?.totalPosts || 0} posts analyzed
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.creatorId ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getCreatorName(report.creatorId)}
                            </p>
                            <Badge size="sm" color="success">Linked</Badge>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned</p>
                            <Badge size="sm" color="primary">Research</Badge>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <span>❤️</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatNumber(report.analytics?.totalLikes || 0)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>💬</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatNumber(report.analytics?.totalComments || 0)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📊</span>
                            <span className={`font-medium ${getEngagementColor(report.analytics?.engagementRate || 0)}`}>
                              {(report.analytics?.engagementRate || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(report)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.reportId)}
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
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
        </ComponentCard>
      </div>

      {/* Report Details Modal */}
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
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getPlatformIcon(selectedReport.platform)}</span>
                    <Badge color="primary">
                      {selectedReport.platform.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h4>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
              </div>

              {/* Profile URL */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile URL</h4>
                <a
                  href={selectedReport.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {selectedReport.profileUrl}
                </a>
              </div>

              {/* Linked Creator */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Linked Creator</h4>
                {selectedReport.creatorId ? (
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 dark:text-white">
                      {getCreatorName(selectedReport.creatorId)}
                    </p>
                    <Badge size="sm" color="success">Linked</Badge>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-500 dark:text-gray-400">Unassigned</p>
                                         <Badge size="sm" color="primary">Research</Badge>
                  </div>
                )}
              </div>

              {/* Analytics */}
              {selectedReport.analytics && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Performance Analytics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedReport.analytics.totalPosts}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(selectedReport.analytics.totalLikes)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(selectedReport.analytics.totalComments)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className={`text-2xl font-bold ${getEngagementColor(selectedReport.analytics.engagementRate)}`}>
                        {selectedReport.analytics.engagementRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Parameters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Parameters</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Results Limit:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedReport.searchParams?.resultsLimit || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Search Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-white capitalize">
                        {selectedReport.searchParams?.searchType || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Results Type:</span>
                      <span className="ml-2 text-gray-900 dark:text-white capitalize">
                        {selectedReport.searchParams?.resultsType || 'N/A'}
                      </span>
                    </div>
                    {selectedReport.searchParams?.searchQuery && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Search Query:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {selectedReport.searchParams.searchQuery}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
} 