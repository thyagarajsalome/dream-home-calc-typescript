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

// AMAZON STYLE HOVER ZOOM (No Blur)
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
      <img 
        src={src} 
        alt={alt}
        className={`w-full h-full object-cover filter transition-all duration-150 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
      />
      <div 
        className={`absolute inset-0 transition-opacity duration-150 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          backgroundSize: '250%', 
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
         <i className="fas fa-expand text-white text-3xl drop-shadow-md opacity-50"></i>
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
  
  // Download Progress State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  // DELETE FUNCTION
  const handleDelete = async (plan: HousePlan) => {
    const isConfirmed = window.confirm(
      `⚠️ ALERT: You are about to delete:\n\n"${plan.title}"\n\nThis will remove the file from the database and storage. Are you sure?`
    );
    if (!isConfirmed) return;

    try {
      showToast("Deleting plan...", "info");
      
      // 1. Delete from Database
      const { error: dbError } = await supabase.from('house_plans').delete().eq('id', plan.id);
      if (dbError) throw dbError;

      // 2. Try to Delete from Storage (Clean URLs to relative paths first)
      const getRelativePath = (url: string) => {
        if (url.includes('/house-plans/')) return url.split('/house-plans/')[1].replace(/^\/+/, '');
        return url;
      };
      await supabase.storage.from('house-plans').remove([
        getRelativePath(plan.file_url), 
        getRelativePath(plan.preview_url)
      ]);

      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast("Plan deleted successfully.", "success");
    } catch (err: any) {
      showToast("Failed to delete plan: " + err.message, "error");
    }
  };

  // DOWNLOAD FUNCTION
  const handleDownload = async (plan: HousePlan) => {
    if (!user) {
      showToast("Please sign in to download plans", "info");
      navigate("/signin");
      return;
    }

    if (!hasPaid && user.email !== ADMIN_EMAIL) {
      navigate("/upgrade");
      return;
    }

    setDownloadingId(plan.id);
    setDownloadProgress(10);

    // Simulate progress bar for generating the secure link
    const interval = setInterval(() => {
      setDownloadProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      let cleanPath = plan.file_url;
      if (cleanPath.includes('http')) {
        try {
          const urlObj = new URL(cleanPath);
          const parts = urlObj.pathname.split('/house-plans/');
          if (parts.length > 1) cleanPath = parts[1];
        } catch (e) {
          if(cleanPath.includes('/house-plans/')) cleanPath = cleanPath.split('/house-plans/')[1];
        }
      }
      cleanPath = cleanPath.replace(/^\/+/, '');

      const { data, error } = await supabase.storage.from('house-plans').createSignedUrl(cleanPath, 60);

      if (error) throw error;
      
      setDownloadProgress(100);
      clearInterval(interval);

      if (data?.signedUrl) {
        setTimeout(() => {
          window.open(data.signedUrl, '_blank');
          showToast("Download started!", "success");
          setDownloadingId(null);
          setDownloadProgress(0);
        }, 500);
      }
    } catch (err: any) {
      clearInterval(interval);
      showToast("Download failed: " + err.message, "error");
      setDownloadingId(null);
      setDownloadProgress(0);
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
      
      {user?.email === ADMIN_EMAIL && (
        <PlanUploader onUploadSuccess={() => fetchPlans(0)} />
      )}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-secondary">House Plan Library</h1>
        <p className="text-gray-500 mt-2">Explore professional floor plans ready for download.</p>
      </div>

      {/* COMPACT RESPONSIVE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="overflow-hidden border-gray-100 flex flex-col h-full p-0 relative">
            
            {/* Admin Delete Button */}
            {user?.email === ADMIN_EMAIL && (
              <button 
                onClick={() => handleDelete(plan)}
                className="absolute top-2 right-2 z-20 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="Delete Plan"
              >
                <i className="fas fa-trash-alt text-sm"></i>
              </button>
            )}

            <HoverZoomImage 
              src={getPreviewUrl(plan.preview_url)} 
              alt={plan.title} 
              onClick={() => setZoomedImage(getPreviewUrl(plan.preview_url))} 
            />
            
            <div className="p-4 flex-grow flex flex-col justify-between border-t border-gray-100 bg-white z-10 relative">
              <div>
                <h3 className="font-bold text-gray-800 text-base line-clamp-1">{plan.title}</h3>
                <div className="flex gap-2 mt-1 mb-3">
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                    <i className="fas fa-ruler-combined mr-1"></i>{plan.area_sqft} sq.ft
                  </span>
                  <span className="text-[10px] bg-primary/10 px-2 py-1 rounded text-primary font-bold">
                    <i className="fas fa-compass mr-1"></i>{plan.facing}
                  </span>
                </div>
              </div>
              
              {/* Download Button / Progress Bar */}
              {downloadingId === plan.id ? (
                <div className="w-full">
                   <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span>Preparing...</span>
                      <span>{downloadProgress}%</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${downloadProgress}%` }}></div>
                   </div>
                </div>
              ) : (
                <Button 
                  onClick={() => handleDownload(plan)}
                  variant={hasPaid || user?.email === ADMIN_EMAIL ? "primary" : "outline"}
                  className="w-full text-sm py-2"
                  icon={hasPaid || user?.email === ADMIN_EMAIL ? "fas fa-download" : "fas fa-lock"}
                >
                  {hasPaid || user?.email === ADMIN_EMAIL ? "Download" : "Unlock"}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {hasMore && plans.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Button onClick={() => { setPage(page + 1); fetchPlans(page + 1); }} variant="secondary" isLoading={loading} disabled={loading}>
            {loading ? "Loading..." : "Load More Plans"}
          </Button>
        </div>
      )}

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