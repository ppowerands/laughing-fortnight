'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Type, Image as ImageIcon, Upload } from 'lucide-react';
import { contentApi, settingsApi, uploadApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useQuery({ queryKey: ['site-content'], queryFn: () => contentApi.get().then(r => r.data) });
  const { data: settings } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  const [form, setForm] = useState({
    hero_badge: '', hero_heading_1: '', hero_heading_2: '', hero_heading_3: '',
    hero_description: '', footer_description: '', why_us_title: '', why_us_subtitle: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (content) setForm(content); }, [content]);
  useEffect(() => { if (settings?.logo) setLogoUrl(settings.logo); }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => contentApi.update(data),
    onSuccess: () => { toast.success('Website content updated!'); queryClient.invalidateQueries({ queryKey: ['site-content'] }); },
    onError: () => toast.error('Failed to save content'),
  });

  const logoMutation = useMutation({
    mutationFn: (url: string) => settingsApi.update({ logo: url }),
    onSuccess: () => { toast.success('Logo updated!'); queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] }); },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setLogoUrl(res.data.url);
      logoMutation.mutate(res.data.url);
    } catch { toast.error('Logo upload failed'); }
    finally { setUploading(false); }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-700" /> Restaurant Logo
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {logoUrl ? <img src={logoUrl.startsWith('http') ? logoUrl : `${API_URL}${logoUrl}`} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-2xl">🍽️</span>}
          </div>
          <div className="flex-1">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="input text-sm" />
            {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">This logo will appear in the navigation bar and footer</p>
      </div>

      {/* Hero Section */}
      <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-700" /> Homepage Hero Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Top Badge Text</label>
              <input value={form.hero_badge} onChange={set('hero_badge')} className="input" placeholder="Open Now • Fast Delivery" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heading Word 1</label>
                <input value={form.hero_heading_1} onChange={set('hero_heading_1')} className="input" placeholder="Authentic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heading Word 2</label>
                <input value={form.hero_heading_2} onChange={set('hero_heading_2')} className="input" placeholder="Nigerian" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heading Word 3</label>
                <input value={form.hero_heading_3} onChange={set('hero_heading_3')} className="input" placeholder="Cuisine" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero Description</label>
              <textarea value={form.hero_description} onChange={set('hero_description')} className="input resize-none" rows={3} />
            </div>
          </div>
        </div>

        {/* Why Us Section */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Why Choose Us Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Title</label>
              <input value={form.why_us_title} onChange={set('why_us_title')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Subtitle</label>
              <input value={form.why_us_subtitle} onChange={set('why_us_subtitle')} className="input" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Footer Description</h2>
          <textarea value={form.footer_description} onChange={set('footer_description')} className="input resize-none" rows={3} />
        </div>

        <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
          {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save Website Content
        </button>
      </form>
    </div>
  );
}
