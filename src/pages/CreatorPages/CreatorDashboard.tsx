import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { apiService, Deliverable, PaymentRequest } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeliverables: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    recentDeliverables: [] as Deliverable[],
    recentPaymentRequests: [] as PaymentRequest[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [deliverables, paymentRequests] = await Promise.all([
        apiService.getDeliverables(),
        apiService.getPaymentRequests(),
      ]);

      // Calculate stats
      const totalViews = deliverables.reduce((sum, d) => sum + (d.stats?.views || 0), 0);
      const totalLikes = deliverables.reduce((sum, d) => sum + (d.stats?.likes || 0), 0);
      const totalComments = deliverables.reduce((sum, d) => sum + (d.stats?.comments || 0), 0);
      const pendingPayments = paymentRequests.filter(pr => pr.status === 'pending').length;

      // Get recent items (last 5)
      const recentDeliverables = deliverables
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5);

      const recentPaymentRequests = paymentRequests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalDeliverables: deliverables.length,
        totalEarnings: 0, // This would come from payment analytics
        pendingPayments,
        totalViews,
        totalLikes,
        totalComments,
        recentDeliverables,
        recentPaymentRequests,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'paid': return 'success';
      case 'denied': return 'error';
      case 'on_hold': return 'info';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 lg:ml-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Creator Dashboard | Frontline"
        description="Creator dashboard for Frontline"
      />
      <PageBreadcrumb pageTitle="Creator Dashboard" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Welcome Section */}
        <ComponentCard title="Welcome">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's your content performance and earnings overview.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => window.location.href = '/my-deliverables'}>
                📤 Submit Content
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/payment-requests'}>
                💰 Get Paid
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ComponentCard title="Content Created">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalDeliverables)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total pieces submitted
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Total Views">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalViews)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Across all platforms
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Total Engagement">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalLikes + stats.totalComments)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Likes & comments
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Pending Payments">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.pendingPayments}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Payment requests
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Quick Actions */}
        <ComponentCard title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => window.location.href = '/my-deliverables'}>
              <div className="text-2xl mb-2">📤</div>
              <span className="font-medium">Submit Content</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Upload new content
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => window.location.href = '/payment-requests'}>
              <div className="text-2xl mb-2">💰</div>
              <span className="font-medium">Get Paid</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Request payment now
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => window.location.href = '/earnings'}>
              <div className="text-2xl mb-2">📊</div>
              <span className="font-medium">My Earnings</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your money
              </span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center" onClick={() => window.location.href = '/profile'}>
              <div className="text-2xl mb-2">👤</div>
              <span className="font-medium">My Profile</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update your info
              </span>
            </Button>
          </div>
        </ComponentCard>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deliverables */}
          <ComponentCard title="Recent Deliverables">
            {stats.recentDeliverables.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📤</div>
                <p className="text-gray-600 dark:text-gray-400">
                  No deliverables yet. Start by submitting your first piece of content!
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/my-deliverables'}>
                  Submit First Deliverable
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDeliverables.map((deliverable) => (
                  <div key={deliverable.deliverableId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {deliverable.platform === 'tiktok' ? '🎵' : deliverable.platform === 'instagram' ? '📷' : '🐦'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {deliverable.title || `${deliverable.platform.charAt(0).toUpperCase() + deliverable.platform.slice(1)} Content`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(deliverable.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge color="info" size="sm">{deliverable.platform}</Badge>
                    </div>
                    
                    {/* Content Description */}
                    {deliverable.description && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {deliverable.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Link Preview */}
                    <div className="mb-2">
                      <a 
                        href={deliverable.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-brand-500 hover:text-brand-600 hover:underline truncate block"
                      >
                        {deliverable.link}
                      </a>
                    </div>
                    
                    {/* Performance Stats */}
                    {deliverable.stats && (
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex space-x-3">
                          <span>👁️ {formatNumber(deliverable.stats.views || 0)}</span>
                          <span>❤️ {formatNumber(deliverable.stats.likes || 0)}</span>
                          <span>💬 {formatNumber(deliverable.stats.comments || 0)}</span>
                          {deliverable.stats.shares && <span>📤 {formatNumber(deliverable.stats.shares)}</span>}
                        </div>
                        <span className="text-xs text-gray-500">
                          ID: {deliverable.deliverableId.slice(-8)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/my-deliverables'}>
                    View All Deliverables
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* Recent Payment Requests */}
          <ComponentCard title="Recent Payment Requests">
            {stats.recentPaymentRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-gray-600 dark:text-gray-400">
                  No payment requests yet. Submit deliverables to start earning!
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/payment-requests'}>
                  Request First Payment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPaymentRequests.map((request) => (
                  <div key={request.requestId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(request.amountRequested)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge color={getStatusColor(request.status)} size="sm">
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/payment-requests'}>
                    View All Requests
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* Performance Insights */}
        <ComponentCard title="Performance Insights">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.totalDeliverables > 0 ? Math.round(stats.totalViews / stats.totalDeliverables).toLocaleString() : 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Views per Content</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.totalViews > 0 ? ((stats.totalLikes + stats.totalComments) / stats.totalViews * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.totalDeliverables > 0 ? (stats.totalLikes / stats.totalDeliverables).toLocaleString() : 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Likes per Content</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
} 