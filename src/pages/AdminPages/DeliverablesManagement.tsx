import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, Deliverable, User } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { showToast } from "../../utils/toast";

interface CreateDeliverableForm {
  creatorId: string;
  platform: 'tiktok' | 'instagram';
  link: string;
  title?: string;
  description?: string;
}

export default function DeliverablesManagement() {
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [createForm, setCreateForm] = useState<CreateDeliverableForm>({
    creatorId: '',
    platform: 'tiktok',
    link: '',
    title: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [refreshingStats, setRefreshingStats] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deliverablesData, usersData] = await Promise.all([
        apiService.getAllDeliverables(),
        apiService.getAllUsers()
      ]);
      setDeliverables(deliverablesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const newDeliverable = await apiService.createDeliverableForUser(
        createForm.creatorId,
        createForm.platform,
        createForm.link,
        createForm.title || undefined,
        createForm.description || undefined
      );
      
      setDeliverables([newDeliverable, ...deliverables]);
      setSuccess('Deliverable created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        creatorId: '',
        platform: 'tiktok',
        link: '',
        title: '',
        description: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setShowDetailModal(true);
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
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📷';

      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'primary';
      case 'instagram': return 'success';

      default: return 'primary';
    }
  };

  const handleRefreshStats = async () => {
    if (!selectedDeliverable) return;

    // Check if platform is supported
    const supportedPlatforms = ['tiktok', 'instagram'];
    if (!supportedPlatforms.includes(selectedDeliverable.platform)) {
      showToast.error(`Statistics refresh not supported for ${selectedDeliverable.platform} content`);
      return;
    }

    try {
      setRefreshingStats(true);
      await apiService.refreshDeliverableStats(selectedDeliverable.deliverableId);
      
      showToast.success('Stats refresh started! You can monitor progress in the sidebar.');
      
      // Optionally close the modal or keep it open to show the process
      // setShowDetailModal(false);
      
    } catch (error) {
      console.error('Error refreshing stats:', error);
      showToast.error('Failed to start stats refresh. Please try again.');
    } finally {
      setRefreshingStats(false);
    }
  };

  // Filter deliverables
  const filteredDeliverables = deliverables.filter(deliverable => {
    if (platformFilter !== 'all' && deliverable.platform !== platformFilter) return false;
    if (creatorFilter && !deliverable.creatorName.toLowerCase().includes(creatorFilter.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 lg:ml-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading deliverables...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Deliverables Management | Frontline"
        description="Manage all deliverables across the platform"
      />
      <PageBreadcrumb pageTitle="Deliverables Management" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Header */}
        <ComponentCard title="Deliverables Management">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Deliverables Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage all deliverables across the platform.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Deliverable
            </Button>
          </div>
        </ComponentCard>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentCard title="Total Deliverables">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {deliverables.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All content
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="TikTok">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {deliverables.filter(d => d.platform === 'tiktok').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                TikTok videos
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Instagram">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {deliverables.filter(d => d.platform === 'instagram').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Instagram posts
              </p>
            </div>
          </ComponentCard>


        </div>

        {/* Filters */}
        <ComponentCard title="Filters">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Platform</Label>
              <Select
                defaultValue={platformFilter}
                onChange={(value) => setPlatformFilter(value)}
                options={[
                  { value: 'all', label: 'All Platforms' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'instagram', label: 'Instagram' },
      
                ]}
              />
            </div>
            
            <div>
              <Label>Creator Name</Label>
              <Input
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Filter by creator name"
              />
            </div>
          </div>
        </ComponentCard>

        {/* Deliverables Table */}
        <ComponentCard title="All Deliverables">
          {filteredDeliverables.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📤</div>
              <p className="text-gray-600 dark:text-gray-400">
                No deliverables found. Create your first deliverable to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Content</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Creator</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Platform</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Performance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDeliverables.map((deliverable) => (
                    <tr key={deliverable.deliverableId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {deliverable.title || `${deliverable.platform.charAt(0).toUpperCase() + deliverable.platform.slice(1)} Content`}
                          </p>
                          {deliverable.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {deliverable.description}
                            </p>
                          )}
                          <a 
                            href={deliverable.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:text-brand-600 hover:underline truncate block mt-1"
                          >
                            {deliverable.link}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {deliverable.creatorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {deliverable.creatorId.slice(-8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getPlatformIcon(deliverable.platform)}</span>
                          <Badge color={getPlatformColor(deliverable.platform)} size="sm">
                            {deliverable.platform.toUpperCase()}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {deliverable.stats ? (
                          <div className="text-xs space-y-1">
                            <div>👁️ {formatNumber(deliverable.stats.views || 0)}</div>
                            <div>❤️ {formatNumber(deliverable.stats.likes || 0)}</div>
                            <div>💬 {formatNumber(deliverable.stats.comments || 0)}</div>
                            {deliverable.stats.shares && (
                              <div>📤 {formatNumber(deliverable.stats.shares)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No stats</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(deliverable.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(deliverable)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/creator/${deliverable.creatorId}`}
                          >
                            View Creator
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

      {/* Create Deliverable Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Deliverable
            </h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateDeliverable} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-100 border border-green-200 rounded-md">
                {success}
              </div>
            )}

            <div>
              <Label>Creator *</Label>
              <Select
                defaultValue={createForm.creatorId}
                onChange={(value) => setCreateForm(prev => ({ ...prev, creatorId: value }))}
                options={users
                  .filter(u => u.role === 'creator')
                  .map(u => ({ value: u.userId, label: `${u.name} (${u.email})` }))
                }
              />
            </div>

            <div>
              <Label>Platform *</Label>
              <Select
                defaultValue={createForm.platform}
                onChange={(value) => setCreateForm(prev => ({ ...prev, platform: value as 'tiktok' | 'instagram' }))}
                options={[
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'instagram', label: 'Instagram' },
      
                ]}
              />
            </div>

            <div>
              <Label>Content Link *</Label>
              <Input
                type="url"
                value={createForm.link}
                onChange={(e) => setCreateForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://www.tiktok.com/@username/video/..."
              />
            </div>

            <div>
              <Label>Content Title/Caption</Label>
              <Input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the title or caption of the content..."
              />
            </div>

            <div>
              <Label>Additional Description</Label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add any additional context or description..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Deliverable'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Deliverable Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Deliverable Details
            </h3>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {selectedDeliverable && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Content Title</Label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedDeliverable.title || `${selectedDeliverable.platform.charAt(0).toUpperCase() + selectedDeliverable.platform.slice(1)} Content`}
                  </p>
                </div>
                <div>
                  <Label>Platform</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getPlatformIcon(selectedDeliverable.platform)}</span>
                    <Badge color={getPlatformColor(selectedDeliverable.platform)}>
                      {selectedDeliverable.platform.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Creator</Label>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDeliverable.creatorName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {selectedDeliverable.creatorId}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(selectedDeliverable.submittedAt)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedDeliverable.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {selectedDeliverable.description}
                  </p>
                </div>
              )}

              {/* Link */}
              <div>
                <Label>Content Link</Label>
                <div className="flex items-center space-x-2">
                  <a 
                    href={selectedDeliverable.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600 hover:underline flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg break-all"
                  >
                    {selectedDeliverable.link}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(selectedDeliverable.link)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Performance Stats */}
              {selectedDeliverable.stats && (
                <div>
                  <Label>Performance Statistics</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(selectedDeliverable.stats.views || 0)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(selectedDeliverable.stats.likes || 0)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(selectedDeliverable.stats.comments || 0)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                    </div>
                    {selectedDeliverable.stats.shares && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(selectedDeliverable.stats.shares)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Shares</p>
                      </div>
                    )}
                  </div>
                  {selectedDeliverable.lastStatsUpdate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last updated: {formatDate(selectedDeliverable.lastStatsUpdate)}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/creator/${selectedDeliverable.creatorId}`}
                >
                  View Creator Profile
                </Button>
                <Button
                  onClick={handleRefreshStats}
                  disabled={refreshingStats}
                >
                  {refreshingStats ? 'Refreshing...' : 'Refresh Stats'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
} 