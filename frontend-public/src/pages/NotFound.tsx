import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <SEO 
        title="Page Not Found | Raashi Cognitive Technologies" 
        description="The page you are looking for does not exist."
        robots="noindex, nofollow"
      />
      
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-black text-brand-blue/10">404</h1>
        <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-slate-600">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-full hover:bg-brand-blue/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
