'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Image as ImageIcon, Type, Sliders } from 'lucide-react';
import { contentApi, settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useQuery({ queryKey: ['site-content'], queryFn: () => contentApi.get().then(r => r.data) });
  const { data: settings } = useQuery({ queryKey: ['restaurant-settings'], queryFn: () => settingsApi.get().then(r => r.data) });

  const [form, setForm] = useState({
    hero_badge: '',
    hero_heading_1: '',
    hero_heading_2: '',
    hero_heading_3: '',
    hero_description: '',
    hero_image: '',
    hero_image_opacity: '10',
    hero_image_blur: '0',
    hero_image_brightness: '100',
    hero_overlay_color: '#1e1b4b',
    hero_overlay_opacity: '85',
    hero_bg_position: 'center',
    hero_bg_zoom: '100',
    hero_bg_repeat: 'no-repeat',
    footer_description: '',
    why_us_title: '',
    why_us_subtitle: '',
  });

  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => { if (content) setForm(f => ({ ...f, ...content })); }, [content]);
  useEffect(() => { if (settings?.logo) setLogoUrl(settings.logo); }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => contentApi.update(data),
    onSuccess: () => { toast.success('Content updated!'); queryClient.invalidateQueries({ queryKey: ['site-content'] }); },
    onError: () => toast.error('Failed to save'),
  });

  const logoMutation = useMutation({
    mutationFn: (url: string) => settingsApi.update({ logo: url }),
    onSuccess: () => { toast.success('Logo updated!'); queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] }); },
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const previewStyle: any = form.hero_image ? {
    backgroundImage: `linear-gradient(rgba(${hexToRgb(form.hero_overlay_color || '#1e1b4b')}, ${(parseInt(form.hero_overlay_opacity || '85')) / 100}), rgba(${hexToRgb(form.hero_overlay_color || '#1e1b4b')}, ${(parseInt(form.hero_overlay_opacity || '85')) / 100})), url(${form.hero_image})`,
    backgroundSize: `${form.hero_bg_zoom || '100'}%`,
    backgroundPosition: form.hero_bg_position || 'center',
    backgroundRepeat: form.hero_bg_repeat || 'no-repeat',
    filter: `blur(${form.hero_image_blur || 0}px) brightness(${form.hero_image_brightness || 100}%)`,
  } : { background: 'linear-gradient(to bottom right, #1e3a5f, #1e40af)' };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-700" /> Restaurant Logo
        </h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display='none'; }} /> : <span className="text-2xl">🍽️</span>}
          </div>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input flex-1 text-sm" placeholder="https://example.com/logo.png" />
        </div>
        <button type="button" onClick={() => logoMutation.mutate(logoUrl)} disabled={logoMutation.isPending} className="btn-primary !py-2 text-sm">
          {logoMutation.isPending ? 'Saving...' : 'Save Logo'}
        </button>
      </div>

      <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-6">
        {/* Hero Background Controls */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-700" /> Hero Background Controls
          </h2>

          {/* Preview */}
          <div className="w-full h-32 rounded-xl mb-4 overflow-hidden relative" style={previewStyle}>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-sm font-bold opacity-70">Hero Preview</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Image URL</label>
              <input value={form.hero_image} onChange={set('hero_image')} className="input" placeholder="https://example.com/hero.jpg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overlay Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.hero_overlay_color || '#1e1b4b'} onChange={set('hero_overlay_color')} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <input value={form.hero_overlay_color || '#1e1b4b'} onChange={set('hero_overlay_color')} className="input flex-1 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overlay Opacity: {form.hero_overlay_opacity || 85}%</label>
                <input type="range" min="0" max="100" value={form.hero_overlay_opacity || '85'} onChange={set('hero_overlay_opacity')} className="w-full accent-blue-700" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image Blur: {form.hero_image_blur || 0}px</label>
                <input type="range" min="0" max="20" value={form.hero_image_blur || '0'} onChange={set('hero_image_blur')} className="w-full accent-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brightness: {form.hero_image_brightness || 100}%</label>
                <input type="range" min="10" max="200" value={form.hero_image_brightness || '100'} onChange={set('hero_image_brightness')} className="w-full accent-blue-700" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                <select value={form.hero_bg_position || 'center'} onChange={set('hero_bg_position')} className="input text-sm">
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top center">Top Center</option>
                  <option value="bottom center">Bottom Center</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zoom: {form.hero_bg_zoom || 100}%</label>
                <input type="range" min="50" max="200" value={form.hero_bg_zoom || '100'} onChange={set('hero_bg_zoom')} className="w-full accent-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeat</label>
                <select value={form.hero_bg_repeat || 'no-repeat'} onChange={set('hero_bg_repeat')} className="input text-sm">
                  <option value="no-repeat">No Repeat</option>
                  <option value="repeat">Repeat</option>
                  <option value="repeat-x">Repeat X</option>
                  <option value="repeat-y">Repeat Y</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-700" /> Hero Text
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Text</label>
              <input value={form.hero_badge} onChange={set('hero_badge')} className="input" placeholder="Open Now • Fast Delivery" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['hero_heading_1', 'hero_heading_2', 'hero_heading_3'].map((key, i) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Word {i + 1}</label>
                  <input value={(form as any)[key]} onChange={set(key)} className="input" placeholder={['Authentic', 'Nigerian', 'Cuisine'][i]} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.hero_description} onChange={set('hero_description')} className="input resize-none" rows={3} />
            </div>
          </div>
        </div>

        {/* Other Sections */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Why Choose Us Section</h2>
          <div className="space-y-3">
            <input value={form.why_us_title} onChange={set('why_us_title')} className="input" placeholder="Why Choose Food Palace?" />
            <input value={form.why_us_subtitle} onChange={set('why_us_subtitle')} className="input" placeholder="Subtitle text..." />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Footer Description</h2>
          <textarea value={form.footer_description} onChange={set('footer_description')} className="input resize-none" rows={3} />
        </div>

        <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
          {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save All Content
        </button>
      </form>
    </div>
  );
}
