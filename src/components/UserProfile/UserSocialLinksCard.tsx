import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

export default function UserSocialLinksCard() {
  const { user } = useAuth();
  const [socialLinks, setSocialLinks] = useState({
    tiktok: '',
  
    instagram: '',
    telegram: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.socialLinks) {
      setSocialLinks({
        tiktok: user.socialLinks.tiktok || '',
    
        instagram: user.socialLinks.instagram || '',
        telegram: user.socialLinks.telegram || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Filter out empty strings
      const validLinks: any = {};
      Object.entries(socialLinks).forEach(([key, value]) => {
        if (value.trim()) {
          validLinks[key] = value.trim();
        }
      });

      await apiService.updateSocialLinks(validLinks);
      setMessage({ type: 'success', text: 'Social links updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update social links' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (platform: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  // Only show for creators
  if (user?.role !== 'creator') {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800">
        Social Media Links
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TikTok
          </label>
          <input
            type="url"
            placeholder="https://www.tiktok.com/@username"
            value={socialLinks.tiktok}
            onChange={(e) => handleInputChange('tiktok', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-brand-500 focus:outline-none"
          />
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <input
            type="url"
            placeholder="https://www.instagram.com/username"
            value={socialLinks.instagram}
            onChange={(e) => handleInputChange('instagram', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telegram
          </label>
          <input
            type="url"
            placeholder="https://t.me/username"
            value={socialLinks.telegram}
            onChange={(e) => handleInputChange('telegram', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-brand-500 px-4 py-2 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {saving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>
    </div>
  );
} 