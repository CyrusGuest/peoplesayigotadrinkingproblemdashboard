import { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { apiService, Deliverable, PaymentRequest } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { showToast } from "../../utils/toast";

interface DashboardMetrics {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
    pendingAmount: number;
  };
  creators: {
    total: number;
    active: number;
    trend: number;
    topPerformers: Array<{ name: string; score: number; earnings: number }>;
  };
  content: {
    totalDeliverables: number;
    thisMonthDeliverables: number;
    avgEngagement: number;
    topPlatforms: Array<{ platform: string; count: number; engagement: number }>;
  };
  alerts: {
    pendingPayments: number;
    overdueDeliverables: number;
    lowPerformingCreators: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDeliverables, setRecentDeliverables] = useState<Deliverable[]>([]);
  const [urgentPayments, setUrgentPayments] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [deliverables, paymentRequests, users] = await Promise.all([
        apiService.getAllDeliverables(),
        apiService.getPaymentRequests(),
        apiService.getAllUsers(),
      ]);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Calculate revenue metrics
      const thisMonthPayments = paymentRequests.filter(pr => {
        const paymentDate = new Date(pr.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      });
      
      const lastMonthPayments = paymentRequests.filter(pr => {
        const paymentDate = new Date(pr.createdAt);
        return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
      });

      const thisMonthRevenue = thisMonthPayments
        .filter(pr => pr.status === 'paid' || pr.status === 'approved')
        .reduce((sum, pr) => sum + pr.amountRequested, 0);
      
      const lastMonthRevenue = lastMonthPayments
        .filter(pr => pr.status === 'paid' || pr.status === 'approved')
        .reduce((sum, pr) => sum + pr.amountRequested, 0);

      const pendingAmount = paymentRequests
        .filter(pr => pr.status === 'pending')
        .reduce((sum, pr) => sum + pr.amountRequested, 0);

      const revenueTrend = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Calculate creator metrics
      const creators = users.filter(u => u.role === 'creator');
      const activeCreators = creators.filter(creator => {
        const recentDeliverables = deliverables.filter(d => {
          const deliverableDate = new Date(d.submittedAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return d.creatorId === creator.userId && deliverableDate >= thirtyDaysAgo;
        });
        return recentDeliverables.length > 0;
      });

      // Calculate top performers
      const topPerformers = creators.map(creator => {
        const creatorDeliverables = deliverables.filter(d => d.creatorId === creator.userId);
        const creatorPayments = paymentRequests.filter(pr => pr.creatorId === creator.userId && pr.status === 'paid');
        const earnings = creatorPayments.reduce((sum, pr) => sum + pr.amountRequested, 0);
        
        const totalEngagement = creatorDeliverables.reduce((sum, d) => {
          return sum + (d.stats?.likes || 0) + (d.stats?.comments || 0);
        }, 0);
        
        const avgEngagement = creatorDeliverables.length > 0 ? totalEngagement / creatorDeliverables.length : 0;
        const score = Math.min(100, Math.round((avgEngagement / 1000) * 40 + (creatorDeliverables.length * 2) + (earnings / 100)));
        
        return {
          name: creator.name,
          score,
          earnings
        };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      // Calculate content metrics
      const thisMonthDeliverables = deliverables.filter(d => {
        const deliverableDate = new Date(d.submittedAt);
        return deliverableDate.getMonth() === currentMonth && deliverableDate.getFullYear() === currentYear;
      });

      const platformStats = deliverables.reduce((acc, d) => {
        if (!acc[d.platform]) {
          acc[d.platform] = { count: 0, totalEngagement: 0 };
        }
        acc[d.platform].count++;
        acc[d.platform].totalEngagement += (d.stats?.likes || 0) + (d.stats?.comments || 0);
        return acc;
      }, {} as Record<string, { count: number; totalEngagement: number }>);

      const topPlatforms = Object.entries(platformStats)
        .map(([platform, stats]) => ({
          platform,
          count: stats.count,
          engagement: stats.count > 0 ? Math.round(stats.totalEngagement / stats.count) : 0
        }))
        .sort((a, b) => b.count - a.count);

      const totalEngagement = deliverables.reduce((sum, d) => sum + (d.stats?.likes || 0) + (d.stats?.comments || 0), 0);
      const avgEngagement = deliverables.length > 0 ? Math.round(totalEngagement / deliverables.length) : 0;

      // Calculate alerts
      const pendingPayments = paymentRequests.filter(pr => pr.status === 'pending').length;
      const overdueDeliverables = deliverables.filter(d => {
        const deliverableDate = new Date(d.submittedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return deliverableDate < sevenDaysAgo && !d.stats?.views; // Assuming no stats means not processed
      }).length;

      const lowPerformingCreators = topPerformers.filter(p => p.score < 30).length;

      const dashboardMetrics: DashboardMetrics = {
        revenue: {
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          trend: revenueTrend,
          pendingAmount
        },
        creators: {
          total: creators.length,
          active: activeCreators.length,
          trend: 0, // TODO: Calculate trend
          topPerformers
        },
        content: {
          totalDeliverables: deliverables.length,
          thisMonthDeliverables: thisMonthDeliverables.length,
          avgEngagement,
          topPlatforms
        },
        alerts: {
          pendingPayments,
          overdueDeliverables,
          lowPerformingCreators
        }
      };

      setMetrics(dashboardMetrics);
      setRecentDeliverables(deliverables.slice(0, 5));
      setUrgentPayments(paymentRequests.filter(pr => pr.status === 'pending').slice(0, 3));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return '📷';
      case 'tiktok': return '🎵';

      default: return '📱';
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Admin Dashboard | Frontline" description="Executive dashboard overview" />
        <PageBreadcrumb pageTitle="Dashboard" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Admin Dashboard | Frontline" description="Executive dashboard overview" />
      <PageBreadcrumb pageTitle="Dashboard" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}</h1>
          <p className="text-blue-100">Here's what's happening with your creator network today</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <ComponentCard title="Revenue">
            <div className="px-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <span className={`text-sm font-medium ${metrics?.revenue.trend !== undefined && metrics.revenue.trend >= 0 ? 'text-green-600 bg-green-100 rounded-lg px-2 py-1' : 'text-red-600 bg-red-100 rounded-lg px-2 py-1'}`}>
                  {getTrendIcon(metrics?.revenue.trend || 0)} {Math.abs(metrics?.revenue.trend || 0).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">This Month Revenue</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics?.revenue.thisMonth || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs {formatCurrency(metrics?.revenue.lastMonth || 0)} last month
              </p>
            </div>
          </ComponentCard>

          {/* Active Creators Card */}
          <ComponentCard title="Active Creators">
            <div className="px-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <Badge color="success">{metrics?.creators.active} Active</Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Creators</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.creators.total || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics?.creators.active} active this month
              </p>
            </div>
          </ComponentCard>

          {/* Pending Approvals Card */}
          <ComponentCard title="Pending Approvals">
            <div className="px-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                {(metrics?.alerts.pendingPayments || 0) > 0 && (
                  <Badge color="warning">Action Needed</Badge>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Pending Approvals</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.alerts.pendingPayments || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(metrics?.revenue.pendingAmount || 0)} total value
              </p>
            </div>
          </ComponentCard>

          {/* Content Performance Card */}
          <ComponentCard title="Content Performance">
            <div className="px-2">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <Badge color="info">Avg Engagement</Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Content This Month</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.content.thisMonthDeliverables || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatNumber(metrics?.content.avgEngagement || 0)} avg engagement
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Quick Actions Bar */}
        <ComponentCard title="Quick Actions">
          <div className="p-2">
            <div className="flex flex-wrap gap-3">
              <Button className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-white hover:text-blue-600 border border-transparent hover:border-blue-600 transition-all duration-200" onClick={() => window.location.href = '/payment-management'}>
                Review Payments ({metrics?.alerts.pendingPayments || 0})
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/user-management'}>
                Add New Creator
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin-reports'}>
                Generate Report
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/kol-calendar'}>
                📅 KOL Calendar
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/deliverables'}>
                Review Content
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <ComponentCard title="Top Performers This Month">
            <div className="p-6">
              {metrics?.creators.topPerformers.length ? (
                <div className="space-y-4">
                  {metrics.creators.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{performer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(performer.earnings)} earned
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(performer.score)}`}>
                          {getScoreGrade(performer.score)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {performer.score}/100
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No performance data available yet
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Platform Performance */}
          <ComponentCard title="Platform Performance">
            <div className="p-6">
              {metrics?.content.topPlatforms.length ? (
                <div className="space-y-4">
                  {metrics.content.topPlatforms.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {platform.platform}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {platform.count} deliverables
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(platform.engagement)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          avg engagement
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No content data available yet
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Recent Activity & Urgent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deliverables */}
          <ComponentCard title="Recent Content Submissions">
            <div className="p-6">
              {recentDeliverables.length ? (
                <div className="space-y-3">
                  {recentDeliverables.map((deliverable) => (
                    <div key={deliverable.deliverableId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getPlatformIcon(deliverable.platform)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {deliverable.title || `${deliverable.platform} Content`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            by {deliverable.creatorName} • {new Date(deliverable.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-gray-900 dark:text-white">
                          {formatNumber(deliverable.stats?.views || 0)} views
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {formatNumber((deliverable.stats?.likes || 0) + (deliverable.stats?.comments || 0))} engagement
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No recent submissions
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Urgent Payment Requests */}
          <ComponentCard title="Urgent Payment Requests">
            <div className="p-6">
              {urgentPayments.length ? (
                <div className="space-y-3">
                  {urgentPayments.map((payment) => (
                    <div key={payment.requestId} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {payment.creatorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Requested {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amountRequested)}
                        </div>
                        <Button size="sm" onClick={() => window.location.href = '/payment-management'}>
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-green-600 dark:text-green-400">
                  ✅ No pending payments
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Alerts Section */}
        {((metrics?.alerts.pendingPayments || 0) > 0 || (metrics?.alerts.overdueDeliverables || 0) > 0) && (
          <ComponentCard title="⚠️ Attention Required">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(metrics?.alerts.pendingPayments || 0) > 0 && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-orange-600 dark:text-orange-400">💰</span>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">Pending Payments</h4>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {metrics?.alerts.pendingPayments} payment requests need approval
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => window.location.href = '/payment-management'}>
                      Review Now
                    </Button>
                  </div>
                )}

                {(metrics?.alerts.overdueDeliverables || 0) > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-red-600 dark:text-red-400">📅</span>
                      <h4 className="font-medium text-red-900 dark:text-red-100">Overdue Content</h4>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {metrics?.alerts.overdueDeliverables} deliverables need attention
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => window.location.href = '/deliverables'}>
                      Review Now
                    </Button>
                  </div>
                )}

                {(metrics?.alerts.lowPerformingCreators || 0) > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-600 dark:text-yellow-400">📊</span>
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Low Performers</h4>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {metrics?.alerts.lowPerformingCreators} creators need support
                    </p>
                    <Button size="sm" className="mt-2" onClick={() => window.location.href = '/creators'}>
                      Review Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
} 