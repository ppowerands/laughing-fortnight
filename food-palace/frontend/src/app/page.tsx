import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import FeaturedMeals from '@/components/home/FeaturedMeals';
import WhyUs from '@/components/home/WhyUs';
import OpenStatus from '@/components/OpenStatus';

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <HeroSection />
      <OpenStatus />
      <CategorySection />
      <FeaturedMeals />
      <WhyUs />
      <Footer />
    </main>
  );
}
