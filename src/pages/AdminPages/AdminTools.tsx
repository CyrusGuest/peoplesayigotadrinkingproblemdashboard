import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import { apiService, User, SocialMediaSearchParams, SocialMediaReport } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { UnifiedScanModal } from "../../components/UnifiedScanModal";
import { ScanHistoryTable } from "../../components/ScanHistoryTable";
import { showToast } from "../../utils/toast";

interface ScrapingForm {
  creatorId: string;
  platform: 'instagram' | 'tiktok';
  profileUrl: string;
  resultsLimit: number;
  searchType: 'hashtag' | 'keyword' | 'all';
  searchQuery?: string;
  resultsType: 'posts' | 'stories' | 'reels' | 'all';
  isAdminGenerated?: boolean;
}

interface IndividualVideoForm {
  platform: 'instagram' | 'tiktok';
  videoUrl: string;
}



interface ScrapingResult {
  success: boolean;
  report: SocialMediaReport;
  totalResults: number;
  searchParams: SocialMediaSearchParams;
}

export default function AdminTools() {

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>([]);
  const [scrapingForm, setScrapingForm] = useState<ScrapingForm>({
    creatorId: '',
    platform: 'instagram',
    profileUrl: '',
    resultsLimit: 50,
    searchType: 'all',
    searchQuery: '',
    resultsType: 'all'
  });
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null);
  const [individualVideoResult, setIndividualVideoResult] = useState<any>(null);

  const [showScrapingModal, setShowScrapingModal] = useState(false);
  const [showIndividualVideoModal, setShowIndividualVideoModal] = useState(false);
  const [showUnifiedScanModal, setShowUnifiedScanModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [individualVideoForm, setIndividualVideoForm] = useState<IndividualVideoForm>({
    platform: 'tiktok',
    videoUrl: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, platformsData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getSupportedPlatforms()
      ]);
      setUsers(usersData);
      setSupportedPlatforms(platformsData.platforms);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showToast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMediaScraping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await apiService.scrapeSocialMediaContent({
        ...scrapingForm,
        creatorId: scrapingForm.creatorId || undefined, // Allow undefined for admin reports
        isAdminGenerated: true // Mark as admin-generated report
      });
      
      if ('processId' in result) {
        showToast.success('Social media scraping started in background! Check the sidebar for progress.');
        setShowScrapingModal(false);
      } else {
        setScrapingResult(result);
        showToast.success('Social media content scraped successfully!');
        setShowResultsModal(true);
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to scrape social media content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIndividualVideoScraping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await apiService.scrapeIndividualVideo(
        individualVideoForm.platform,
        individualVideoForm.videoUrl
      );
      
      setIndividualVideoResult(result);
      showToast.success('Individual video scraped successfully!');
      setShowIndividualVideoModal(true);
    } catch (err: any) {
      showToast.error(err.message || 'Failed to scrape individual video');
    } finally {
      setSubmitting(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📷';

      default: return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 lg:ml-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading admin tools...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Admin Tools | Frontline"
        description="Advanced tools for platform administration"
      />
      <PageBreadcrumb pageTitle="Admin Tools" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Header */}
        <ComponentCard title="Admin Tools">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Tools
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Advanced tools for platform administration and social media analytics.
              </p>
            </div>
          </div>
        </ComponentCard>

        {/* Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <ComponentCard title="Instagram Scraping">
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scrape Instagram profiles for posts, reels, and stories
              </p>
              <Button onClick={() => setShowScrapingModal(true)}>
                Start Scraping
              </Button>
            </div>
          </ComponentCard>



          <ComponentCard title="Post Analysis">
            <div className="text-center">
              <div className="text-4xl mb-4">🎬</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Analyze individual TikTok and Instagram videos
              </p>
              <Button onClick={() => setShowIndividualVideoModal(true)}>
                Analyze Video
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Platform Capabilities">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">📸</span>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Instagram</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Profiles + Videos</p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">🎵</span>
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">TikTok</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Videos Only</p>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Content Scanning">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Unified content scanning and detection tools
              </p>
              <Button
                onClick={() => setShowUnifiedScanModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Open Scanner
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="All Reports">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View all generated reports and scan history
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/admin-reports'}
              >
                View All Reports
              </Button>
            </div>
          </ComponentCard>
        </div>

        {/* Quick Actions */}
        <ComponentCard title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center" 
              onClick={() => window.location.href = '/user-management'}
            >
              <div className="text-2xl mb-2">👥</div>
              <span className="font-medium">User Management</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage users and creators
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center" 
              onClick={() => window.location.href = '/deliverables'}
            >
              <div className="text-2xl mb-2">📤</div>
              <span className="font-medium">Deliverables</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage all content
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center" 
              onClick={() => window.location.href = '/payment-management'}
            >
              <div className="text-2xl mb-2">💰</div>
              <span className="font-medium">Payments</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage payment requests
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center" 
              onClick={() => window.location.href = '/creators'}
            >
              <div className="text-2xl mb-2">📈</div>
              <span className="font-medium">Creator Analytics</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View creator reports
              </span>
            </Button>
          </div>
        </ComponentCard>

        {/* Recent Scan History */}
        <ScanHistoryTable limit={10} />

        {/* System Information */}
        <ComponentCard title="System Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Supported Platforms</h4>
              <div className="space-y-2">
                {supportedPlatforms.map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <span className="text-lg">{getPlatformIcon(platform)}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {platform} - Full scraping support
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Tools</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🔍</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Social media content scraping
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📊</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Analytics and performance tracking
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📈</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Engagement rate calculations
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏷️</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Hashtag and mention analysis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Social Media Scraping Modal */}
      <Modal isOpen={showScrapingModal} onClose={() => setShowScrapingModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Social Media Content Scraping
            </h3>
            <button
              onClick={() => setShowScrapingModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSocialMediaScraping} className="space-y-4">

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Admin Report</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This report will be stored as an admin-generated report. You can optionally link it to a creator or leave it unassigned for general research purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Link to Creator (Optional)</Label>
                <Select
                  defaultValue={scrapingForm.creatorId}
                  onChange={(value) => setScrapingForm(prev => ({ ...prev, creatorId: value }))}
                  options={[
                    { value: '', label: 'No Creator (Admin Research)' },
                    ...users
                      .filter(u => u.role === 'creator')
                      .map(u => ({ value: u.userId, label: `${u.name} (${u.email})` }))
                  ]}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Leave unassigned for general research or link to a specific creator.
                </p>
              </div>

                          <div>
              <Label>Platform *</Label>
              <Select
                defaultValue={scrapingForm.platform}
                onChange={(value) => setScrapingForm(prev => ({ ...prev, platform: value as 'instagram' | 'tiktok' }))}
                options={[
                  { value: 'instagram', label: 'Instagram (Profile Scraping)' },
      
                  { value: 'tiktok', label: 'TikTok (Individual Videos Only)' }
                ]}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Instagram supports profile scraping. Use Individual Video Analysis for TikTok.
              </p>
            </div>
            </div>

            <div>
              <Label>Profile URL *</Label>
              <Input
                type="url"
                value={scrapingForm.profileUrl}
                onChange={(e) => setScrapingForm(prev => ({ ...prev, profileUrl: e.target.value }))}
                placeholder="https://www.instagram.com/username"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Results Limit</Label>
                <Select
                  defaultValue={scrapingForm.resultsLimit.toString()}
                  onChange={(value) => setScrapingForm(prev => ({ ...prev, resultsLimit: parseInt(value) }))}
                  options={[
                    { value: '10', label: '10 results' },
                    { value: '25', label: '25 results' },
                    { value: '50', label: '50 results' },
                    { value: '100', label: '100 results' }
                  ]}
                />
              </div>

              <div>
                <Label>Search Type</Label>
                <Select
                  defaultValue={scrapingForm.searchType}
                  onChange={(value) => setScrapingForm(prev => ({ ...prev, searchType: value as 'hashtag' | 'keyword' | 'all' }))}
                  options={[
                    { value: 'all', label: 'All Content' },
                    { value: 'hashtag', label: 'Hashtag Search' },
                    { value: 'keyword', label: 'Keyword Search' }
                  ]}
                />
              </div>

              <div>
                <Label>Results Type</Label>
                <Select
                  defaultValue={scrapingForm.resultsType}
                  onChange={(value) => setScrapingForm(prev => ({ ...prev, resultsType: value as 'posts' | 'stories' | 'reels' | 'all' }))}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'posts', label: 'Posts Only' },
                    { value: 'stories', label: 'Stories Only' },
                    { value: 'reels', label: 'Reels Only' }
                  ]}
                />
              </div>
            </div>

            {(scrapingForm.searchType === 'hashtag' || scrapingForm.searchType === 'keyword') && (
              <div>
                <Label>Search Query *</Label>
                <Input
                  type="text"
                  value={scrapingForm.searchQuery}
                  onChange={(e) => setScrapingForm(prev => ({ ...prev, searchQuery: e.target.value }))}
                  placeholder={scrapingForm.searchType === 'hashtag' ? '#hashtag' : 'keyword'}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowScrapingModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Scraping...' : 'Start Scraping'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Results Modal */}
      <Modal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Scraping Results
            </h3>
            <button
              onClick={() => setShowResultsModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {scrapingResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scrapingResult.totalResults}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Results</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(scrapingResult.report.analytics.totalLikes)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(scrapingResult.report.analytics.totalComments)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Comments</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {scrapingResult.report.analytics.engagementRate.toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</p>
                </div>
              </div>

              {/* Analytics Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Content Types</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Images</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.contentTypes.images}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Videos</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.contentTypes.videos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Reels</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.contentTypes.reels}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Posting Frequency</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Daily</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.postingFrequency.daily}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Weekly</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.postingFrequency.weekly}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {scrapingResult.report.analytics.postingFrequency.monthly}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Hashtags */}
              {scrapingResult.report.analytics.topHashtags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {scrapingResult.report.analytics.topHashtags.slice(0, 10).map((hashtag, index) => (
                      <Badge key={index} color="primary" size="sm">
                        #{hashtag.tag} ({hashtag.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Performing Posts */}
              {scrapingResult.report.analytics.bestPerformingPosts.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Best Performing Posts</h4>
                  <div className="space-y-2">
                    {scrapingResult.report.analytics.bestPerformingPosts.slice(0, 5).map((post, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-brand-500 hover:text-brand-600 hover:underline flex-1"
                          >
                            {post.caption ? post.caption.substring(0, 100) + '...' : 'No caption'}
                          </a>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(post.timestamp)}
                          </span>
                        </div>
                        <div className="flex space-x-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>❤️ {formatNumber(post.likes)}</span>
                          <span>💬 {formatNumber(post.comments)}</span>
                          {post.views && <span>👁️ {formatNumber(post.views)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowResultsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Save report to database
                    alert('Report saved successfully!');
                  }}
                >
                  Save Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Individual Video Analysis Modal */}
      <Modal isOpen={showIndividualVideoModal} onClose={() => setShowIndividualVideoModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Individual Video Analysis
            </h3>
            <button
              onClick={() => setShowIndividualVideoModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleIndividualVideoScraping} className="space-y-4">

            <div>
              <Label>Platform *</Label>
              <Select
                defaultValue={individualVideoForm.platform}
                onChange={(value) => setIndividualVideoForm(prev => ({ ...prev, platform: value as 'instagram' | 'tiktok' }))}
                options={[
                  { value: 'tiktok', label: 'TikTok (Full Support)' },
                  { value: 'instagram', label: 'Instagram (Reels Only)' },

                ]}
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                TikTok supports all content types. Instagram supports Reels only.
              </p>
            </div>

            <div>
              <Label>Video URL *</Label>
              <Input
                type="url"
                value={individualVideoForm.videoUrl}
                onChange={(e) => setIndividualVideoForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder={individualVideoForm.platform === 'tiktok' ? 'https://www.tiktok.com/@username/video/1234567890' : 'https://www.instagram.com/reel/ABC123/'}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowIndividualVideoModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Analyzing...' : 'Analyze Video'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Unified Scan Modal */}
      <UnifiedScanModal
        isOpen={showUnifiedScanModal}
        onClose={() => setShowUnifiedScanModal(false)}
        availableScanTypes={['daily', 'hashtag', 'profile', 'manual']}
        defaultScanType="manual"
        pageContext="calendar"
        onScanComplete={() => {
          showToast.success('Scan completed successfully!');
          // Refresh any data if needed
        }}
      />

      {/* Individual Video Results Modal */}
      <Modal isOpen={showIndividualVideoModal && individualVideoResult} onClose={() => setShowIndividualVideoModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Video Analysis Results
            </h3>
            <button
              onClick={() => setShowIndividualVideoModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {individualVideoResult && (
            <div className="space-y-6">
              {/* Video Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Platform</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl">{getPlatformIcon(individualVideoResult.platform)}</span>
                    <Badge color="primary">
                      {individualVideoResult.platform.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Analyzed At</Label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {formatDate(individualVideoResult.scrapedAt)}
                  </p>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <Label>Video URL</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <a 
                    href={individualVideoResult.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600 hover:underline flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg break-all"
                  >
                    {individualVideoResult.videoUrl}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(individualVideoResult.videoUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <Label>Performance Statistics</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(individualVideoResult.stats.views || 0)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(individualVideoResult.stats.likes || 0)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(individualVideoResult.stats.comments || 0)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(individualVideoResult.stats.shares || 0)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Shares</p>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              {individualVideoResult.stats.playCount && (
                <div>
                  <Label>Additional Metrics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
                    {individualVideoResult.stats.playCount && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(individualVideoResult.stats.playCount)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Play Count</p>
                      </div>
                    )}
                    {individualVideoResult.stats.diggCount && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(individualVideoResult.stats.diggCount)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Digg Count</p>
                      </div>
                    )}
                    {individualVideoResult.stats.commentCount && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(individualVideoResult.stats.commentCount)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Comment Count</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowIndividualVideoModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Save analysis to database
                    alert('Analysis saved successfully!');
                  }}
                >
                  Save Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>





    </>
  );
} 