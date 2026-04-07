// src/features/plans/PlanGallery.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PlanUploader } from "./PlanUploader";

const PLANS_PER_PAGE = 12;
const ADMIN_EMAIL = "thyagaraja1983@gmail.com";

interface HousePlan {
  id: string;
  title: string;
  area_sqft: number;
  facing: string;
  preview_url: string;
  file_url: string;
}

// --- AMAZON STYLE HOVER ZOOM COMPONENT ---
const HoverZoomImage = ({ src, alt, onClick }: { src: string, alt: string, onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div 
      className="relative aspect-[9/16] bg-gray-100 group cursor-crosshair overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {/* Base Image */}
      <img 
        src={src} 
        alt={alt}
        className={`w-full h-full object-cover filter transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100 blur-[1px]'}`}
        loading="lazy"
      />
      {/* Zoomed Image Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-150 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          backgroundSize: '250%', // Adjust this percentage to change zoom level!
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Subtle Fullscreen Hint Icon */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
         <i className="fas fa-expand text-white text-4xl drop-shadow-md opacity-40"></i>
      </div>
    </div>
  );
};

export const PlanGallery: React.FC = () => {
  const [plans, setPlans] = useState<HousePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const { user, hasPaid } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchPlans = useCallback(async (pageNum: number) => {
    setLoading(true);
    const from = pageNum * PLANS_PER_PAGE;
    const to = from + PLANS_PER_PAGE - 1;

    try {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (data.length < PLANS_PER_PAGE) setHasMore(false);
        setPlans(prev => pageNum === 0 ? data : [...prev, ...data]);
      }
    } catch (err: any) {
      showToast("Error fetching plans: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPlans(0);
  }, [fetchPlans]);

  const handleAction = async (plan: HousePlan) => {
    if (!user) {
      showToast("Please sign in to download plans", "info");
      navigate("/signin");
      return;
    }

    if (!hasPaid && user.email !== ADMIN_EMAIL) {
      navigate("/upgrade");
      return;
    }

    try {
      let cleanPath = plan.file_url;
      
      // 🚨 FIX FOR 400 BAD REQUEST: Strip out domains to get pure relative path
      if (cleanPath.includes('http')) {
        try {
          const urlObj = new URL(cleanPath);
          const parts = urlObj.pathname.split('/house-plans/');
          if (parts.length > 1) {
            cleanPath = parts[1];
          }
        } catch (e) {
          // If URL parsing fails, fallback to string splitting
          if(cleanPath.includes('/house-plans/')) {
            cleanPath = cleanPath.split('/house-plans/')[1];
          }
        }
      }
      // Remove leading slashes just in case
      cleanPath = cleanPath.replace(/^\/+/, '');

      const { data, error } = await supabase.storage
        .from('house-plans')
        .createSignedUrl(cleanPath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        showToast("Download started!", "success");
      }
    } catch (err: any) {
      showToast("Download failed: " + err.message, "error");
    }
  };

  const getPreviewUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const cleanPath = path.includes('/') ? path : `previews/${path}`;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/storage/v1/object/public/house-plans/${cleanPath}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      
      {/* ADMIN UPLOADER */}
      {user?.email === ADMIN_EMAIL && (
        <PlanUploader onUploadSuccess={() => fetchPlans(0)} />
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-secondary">House Plan Library</h1>
        <p className="text-gray-500 mt-2">Explore professional floor plans ready for download.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="overflow-hidden border-gray-100 flex flex-col h-full p-0">
            
            {/* New Hover Zoom Image */}
            <HoverZoomImage 
              src={getPreviewUrl(plan.preview_url)} 
              alt={plan.title} 
              onClick={() => setZoomedImage(getPreviewUrl(plan.preview_url))} 
            />
            
            <div className="p-5 flex-grow flex flex-col justify-between border-t border-gray-100 bg-white z-10 relative">
              <div>
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{plan.title}</h3>
                <div className="flex gap-2 mt-2 mb-5">
                  <span className="text-xs bg-gray-100 px-2.5 py-1 rounded text-gray-600 font-medium">
                    <i className="fas fa-ruler-combined mr-1"></i>{plan.area_sqft} sq.ft
                  </span>
                  <span className="text-xs bg-primary/10 px-2.5 py-1 rounded text-primary font-bold">
                    <i className="fas fa-compass mr-1"></i>{plan.facing}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleAction(plan)}
                variant={hasPaid || user?.email === ADMIN_EMAIL ? "primary" : "outline"}
                className="w-full"
                icon={hasPaid || user?.email === ADMIN_EMAIL ? "fas fa-download" : "fas fa-lock"}
              >
                {hasPaid || user?.email === ADMIN_EMAIL ? "Download Full Plan" : "Unlock with Pro"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && plans.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button onClick={() => { setPage(page + 1); fetchPlans(page + 1); }} variant="secondary" isLoading={loading} disabled={loading}>
            {loading ? "Loading..." : "Load More Plans"}
          </Button>
        </div>
      )}

      {/* Fullscreen Click-to-Expand Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl transition-colors">
            &times;
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed Plan" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default PlanGallery;