import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { apiService, User } from "../../services/api";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { showToast } from "../../utils/toast";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";

interface KOLCampaignForm {
  kolId: string;
  totalVideos: number;
  paymentAmount: number;
  scheduledDates: string[];
  platform: 'instagram' | 'tiktok' | '';
  profileUrl: string;
  notes: string;
}

export default function NewKOLCampaign() {
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<{ campaign: any; scheduledPosts: any[] } | null>(null);
  const [form, setForm] = useState<KOLCampaignForm>({
    kolId: '',
    totalVideos: 1,
    paymentAmount: 0,
    scheduledDates: [''],
    platform: '',
    profileUrl: '',
    notes: '',
  });

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    // Update scheduled dates array when total videos changes
    const newDates = Array(form.totalVideos).fill('').map((_, index) => 
      form.scheduledDates[index] || ''
    );
    setForm(prev => ({ ...prev, scheduledDates: newDates }));
  }, [form.totalVideos]);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllUsers();
      const creatorUsers = response.filter((user: User) => user.role === 'creator');
      setCreators(creatorUsers);
    } catch (error) {
      console.error('Failed to load creators:', error);
      showToast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorChange = (kolId: string) => {
    const selectedCreator = creators.find(creator => creator.userId === kolId);
    if (selectedCreator) {
      // Auto-populate platform and profile URL from creator's social links
      let platform: 'instagram' | 'tiktok' | '' = '';
      let profileUrl = '';

      if (selectedCreator.socialLinks?.instagram) {
        platform = 'instagram';
        profileUrl = selectedCreator.socialLinks.instagram;
      } else if (selectedCreator.socialLinks?.tiktok) {
        platform = 'tiktok';
        profileUrl = selectedCreator.socialLinks.tiktok;
      }

      setForm(prev => ({
        ...prev,
        kolId,
        platform,
        profileUrl,
      }));
    }
  };

  const handleDateChange = (index: number, date: string) => {
    const newDates = [...form.scheduledDates];
    newDates[index] = date;
    setForm(prev => ({ ...prev, scheduledDates: newDates }));
  };

  const generateDatesFromFirst = () => {
    if (form.scheduledDates[0]) {
      const firstDate = new Date(form.scheduledDates[0]);
      const newDates = [form.scheduledDates[0]];
      
      for (let i = 1; i < form.totalVideos; i++) {
        const nextDate = new Date(firstDate);
        nextDate.setDate(firstDate.getDate() + (i * 7)); // Weekly intervals
        newDates.push(nextDate.toISOString().split('T')[0]);
      }
      
      setForm(prev => ({ ...prev, scheduledDates: newDates }));
      showToast.success('Dates generated with weekly intervals');
    } else {
      showToast.error('Please set the first date first');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.kolId) {
      showToast.error('Please select a KOL');
      return;
    }
    
    if (form.totalVideos < 1 || form.totalVideos > 50) {
      showToast.error('Total videos must be between 1 and 50');
      return;
    }
    
    if (form.paymentAmount <= 0) {
      showToast.error('Payment amount must be greater than 0');
      return;
    }
    
    if (!form.platform) {
      showToast.error('Please select a platform');
      return;
    }
    
    if (!form.profileUrl) {
      showToast.error('Profile URL is required');
      return;
    }
    
    // Check that all dates are filled
    const emptyDates = form.scheduledDates.filter(date => !date);
    if (emptyDates.length > 0) {
      showToast.error('Please fill in all scheduled dates');
      return;
    }
    
    // Check for duplicate dates
    const uniqueDates = new Set(form.scheduledDates);
    if (uniqueDates.size !== form.scheduledDates.length) {
      showToast.error('Scheduled dates must be unique');
      return;
    }
    
    // Check that dates are in the future
    const today = new Date().toISOString().split('T')[0];
    const pastDates = form.scheduledDates.filter(date => date < today);
    if (pastDates.length > 0) {
      showToast.error('All scheduled dates must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiService.createKOLCampaign({
        kolId: form.kolId,
        totalVideos: form.totalVideos,
        paymentAmount: form.paymentAmount,
        scheduledDates: form.scheduledDates,
        platform: form.platform,
        profileUrl: form.profileUrl,
      });

      showToast.success('KOL campaign created successfully!');
      
      // Store the created campaign data to show hashtags
      setCreatedCampaign(result);

      // Reset form after showing results
      setTimeout(() => {
        setForm({
          kolId: '',
          totalVideos: 1,
          paymentAmount: 0,
          scheduledDates: [''],
          platform: '',
          profileUrl: '',
          notes: '',
        });
        setCreatedCampaign(null);
        
        // Redirect to calendar
        window.location.href = '/kol-calendar';
      }, 10000); // Give user time to see and copy hashtags
      
    } catch (error: any) {
      console.error('Failed to create KOL campaign:', error);
      showToast.error(error.message || 'Failed to create KOL campaign');
    } finally {
      setSubmitting(false);
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

  const calculatePaymentPerPost = () => {
    return form.totalVideos > 0 ? form.paymentAmount / form.totalVideos : 0;
  };

  if (loading) {
    return (
      <>
        <PageMeta title="New KOL Campaign | Frontline" description="Create a new KOL campaign" />
        <PageBreadcrumb pageTitle="New KOL Campaign" />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading creators...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="New KOL Campaign | Frontline" description="Create a new KOL campaign" />
      <PageBreadcrumb pageTitle="New KOL Campaign" />
      
      <div className="space-y-6 md:ml-64">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New KOL Campaign</h1>
            <p className="text-gray-600 dark:text-gray-400">Set up a new KOL posting schedule and payment</p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/kol-calendar'}
          >
            Back to Calendar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <ComponentCard title="Campaign Details">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KOL Selection */}
                <div>
                  <Label>Select KOL *</Label>
                  <Select
                    defaultValue={form.kolId}
                    onChange={(value) => handleCreatorChange(value)}
                    options={[
                      { value: '', label: 'Select a KOL...' },
                      ...creators.map(creator => ({
                        value: creator.userId,
                        label: `${creator.name} (${creator.email})`,
                      })),
                    ]}
                  />
                  {form.kolId && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Selected KOL will be automatically tracked for post compliance
                    </p>
                  )}
                </div>

                {/* Total Videos */}
                <div>
                  <Label>Total Videos *</Label>
                  <Input
                    type="number"
                    value={form.totalVideos}
                    onChange={(e) => setForm(prev => ({ ...prev, totalVideos: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="50"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Number of videos/posts in this campaign (1-50)
                  </p>
                </div>

                {/* Payment Amount */}
                <div>
                  <Label>Total Payment Amount *</Label>
                  <Input
                    type="number"
                    value={form.paymentAmount.toString()}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step={0.01}
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Total payment for entire campaign: {formatCurrency(form.paymentAmount)}
                    {form.totalVideos > 0 && (
                      <span> ({formatCurrency(calculatePaymentPerPost())} per post)</span>
                    )}
                  </p>
                </div>

                {/* Platform */}
                <div>
                  <Label>Platform *</Label>
                  <Select
                    defaultValue={form.platform}
                    onChange={(value) => setForm(prev => ({ ...prev, platform: value as 'instagram' | 'tiktok' }))}
                    options={[
                      { value: '', label: 'Select platform...' },
                      { value: 'instagram', label: 'Instagram' },
                      { value: 'tiktok', label: 'TikTok' },
                    ]}
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Platform where posts will be published and tracked
                  </p>
                </div>
              </div>

              {/* Profile URL */}
              <div>
                <Label>Profile URL *</Label>
                <Input
                  type="url"
                  value={form.profileUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, profileUrl: e.target.value }))}
                  placeholder="https://instagram.com/username or https://tiktok.com/@username"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  KOL's profile URL for automated post scanning
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label>Campaign Notes (Optional)</Label>
                <TextArea
                  value={form.notes}
                  onChange={(value) => setForm(prev => ({ ...prev, notes: value }))}
                  placeholder="Additional notes about this campaign..."
                  rows={3}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Scheduled Dates */}
          <ComponentCard title="Scheduled Post Dates">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Post Schedule ({form.totalVideos} {form.totalVideos === 1 ? 'post' : 'posts'})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set the dates when each post should be published
                  </p>
                </div>
                
                {form.totalVideos > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateDatesFromFirst}
                    disabled={!form.scheduledDates[0]}
                  >
                    Generate Weekly Dates
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {form.scheduledDates.map((date, index) => (
                  <div key={index}>
                    <Label>Post {index + 1} Date *</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(index, (e.target as HTMLInputElement).value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                ))}
              </div>

              {form.scheduledDates.length > 1 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📅 Schedule Preview
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {form.scheduledDates
                      .filter(date => date)
                      .sort()
                      .map((date, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>Post {index + 1}:</span>
                          <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Campaign Summary */}
          {form.kolId && form.totalVideos > 0 && form.paymentAmount > 0 && (
            <ComponentCard title="Campaign Summary">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {creators.find(c => c.userId === form.kolId)?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">KOL</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {form.totalVideos}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {form.totalVideos === 1 ? 'Post' : 'Posts'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(form.paymentAmount)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Payment
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/kol-calendar'}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
          </div>
        </form>

        {/* Success Message with Hashtags */}
        {createdCampaign && (
          <ComponentCard title="🎉 Campaign Created Successfully!">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                  Campaign for {createdCampaign.campaign.kolName} is ready!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please share these tracking hashtags with the KOL. They should include the relevant hashtag in each post:
                </p>
              </div>

              <div className="space-y-3">
                {createdCampaign.scheduledPosts.map((post: any, index: number) => (
                  <div key={post.postId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          Post #{index + 1} - {new Date(post.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Platform: {post.platform}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 px-3 py-2 rounded font-mono text-sm text-purple-600 dark:text-purple-400">
                          {post.trackingHashtag}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(post.trackingHashtag);
                            showToast.success('Hashtag copied to clipboard!');
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                          title="Copy hashtag"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📝 Instructions for KOL:</h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>1. Include the specific hashtag in each post's caption or comments</p>
                  <p>2. Post on or after the scheduled date</p>
                  <p>3. Our system will automatically detect and verify the posts</p>
                  <p>4. No need to notify us - the calendar will update automatically!</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This page will redirect to the calendar in a few seconds...
                </p>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
}