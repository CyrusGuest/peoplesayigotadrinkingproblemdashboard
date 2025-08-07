import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, ScheduledPost } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import { KOLMessageModal } from "../../components/KOLMessageModal";
import { UnifiedScanModal } from "../../components/UnifiedScanModal";
import { ScanHistoryTable } from "../../components/ScanHistoryTable";
import { showToast } from "../../utils/toast";

interface CalendarDay {
  date: string;
  posts: ScheduledPost[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  posts: ScheduledPost[];
  onPostStatusUpdate: (postId: string, status: ScheduledPost['status']) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, date, posts, onPostStatusUpdate }) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (postId: string, status: ScheduledPost['status']) => {
    setUpdating(postId);
    try {
      await apiService.updateScheduledPostStatus(postId, status);
      onPostStatusUpdate(postId, status);
      showToast.success('Post status updated successfully');
    } catch (error) {
      showToast.error('Failed to update post status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'posted': return 'bg-green-500';
      case 'late_1day': return 'bg-orange-500';
      case 'late_2plus': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'posted': return 'Posted';
      case 'late_1day': return '1 Day Late';
      case 'late_2plus': return '2+ Days Late';
      default: return 'Unknown';
    }
  };



  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Scheduled Posts for {new Date(date).toLocaleDateString()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No posts scheduled for this date
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.postId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {post.kolName}
                      </h4>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(post.status)}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getStatusText(post.status)}
                      </span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
                        {post.platform}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Campaign ID: {post.campaignId}</p>
                      <p>Profile: <a href={post.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{post.profileUrl}</a></p>
                      <div className="flex items-center space-x-2">
                        <span>Tracking Hashtag:</span>
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs text-purple-600 dark:text-purple-400">
                          {post.trackingHashtag}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(post.trackingHashtag)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copy hashtag"
                        >
                          📋
                        </button>
                      </div>
                      {post.actualPostUrl && (
                        <p>Actual Post: <a href={post.actualPostUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">View Post</a></p>
                      )}
                      {post.lastScannedAt && (
                        <p>Last Scanned: {new Date(post.lastScannedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {post.status !== 'posted' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(post.postId, 'posted')}
                        disabled={updating === post.postId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updating === post.postId ? 'Updating...' : 'Mark Posted'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default function KOLCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [postsNeedingAttention, setPostsNeedingAttention] = useState<ScheduledPost[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; kolId: string; kolName: string }>({
    isOpen: false,
    kolId: '',
    kolName: ''
  });

  useEffect(() => {
    loadCalendarData();
    loadPostsNeedingAttention();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Get the start and end dates for the current month view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Extend to show full weeks
      const startDate = new Date(startOfMonth);
      startDate.setDate(startDate.getDate() - startOfMonth.getDay());
      
      const endDate = new Date(endOfMonth);
      endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

      const [postsResponse, campaignsResponse] = await Promise.all([
        apiService.getScheduledPosts({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        apiService.getKOLCampaigns(),
      ]);

      setScheduledPosts(postsResponse.scheduledPosts);
      setActiveCampaigns(campaignsResponse.campaigns || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      showToast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const loadPostsNeedingAttention = async () => {
    try {
      const response = await apiService.getPostsNeedingAttention();
      setPostsNeedingAttention(response.posts);
    } catch (error) {
      console.error('Failed to load posts needing attention:', error);
    }
  };

  const handleScanComplete = async () => {
    // Check and create deliverables for any detected posts
    try {
      const result = await apiService.checkAndCreateDeliverablesForDetectedPosts();
      if (result.created > 0) {
        showToast.success(`Created ${result.created} deliverables from detected posts`);
      }
    } catch (error) {
      console.error('Failed to check for deliverables:', error);
    }
    
    // Refresh data after scan
    setTimeout(() => {
      loadCalendarData();
      loadPostsNeedingAttention();
    }, 2000);
  };

  const openMessageModal = (kolId: string, kolName: string) => {
    setMessageModal({
      isOpen: true,
      kolId,
      kolName
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      kolId: '',
      kolName: ''
    });
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    // End on the last day of the week containing the last day of the month
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayPosts = scheduledPosts.filter(post => post.scheduledDate === dateStr);
      
      days.push({
        date: dateStr,
        posts: dayPosts,
        isCurrentMonth: current.getMonth() === currentDate.getMonth(),
        isToday: current.getTime() === today.getTime(),
      });
      
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getPostStatusCounts = (posts: ScheduledPost[]) => {
    const counts = {
      scheduled: 0,
      posted: 0,
      late_1day: 0,
      late_2plus: 0,
      verified: 0,
    };

    posts.forEach(post => {
      counts[post.status]++;
    });

    return counts;
  };

  const handlePostStatusUpdate = (postId: string, status: ScheduledPost['status']) => {
    setScheduledPosts(prev => prev.map(post => 
      post.postId === postId ? { ...post, status } : post
    ));
    
    // Refresh posts needing attention
    loadPostsNeedingAttention();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const selectedDatePosts = selectedDate ? scheduledPosts.filter(post => post.scheduledDate === selectedDate) : [];

  if (loading) {
    return (
      <>
        <PageMeta title="KOL Calendar | Frontline" description="KOL posting calendar and tracking" />
        <PageBreadcrumb pageTitle="KOL Calendar" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="KOL Calendar | Frontline" description="KOL posting calendar and tracking" />
      <PageBreadcrumb pageTitle="KOL Calendar" />
      
      <div className="space-y-6 lg:ml-64 p-2">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KOL Posting Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">Track KOL post schedules and compliance</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setScanModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              🔍 Scan Content
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/kol-campaigns/new'}
              size="sm"
            >
              ➕ New Campaign
            </Button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{scheduledPosts.length}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Posted</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {scheduledPosts.filter(p => p.status === 'posted' || p.status === 'verified').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledPosts.filter(p => p.status === 'scheduled').length}
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Late</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {scheduledPosts.filter(p => p.status === 'late_1day' || p.status === 'late_2plus').length}
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Posts Needing Attention */}
        {postsNeedingAttention.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-pulse">🚨</div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-100">Posts Needing Immediate Attention</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{postsNeedingAttention.length} posts are late and require follow-up</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postsNeedingAttention.map((post) => {
                const daysLate = Math.floor((new Date().getTime() - new Date(post.scheduledDate).getTime()) / (1000 * 60 * 60 * 24));
                const isVeryLate = daysLate >= 2;
                
                return (
                  <div 
                    key={post.postId} 
                    className={`relative overflow-hidden rounded-lg p-4 shadow-md transition-all hover:shadow-lg ${
                      isVeryLate 
                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600' 
                        : 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600'
                    }`}
                  >
                    {/* Status indicator ribbon */}
                    <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${
                      isVeryLate ? 'bg-red-600' : 'bg-orange-500'
                    }`}>
                      {daysLate} {daysLate === 1 ? 'day' : 'days'} late
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{post.kolName}</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                          {post.platform}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {new Date(post.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tracking Hashtag:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(post.trackingHashtag);
                              showToast.success('Hashtag copied!');
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            title="Copy hashtag"
                          >
                            📋
                          </button>
                        </div>
                        <code className="block w-full bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs font-mono text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          {post.trackingHashtag}
                        </code>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openMessageModal(post.kolId, post.kolName)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                          💬 Message
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePostStatusUpdate(post.postId, 'posted')}
                          className="flex-1 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          ✅ Mark Posted
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar */}
        <ComponentCard title="">
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ← Previous
                </Button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  Next →
                </Button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400 shadow-md"></div>
                  <span className="text-gray-700 dark:text-gray-300">Scheduled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-md"></div>
                  <span className="text-gray-700 dark:text-gray-300">Posted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-md animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300">1 Day Late</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-md animate-pulse"></div>
                  <span className="text-gray-700 dark:text-gray-300">2+ Days Late</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day) => {
                const statusCounts = getPostStatusCounts(day.posts);
                const hasUnscannedPosts = day.posts.some(p => p.status === 'scheduled' && !p.lastScannedAt);
                
                return (
                  <div
                    key={day.date}
                    className={`
                      min-h-[100px] p-2 border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
                      ${day.isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                      ${hasUnscannedPosts ? 'border-yellow-400 dark:border-yellow-600 border-2' : 'border-gray-200 dark:border-gray-700'}
                    `}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {new Date(day.date).getDate()}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasUnscannedPosts && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400" title="Has unscanned posts">
                            ⚠️
                          </span>
                        )}
                        {day.posts.length > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {day.posts.length}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status indicators - More prominent circles */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {statusCounts.scheduled > 0 && (
                        Array.from({ length: Math.min(statusCounts.scheduled, 4) }).map((_, i) => (
                          <div key={`scheduled-${i}`} className="w-3 h-3 rounded-full bg-gray-400 shadow-sm" title="Scheduled"></div>
                        ))
                      )}
                      {statusCounts.posted > 0 && (
                        Array.from({ length: Math.min(statusCounts.posted, 4) }).map((_, i) => (
                          <div key={`posted-${i}`} className="w-3 h-3 rounded-full bg-green-500 shadow-sm" title="Posted"></div>
                        ))
                      )}
                      {statusCounts.late_1day > 0 && (
                        Array.from({ length: Math.min(statusCounts.late_1day, 4) }).map((_, i) => (
                          <div key={`late1-${i}`} className="w-3 h-3 rounded-full bg-orange-500 shadow-sm animate-pulse" title="1 Day Late"></div>
                        ))
                      )}
                      {statusCounts.late_2plus > 0 && (
                        Array.from({ length: Math.min(statusCounts.late_2plus, 4) }).map((_, i) => (
                          <div key={`late2-${i}`} className="w-3 h-3 rounded-full bg-red-500 shadow-sm animate-pulse" title="2+ Days Late"></div>
                        ))
                      )}
                      {day.posts.length > 4 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{day.posts.length - 4}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ComponentCard>

        {/* Scan History */}
        <ScanHistoryTable compact limit={5} />

        {/* Active Campaigns */}
        <ComponentCard title="📋 Active Campaigns">
          <div className="p-6">
            {activeCampaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No active campaigns found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.campaignId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {campaign.kolName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {campaign.totalVideos} videos • {campaign.platform}
                        </p>
                      </div>
                      <Badge color={campaign.status === 'active' ? 'success' : 'warning'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${campaign.paymentAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCampaign(campaign)}
                        className="flex-1"
                      >
                        📋 View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openMessageModal(campaign.kolId, campaign.kolName)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        💬
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate || ''}
        posts={selectedDatePosts}
        onPostStatusUpdate={handlePostStatusUpdate}
      />

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          isOpen={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          campaign={selectedCampaign}
        />
      )}

      {/* KOL Message Modal */}
      <KOLMessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessageModal}
        kolId={messageModal.kolId}
        kolName={messageModal.kolName}
      />

      {/* Unified Scan Modal */}
      <UnifiedScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        availableScanTypes={['daily', 'hashtag', 'profile']}
        defaultScanType="daily"
        pageContext="calendar"
        onScanComplete={handleScanComplete}
      />
    </>
  );
}

// Campaign Detail Modal Component
interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const [campaignPosts, setCampaignPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && campaign) {
      loadCampaignPosts();
    }
  }, [isOpen, campaign]);

  const loadCampaignPosts = async () => {
    setLoading(true);
    try {
      const posts = await apiService.getScheduledPostsByCampaign(campaign.campaignId);
      setCampaignPosts(posts);
    } catch (error) {
      console.error('Failed to load campaign posts:', error);
      showToast.error('Failed to load campaign posts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'posted': return 'bg-green-500';
      case 'late_1day': return 'bg-orange-500';
      case 'late_2plus': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'posted': return 'Posted';
      case 'late_1day': return '1 Day Late';
      case 'late_2plus': return '2+ Days Late';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Campaign Details: {campaign.kolName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {campaign.totalVideos} videos • ${campaign.paymentAmount.toLocaleString()} total
              </p>
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
          {/* Campaign Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {campaign.status}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Platform</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {campaign.platform}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Payment per Post</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ${(campaign.paymentAmount / campaign.totalVideos).toFixed(0)}
              </div>
            </div>
          </div>

          {/* Scheduled Posts */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Scheduled Posts ({campaignPosts.length})
            </h4>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading posts...
              </div>
            ) : campaignPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No posts found for this campaign
              </div>
            ) : (
              <div className="space-y-4">
                {campaignPosts.map((post, index) => (
                  <div key={post.postId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Post #{index + 1}
                          </h5>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(post.status)}`}></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getStatusText(post.status)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>Scheduled: {new Date(post.scheduledDate).toLocaleDateString()}</p>
                          <div className="flex items-center space-x-2">
                            <span>Hashtag:</span>
                            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs text-purple-600 dark:text-purple-400">
                              {post.trackingHashtag}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(post.trackingHashtag)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Copy hashtag"
                            >
                              📋
                            </button>
                          </div>
                          {post.actualPostUrl && (
                            <p>
                              <a href={post.actualPostUrl} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                                View Posted Content
                              </a>
                            </p>
                          )}
                          {post.lastScannedAt && (
                            <p>Last Scanned: {new Date(post.lastScannedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};