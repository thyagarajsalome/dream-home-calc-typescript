// src/features/plans/PlanGallery.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { PlanUploader } from "./PlanUploader";

const PLANS_PER_PAGE = 12;
const ADMIN_EMAIL = "thyagaraja1983@gmail.com";

interface HousePlan {
  id: string;
  title: string;
  area_sqft: number;
  facing: string;
  file_url: string;
}

// AMAZON STYLE HOVER ZOOM (Directly on the actual image)
const HoverZoomImage = ({ src, alt, onClick, isLocked }: { src: string, alt: string, onClick: () => void, isLocked: boolean }) => {
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
      className="relative aspect-[3/4] bg-gray-100 group cursor-pointer overflow-hidden w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-150 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
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
      
      {/* Show a subtle lock icon if they need to upgrade, or download icon if they have access */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
         <div className="bg-black/50 text-white rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm drop-shadow-md">
            <i className={`fas ${isLocked ? 'fa-lock' : 'fa-download'} text-xl`}></i>
         </div>
      </div>
    </div>
  );
};

export const PlanGallery: React.FC = () => {
  const [plans, setPlans] = useState<HousePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
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
        .select('id, title, area_sqft, facing, file_url')
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

  const handleDelete = async (plan: HousePlan) => {
    if (!window.confirm(`⚠️ Delete "${plan.title}" entirely?`)) return;
    try {
      showToast("Deleting plan...", "info");
      const { error: dbError } = await supabase.from('house_plans').delete().eq('id', plan.id);
      if (dbError) throw dbError;

      const getRelativePath = (url: string) => url.includes('/house-plans/') ? url.split('/house-plans/')[1].replace(/^\/+/, '') : url;
      
      await supabase.storage.from('house-plans').remove([getRelativePath(plan.file_url)]);
      
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast("Plan deleted.", "success");
    } catch (err: any) {
      showToast("Failed to delete plan: " + err.message, "error");
    }
  };

  const handleDownload = async (plan: HousePlan) => {
    if (!user) { navigate("/signin"); return; }
    if (!hasPaid && user.email !== ADMIN_EMAIL) { navigate("/upgrade"); return; }

    setDownloadingId(plan.id);
    setDownloadProgress(10);

    const interval = setInterval(() => setDownloadProgress(prev => (prev < 90 ? prev + 15 : prev)), 200);

    try {
      let cleanPath = plan.file_url;
      if (cleanPath.includes('http')) {
        try { cleanPath = new URL(cleanPath).pathname.split('/house-plans/')[1]; } 
        catch (e) { cleanPath = cleanPath.split('/house-plans/')[1]; }
      }
      cleanPath = cleanPath.replace(/^\/+/, '');

      const { data, error } = await supabase.storage.from('house-plans').createSignedUrl(cleanPath, 60);
      if (error) throw error;
      
      setDownloadProgress(100);
      clearInterval(interval);

      if (data?.signedUrl) {
        setTimeout(() => {
          window.open(data.signedUrl, '_blank');
          setDownloadingId(null);
          setDownloadProgress(0);
        }, 300);
      }
    } catch (err: any) {
      clearInterval(interval);
      showToast("Download failed.", "error");
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  // --- NEW: Image Click Handler ---
  const handleImageClick = (plan: HousePlan) => {
    if (!user) {
      showToast("Please sign in to access premium plans.", "info");
      navigate("/signin");
      return;
    }
    // If not paid and not admin, send to upgrade page!
    if (!hasPaid && user.email !== ADMIN_EMAIL) {
      navigate("/upgrade");
      return;
    }
    // If they ARE paid, clicking the image starts the download
    handleDownload(plan);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/house-plans/${cleanPath}`;
  };

  const isLockedForUser = !hasPaid && user?.email !== ADMIN_EMAIL;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      
      {user?.email === ADMIN_EMAIL && <PlanUploader onUploadSuccess={() => fetchPlans(0)} />}

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-secondary">House Plan Library</h1>
        <p className="text-gray-500 mt-2">Hover to zoom. Click to unlock full high-resolution plans.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col relative transition-shadow">
            
            {user?.email === ADMIN_EMAIL && (
              <button onClick={() => handleDelete(plan)} className="absolute top-2 right-2 z-20 bg-red-500/90 hover:bg-red-600 text-white w-7 h-7 rounded-md flex items-center justify-center shadow transition-transform hover:scale-105" title="Delete Plan">
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            )}

            {/* Click now redirects to upgrade or downloads directly */}
            <HoverZoomImage 
              src={getImageUrl(plan.file_url)} 
              alt={plan.title} 
              onClick={() => handleImageClick(plan)} 
              isLocked={isLockedForUser}
            />
            
            <div className="p-3 flex flex-col gap-2 bg-white">
              <h3 className="font-bold text-gray-800 text-sm truncate" title={plan.title}>{plan.title}</h3>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded"><i className="fas fa-ruler-combined mr-1"></i>{plan.area_sqft} sqft</span>
                <span className="text-primary bg-primary/10 px-2 py-1 rounded"><i className="fas fa-compass mr-1"></i>{plan.facing}</span>
              </div>
              
              {downloadingId === plan.id ? (
                <div className="w-full mt-1">
                   <div className="w-full bg-gray-200 rounded-full h-1.5">
                     <div className="bg-primary h-1.5 rounded-full transition-all duration-200" style={{ width: `${downloadProgress}%` }}></div>
                   </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleDownload(plan)}
                  className={`mt-1 w-full py-1.5 text-xs font-bold rounded-lg transition-colors ${!isLockedForUser ? "bg-primary text-white hover:bg-yellow-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <i className={`mr-1.5 ${!isLockedForUser ? "fas fa-download" : "fas fa-lock"}`}></i>
                  {!isLockedForUser ? "Download" : "Unlock"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && plans.length > 0 && (
        <div className="mt-10 flex justify-center">
          <Button onClick={() => { setPage(page + 1); fetchPlans(page + 1); }} variant="secondary" isLoading={loading} disabled={loading}>
            {loading ? "Loading..." : "Load More Plans"}
          </Button>
        </div>
      )}
      
      {/* Removed the Fullscreen Lightbox entirely */}
    </div>
  );
};

export default PlanGallery;