import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { apiService, User, Deliverable, SocialMediaReport, SocialMediaSearchParams } from "../../services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";

export default function CreatorDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [creator, setCreator] = useState<User | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social Media Analytics State
  const [socialReports, setSocialReports] = useState<SocialMediaReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SocialMediaReport | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchParams, setSearchParams] = useState<SocialMediaSearchParams>({
    platform: 'instagram',
    profileUrl: '',
    resultsLimit: 50,
    searchType: 'all',
    resultsType: 'all',
  });

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    Promise.all([
      apiService.getAllUsers().then(users => {
        const foundCreator = users.find(u => u.userId === id);
        if (!foundCreator) throw new Error("Creator not found");
        return foundCreator;
      }),
      apiService.getDeliverables().then(allDeliverables => {
        // Filter to only show deliverables for this creator
        return allDeliverables.filter(d => d.creatorId === id);
      }),
      // Load existing social media reports
      user?.role === 'admin' ? apiService.getCreatorSocialMediaReports(id).then(result => result.reports) : Promise.resolve([])
    ])
    .then(([creatorData, creatorDeliverables, reports]) => {
      setCreator(creatorData);
      setDeliverables(creatorDeliverables);
      setSocialReports(reports);
    })
    .catch(() => setError("Failed to load creator details."))
    .finally(() => setLoading(false));
  }, [id, user?.role]);

  // Social Media Analytics Search
  const handleSocialMediaSearch = async () => {
    if (!id || !searchParams.profileUrl.trim()) {
      setError('Creator ID and Profile URL are required');
      return;
    }

    setSearchLoading(true);
    setError(null);

    try {
      const result = await apiService.scrapeSocialMediaContent({
        ...searchParams,
        creatorId: id,
      });
      
      // Add the new report to the list
      setSocialReports(prev => [result.report, ...prev]);
      setShowSearchModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create social media report';
      setError(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleReportClick = (report: SocialMediaReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await apiService.deleteSocialMediaReport(reportId);
      setSocialReports(prev => prev.filter(r => r.reportId !== reportId));
      if (selectedReport?.reportId === reportId) {
        setShowReportModal(false);
        setSelectedReport(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      setError(errorMessage);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementColor = (rate: number): string => {
    if (rate >= 10) return 'text-green-600';
    if (rate >= 5) return 'text-yellow-600';
    if (rate >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEngagementLabel = (rate: number): string => {
    if (rate >= 10) return 'Excellent';
    if (rate >= 5) return 'Good';
    if (rate >= 2) return 'Average';
    return 'Low';
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Creator Details | Frontline"
          description="View creator details and statistics"
        />
        <PageBreadcrumb pageTitle="Creator Details" />
        <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="p-8 text-center text-gray-500">Loading creator details...</div>
        </div>
      </>
    );
  }

  if (error || !creator) {
    return (
      <>
        <PageMeta
          title="User Details | Frontline"
          description="View user details and statistics"
        />
        <PageBreadcrumb pageTitle="User Details" />
        <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="p-8 text-center text-red-500">{error || "User not found"}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${creator.name} | User Details`}
        description="View user details and deliverables."
      />
      <PageBreadcrumb pageTitle={`${creator.role === 'creator' ? 'Creator' : 'User'}: ${creator.name}`} />
      <div className="rounded-2xl border border-gray-200 bg-white md:ml-64 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Creator Info Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium text-xl">
                {creator.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{creator.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{creator.email}</p>
            </div>
            <Badge color="info">
              {creator.role}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">User ID</div>
              <div className="font-medium text-gray-800 dark:text-white/90">{creator.userId}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Join Date</div>
              <div className="font-medium text-gray-800 dark:text-white/90">
                {new Date(creator.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {creator.role === 'creator' ? 'Total Deliverables' : 'Account Type'}
              </div>
              <div className="font-medium text-gray-800 dark:text-white/90">
                {creator.role === 'creator' ? deliverables.length : creator.role.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                Social Media Links
              </h3>
              <div className="flex flex-wrap gap-3">
                {creator.socialLinks.tiktok && (
                  <a
                    href={creator.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"                  >
                    <span className="mr-2">🎵</span>
                    TikTok
                  </a>
                )}

                {creator.socialLinks.instagram && (
                  <a
                    href={creator.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors duration-200"                  >
                    <span className="mr-2">📷</span>
                    Instagram
                  </a>
                )}
                {creator.socialLinks.telegram && (
                  <a
                    href={creator.socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors duration-200"                  >
                    <span className="mr-2">📱</span>
                    Telegram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Deliverables Section - Only show for creators */}
        {creator.role === 'creator' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Deliverables
            </h2>
          {deliverables.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
              No deliverables submitted yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Platform
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Link
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Submitted
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Views
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Likes
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"                      >
                        Comments
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {deliverables.map((deliverable) => (
                      <TableRow key={deliverable.deliverableId}>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge size="sm" color="primary">
                            {deliverable.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <a 
                            href={deliverable.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-brand-500 underline hover:text-brand-600 break-all"                          >
                            {deliverable.link}
                          </a>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(deliverable.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {deliverable.stats?.views ?? '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {deliverable.stats?.likes ?? '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {deliverable.stats?.comments ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Social Media Analytics Section - Admin Only */}
        {user?.role === 'admin' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Social Media Analytics Reports
              </h2>
              <Button                onClick={() => setShowSearchModal(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white"
              >
                Generate New Report
              </Button>
            </div>

            {socialReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialReports.filter(report => report && report.platform).map((report) => (
                  <div
                    key={report.reportId}
                    className="bg-white dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"                    onClick={() => handleReportClick(report)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge size="sm" color="primary">
                        {report.platform}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Overview</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Posts:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{report.analytics?.totalPosts || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Likes:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{formatNumber(report.analytics?.totalLikes || 0)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Comments:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">{formatNumber(report.analytics?.totalComments || 0)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Engagement:</span>                            <span className={`ml-1 font-medium ${getEngagementColor(report.analytics?.engagementRate || 0)}`}>
                              {getEngagementLabel(report.analytics?.engagementRate || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Types</h5>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            {report.analytics?.contentTypes?.images || 0} Images
                          </span>
                          <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {report.analytics?.contentTypes?.videos || 0} Videos
                          </span>
                          <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            {report.analytics?.contentTypes?.reels || 0} Reels
                          </span>
                        </div>
                      </div>

                      {report.analytics?.topHashtags && report.analytics.topHashtags.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Top Hashtags</h5>
                          <div className="flex flex-wrap gap-1">
                            {report.analytics.topHashtags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"                              >
                                {tag.tag}
                              </span>
                            ))}
                            {report.analytics.topHashtags.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{report.analytics.topHashtags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="mb-2">No social media analytics reports yet.</p>
                <p className="text-sm">Click "Generate New Report" to start analyzing this creator's social media performance.</p>
              </div>
            )}
          </div>
        )}

        {/* Search Modal */}
        <Modal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)}>
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate Social Media Analytics Report
              </h3>
              <button                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <select
                  value={searchParams.platform}                  onChange={(e) => setSearchParams(prev => ({ ...prev, platform: e.target.value as 'instagram' | 'tiktok' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>

                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile URL
                </label>
                <input
                  type="url"
                  value={searchParams.profileUrl}                  onChange={(e) => setSearchParams(prev => ({ ...prev, profileUrl: e.target.value }))}
                  placeholder="https://www.instagram.com/username/"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Results Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={searchParams.resultsLimit}                    onChange={(e) => setSearchParams(prev => ({ ...prev, resultsLimit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={searchParams.resultsType}                    onChange={(e) => setSearchParams(prev => ({ ...prev, resultsType: e.target.value as 'posts' | 'stories' | 'reels' | 'all' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Content</option>
                    <option value="posts">Posts</option>
                    <option value="stories">Stories</option>
                    <option value="reels">Reels</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Type
                  </label>
                  <select
                    value={searchParams.searchType}                    onChange={(e) => setSearchParams(prev => ({ ...prev, searchType: e.target.value as 'hashtag' | 'keyword' | 'all' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Content</option>
                    <option value="hashtag">Filter by Hashtag</option>
                    <option value="keyword">Filter by Keyword</option>
                  </select>
                </div>

                {searchParams.searchType !== 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter Query
                    </label>
                    <input
                      type="text"
                      value={searchParams.searchQuery || ''}                      onChange={(e) => setSearchParams(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder={searchParams.searchType === 'hashtag' ? 'fitness, workout, etc.' : 'keyword to search for'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {searchParams.searchType === 'hashtag' 
                        ? 'Will filter posts containing this hashtag' 
                        : 'Will filter posts containing this keyword in caption or hashtags'
                      }
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button                  onClick={() => setShowSearchModal(false)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSocialMediaSearch}
                  disabled={searchLoading}
                  className="bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"                >
                  {searchLoading ? 'Generating Report...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Report Detail Modal */}
        <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)}>
          {selectedReport && (
            <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Social Media Analytics Report
                </h3>
                <div className="flex items-center gap-2">
                  <Button                    onClick={() => handleDeleteReport(selectedReport.reportId)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm"
                  >
                    Delete Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Overview */}
                <div className="space-y-6">
                  {/* Report Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Report Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Platform:</span>
                        <Badge size="sm" color="primary">{selectedReport.platform}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Profile:</span>
                        <a href={selectedReport.profileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
                          {selectedReport.profileUrl}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Generated:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(selectedReport.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Posts Analyzed:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReport.analytics.totalPosts}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatNumber(selectedReport.analytics.totalLikes)}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Total Likes</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatNumber(selectedReport.analytics.totalComments)}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Total Comments</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedReport.analytics.averageLikes}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Avg. Likes</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {selectedReport.analytics.averageComments}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Avg. Comments</div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Rate */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Engagement Rate</h4>
                    <div className="text-center">                      <div className={`text-4xl font-bold ${getEngagementColor(selectedReport.analytics.engagementRate)}`}>
                        {selectedReport.analytics.engagementRate}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {getEngagementLabel(selectedReport.analytics.engagementRate)} Engagement
                      </div>
                    </div>
                  </div>

                  {/* Content Types */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Content Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Images</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"                               style={{ width: `${(selectedReport.analytics.contentTypes.images / selectedReport.analytics.totalPosts) * 100}%` }}                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedReport.analytics.contentTypes.images}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Videos</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"                               style={{ width: `${(selectedReport.analytics.contentTypes.videos / selectedReport.analytics.totalPosts) * 100}%` }}                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedReport.analytics.contentTypes.videos}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Reels</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"                               style={{ width: `${(selectedReport.analytics.contentTypes.reels / selectedReport.analytics.totalPosts) * 100}%` }}                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedReport.analytics.contentTypes.reels}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Top Hashtags */}
                  {selectedReport.analytics.topHashtags.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Hashtags</h4>
                      <div className="space-y-2">
                        {selectedReport.analytics.topHashtags.slice(0, 10).map((tag, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">#{tag.tag}</span>
                            <Badge size="sm" color="primary">{tag.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posting Frequency */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Posting Frequency</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedReport.analytics.postingFrequency.daily}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Last 24h</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedReport.analytics.postingFrequency.weekly}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Last 7 days</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedReport.analytics.postingFrequency.monthly}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">Last 30 days</div>
                      </div>
                    </div>
                  </div>

                  {/* Best Performing Posts */}
                  {selectedReport.analytics.bestPerformingPosts.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Best Performing Posts</h4>
                      <div className="space-y-3">
                        {selectedReport.analytics.bestPerformingPosts.map((post, index) => (
                          <div key={post.id} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                #{index + 1} Best Post
                              </span>
                              <a 
                                href={post.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:underline text-xs"                              >
                                View Post
                              </a>
                            </div>
                            {post.caption && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {post.caption}
                              </p>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>❤️ {formatNumber(post.likes)}</span>
                              <span>💬 {formatNumber(post.comments)}</span>
                              {post.views && <span>👁️ {formatNumber(post.views)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
} 