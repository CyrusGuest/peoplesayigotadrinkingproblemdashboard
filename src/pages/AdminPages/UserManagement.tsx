import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, User, Deliverable, PaymentRequest } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { showToast } from "../../utils/toast";

interface CreateUserForm {
  email: string;
  name: string;
  role: 'creator' | 'admin';
  socialLinks?: {
    tiktok?: string;
  
    instagram?: string;
    telegram?: string;
  };
}

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    name: '',
    role: 'creator',
    socialLinks: {}
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const calculatePerformanceScore = (deliverables: Deliverable[], payments: PaymentRequest[]) => {
    const totalEngagement = deliverables.reduce((sum, d) => sum + (d.stats?.likes || 0) + (d.stats?.comments || 0), 0);
    const avgEngagement = deliverables.length > 0 ? totalEngagement / deliverables.length : 0;
    const earnings = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountRequested, 0);
    
    // Score calculation: engagement weight (40%) + content volume (20%) + earnings (40%)
    const engagementScore = Math.min(40, (avgEngagement / 1000) * 40);
    const volumeScore = Math.min(20, deliverables.length * 2);
    const earningsScore = Math.min(40, (earnings / 100) * 0.4);
    
    return Math.round(engagementScore + volumeScore + earningsScore);
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getStatusFromScore = (score: number, lastActivity: Date): 'active' | 'inactive' | 'high_performer' | 'needs_attention' => {
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity > 30) return 'inactive';
    if (score >= 80) return 'high_performer';
    if (score < 40) return 'needs_attention';
    return 'active';
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [allUsers, deliverables, payments] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllDeliverables(),
        apiService.getPaymentRequests(),
      ]);
      
      setUsers(allUsers);

      // Calculate performance for creators (for future use)
      const creators = allUsers.filter(u => u.role === 'creator');
      creators.map(creator => {
        const creatorDeliverables = deliverables.filter(d => d.creatorId === creator.userId);
        const creatorPayments = payments.filter(p => p.creatorId === creator.userId);
        
        const lastDeliverable = creatorDeliverables.length > 0 
          ? new Date(Math.max(...creatorDeliverables.map(d => new Date(d.submittedAt).getTime())))
          : new Date(creator.createdAt);
        
        const score = calculatePerformanceScore(creatorDeliverables, creatorPayments);
        const earnings = creatorPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountRequested, 0);
        const totalEngagement = creatorDeliverables.reduce((sum, d) => sum + (d.stats?.likes || 0) + (d.stats?.comments || 0), 0);
        const avgEngagement = creatorDeliverables.length > 0 ? Math.round(totalEngagement / creatorDeliverables.length) : 0;

        return {
          userId: creator.userId,
          name: creator.name,
          score,
          grade: getGradeFromScore(score),
          status: getStatusFromScore(score, lastDeliverable),
          earnings,
          deliverables: creatorDeliverables.length,
          avgEngagement,
          lastActivity: lastDeliverable.toISOString(),
        };
      });

      // Performance calculations are available but not currently displayed
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiService.createUser(createForm);
      showToast.success('User created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        name: '',
        role: 'creator',
        socialLinks: {}
      });
      loadUsers(); // Refresh the list
    } catch (err: any) {
      showToast.error(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'creator': return 'success';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 lg:ml-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="User Management | Frontline"
        description="Manage users and creators"
      />
      <PageBreadcrumb pageTitle="User Management" />
      
      <div className="space-y-6 lg:ml-64">
        {/* Header */}
        <ComponentCard title="User Management">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage users and creators in the system.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              Create New User
            </Button>
          </div>
        </ComponentCard>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComponentCard title="Total Users">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {users.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All users
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Creators">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'creator').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Content creators
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Admins">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                System administrators
              </p>
            </div>
          </ComponentCard>
        </div>

        {/* Users Table */}
        <ComponentCard title="All Users">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-gray-600 dark:text-gray-400">
                No users found. Create your first user to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Social Links</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            ID: {user.userId.slice(-8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={getRoleColor(user.role)} size="sm">
                          {user.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          {user.socialLinks?.tiktok && (
                            <a 
                              href={user.socialLinks.tiktok} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600"
                            >
                              🎵
                            </a>
                          )}
                          {user.socialLinks?.instagram && (
                            <a 
                              href={user.socialLinks.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600"
                            >
                              📷
                            </a>
                          )}

                          {user.socialLinks?.telegram && (
                            <a 
                              href={user.socialLinks.telegram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600"
                            >
                              📱
                            </a>
                          )}
                          {!user.socialLinks?.tiktok && !user.socialLinks?.instagram && 
                           !user.socialLinks?.telegram && (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/user/${user.userId}`}
                          >
                            View
                          </Button>
                          {user.role === 'creator' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/my-deliverables?creator=${user.userId}`}
                            >
                              Deliverables
                            </Button>
                          )}
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

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New User
            </h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">

            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label>Full Name *</Label>
              <Input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Role *</Label>
              <Select
                defaultValue={createForm.role}
                onChange={(value) => setCreateForm(prev => ({ ...prev, role: value as 'creator' | 'admin' }))}
                options={[
                  { value: 'creator', label: 'Creator' },
                  { value: 'admin', label: 'Admin' }
                ]}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Social Media Links (Optional)</h4>
              <div className="space-y-3">
                <div>
                  <Label>TikTok</Label>
                  <Input
                    type="url"
                    value={createForm.socialLinks?.tiktok || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                    }))}
                    placeholder="https://www.tiktok.com/@username"
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    type="url"
                    value={createForm.socialLinks?.instagram || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                    placeholder="https://www.instagram.com/username"
                  />
                </div>

                <div>
                  <Label>Telegram</Label>
                  <Input
                    type="url"
                    value={createForm.socialLinks?.telegram || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, telegram: e.target.value }
                    }))}
                    placeholder="https://t.me/username"
                  />
                </div>
              </div>
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
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
} 