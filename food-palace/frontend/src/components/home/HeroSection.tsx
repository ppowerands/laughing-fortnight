'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Star, Clock, Truck } from 'lucide-react';
import { contentApi } from '@/lib/api';

export default function HeroSection() {
  const { data: content } = useQuery({
    queryKey: ['site-content'],
    queryFn: () => contentApi.get().then(r => r.data),
    staleTime: 0,
  });

  const hexToRgb = (hex: string) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    } catch { return '30, 27, 75'; }
  };

  const overlayColor = content?.hero_overlay_color || '#1e1b4b';
  const overlayOpacity = (parseInt(content?.hero_overlay_opacity || '85')) / 100;
  const blur = content?.hero_image_blur || '0';
  const brightness = content?.hero_image_brightness || '100';
  const position = content?.hero_bg_position || 'center';
  const zoom = content?.hero_bg_zoom || '100';
  const repeat = content?.hero_bg_repeat || 'no-repeat';

  const sectionStyle: any = content?.hero_image ? {
    backgroundImage: `linear-gradient(rgba(${hexToRgb(overlayColor)}, ${overlayOpacity}), rgba(${hexToRgb(overlayColor)}, ${overlayOpacity})), url(${content.hero_image})`,
    backgroundSize: `${zoom}%`,
    backgroundPosition: position,
    backgroundRepeat: repeat,
    filter: `blur(0px)`,
  } : {};

  const innerStyle: any = content?.hero_image ? {
    backdropFilter: `blur(${blur}px) brightness(${brightness}%)`,
  } : {};

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900" style={sectionStyle}>
      {!content?.hero_image && (
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>
      )}

      <div className="relative w-full" style={innerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-700/50 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-200 text-sm font-medium">{content?.hero_badge || 'Open Now • Fast Delivery'}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                {content?.hero_heading_1 || 'FOOD'}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-sky-300">
                  {content?.hero_heading_2 || 'PALACE'}
                </span>{' '}
                {content?.hero_heading_3 || 'PLUS'}
              </h1>

              <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {content?.hero_description || 'From smoky Jollof Rice to fresh Shawarmas — order your favourite Nigerian meals and get them delivered hot to your door.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link href="/menu" className="btn-primary text-center inline-flex items-center justify-center gap-2 text-base">
                  Order Now <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/menu" className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-all text-center text-base">
                  Browse Menu
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-8">
                {[
                  { icon: Star, label: '4.9 Rating', color: 'text-yellow-400' },
                  { icon: Clock, label: '30-45 mins', color: 'text-blue-300' },
                  { icon: Truck, label: 'Wide Coverage', color: 'text-green-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-blue-200 text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { emoji: '🍛', name: 'Jollof Rice', price: '₦2,500', tag: 'Best Seller' },
                { emoji: '🌯', name: 'Beef Shawarma', price: 'From ₦2,800', tag: 'Popular' },
                { emoji: '🍲', name: 'Egusi Soup', price: '₦2,500', tag: 'Traditional' },
                { emoji: '🍔', name: 'Double Burger', price: '₦3,500', tag: 'New' },
              ].map((item, i) => (
                <div key={i} className={`rounded-2xl p-4 backdrop-blur-lg bg-white/10 border border-white/20 ${i % 2 === 1 ? 'mt-6' : ''}`}>
                  <div className="text-5xl mb-3">{item.emoji}</div>
                  <span className="text-xs font-semibold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full">{item.tag}</span>
                  <h3 className="text-white font-bold mt-2">{item.name}</h3>
                  <p className="text-blue-300 text-sm font-semibold">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
