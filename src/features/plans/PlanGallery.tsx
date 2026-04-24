// src/features/plans/PlanGallery.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { PlanUploader } from "./PlanUploader";

const PLANS_PER_PAGE = 12;

interface HousePlan {
  id: string;
  title: string;
  area_sqft: number;
  facing: string;
  file_url: string;
  dimensions: string;
  floors: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  description: string;
  youtube_url?: string; // NEW: Added for video tours
}

// Utility to extract ID from standard or Shorts links
const getYouTubeID = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

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
      <img src={src} alt={alt} className={`w-full h-full object-cover transition-opacity duration-150 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />
      <div 
        className={`absolute inset-0 transition-opacity duration-150 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${src})`, backgroundPosition: `${position.x}% ${position.y}%`, backgroundSize: '250%', backgroundRepeat: 'no-repeat' }}
      />
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
  
  const [selectedPlan, setSelectedPlan] = useState<HousePlan | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null); // NEW: Track currently playing video
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<HousePlan>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const { user, hasPaid, planTier, role } = useUser();
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

  useEffect(() => { fetchPlans(0); }, [fetchPlans]);

  useEffect(() => {
    setIsEditing(false);
    if (selectedPlan) {
      setEditData(selectedPlan);
    }
  }, [selectedPlan]);

  const handleDelete = async (plan: HousePlan) => {
    if (!window.confirm(`⚠️ Delete "${plan.title}" entirely?`)) return;
    try {
      const { data, error: dbError } = await supabase
        .from('house_plans')
        .delete()
        .eq('id', plan.id)
        .select();

      if (dbError) throw dbError;
      if (!data || data.length === 0) {
        throw new Error("Deletion blocked by Database RLS Policy.");
      }

      const getRelativePath = (url: string) => url.includes('/house-plans/') ? url.split('/house-plans/')[1].replace(/^\/+/, '') : url;
      await supabase.storage.from('house-plans').remove([getRelativePath(plan.file_url)]);
      
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast("Plan deleted.", "success");
    } catch (err: any) { 
      showToast("Failed to delete plan: " + err.message, "error"); 
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    setIsUpdating(true);
    try {
      const payload = {
        title: editData.title,
        area_sqft: editData.area_sqft,
        facing: editData.facing,
        dimensions: editData.dimensions,
        bedrooms: editData.bedrooms,
        bathrooms: editData.bathrooms,
        floors: editData.floors,
        parking: editData.parking,
        description: editData.description,
        youtube_url: editData.youtube_url // NEW: Include video URL in update
      };

      const { data, error } = await supabase
        .from('house_plans')
        .update(payload)
        .eq('id', selectedPlan.id)
        .select();

      if (error) throw error;

      const updatedPlan = { ...selectedPlan, ...payload } as HousePlan;
      setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
      setSelectedPlan(updatedPlan);
      setIsEditing(false);
      showToast("Specs updated successfully!", "success");
    } catch (err: any) {
      showToast("Failed to update specs: " + err.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async (plan: HousePlan) => {
    if (!user) { navigate("/signin"); return; }
    const currentTier = planTier || (hasPaid ? 'pro' : 'free');
    const limits: Record<string, number> = { basic: 1, standard: 2, pro: 3 };
    const userLimit = limits[currentTier] || 0;

    if (role !== 'admin') {
      if (userLimit === 0) { navigate("/upgrade"); return; }
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase.from('download_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('downloaded_at', today);
      if (count !== null && count >= userLimit) {
        showToast(`Daily limit reached!`, "error");
        return;
      }
    }

    setDownloadingId(plan.id);
    setDownloadProgress(10);
    const interval = setInterval(() => setDownloadProgress(prev => (prev < 90 ? prev + 10 : prev)), 200);

    try {
      let cleanPath = plan.file_url.split('/house-plans/').pop()?.replace(/^\/+/, '') || plan.file_url;
      const { data, error } = await supabase.storage.from('house-plans').download(cleanPath);
      if (error) throw error;
      setDownloadProgress(100);
      clearInterval(interval);
      if (data) {
        if (role !== 'admin') await supabase.from('download_logs').insert({ user_id: user.id, plan_id: plan.id });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = cleanPath.split('/').pop() || 'House-Plan';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadingId(null); setDownloadProgress(0);
      }
    } catch (err: any) { clearInterval(interval); showToast("Download failed.", "error"); setDownloadingId(null); setDownloadProgress(0); }
  };

  const getImageUrl = (path: string) => path.startsWith('http') ? path : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/house-plans/${path.replace(/^\/+/, '')}`;

  const currentTier = planTier || (hasPaid ? 'pro' : 'free');
  const isLockedForUser = currentTier === 'free' && role !== 'admin';

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in relative">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md w-fit">
          <i className="fas fa-arrow-left"></i> Back to Calculator
        </Link>
      </div>

      {role === 'admin' && <PlanUploader onUploadSuccess={() => fetchPlans(0)} />}

      <div className="relative bg-gradient-to-br from-secondary to-gray-900 rounded-3xl p-8 md:p-12 mb-10 overflow-hidden shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Architectural House Plans</h1>
        <p className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed">Explore modern, compliant designs with full video tours.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {plans.map((plan) => {
          const videoId = getYouTubeID(plan.youtube_url || "");
          return (
            <div key={plan.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col relative transition-all duration-300">
              
              {/* Play Button Overlay */}
              {videoId && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveVideo(videoId); }}
                  className="absolute top-3 left-3 z-20 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group/play"
                  title="Watch Video Tour"
                >
                  <i className="fas fa-play text-xs ml-0.5"></i>
                </button>
              )}

              {role === 'admin' && (
                <button onClick={() => handleDelete(plan)} className="absolute top-3 right-3 z-20 bg-red-500/90 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
                  <i className="fas fa-trash-alt text-sm"></i>
                </button>
              )}

              <HoverZoomImage src={getImageUrl(plan.file_url)} alt={plan.title} onClick={() => handleImageClick(plan)} isLocked={isLockedForUser} />
              
              <div className="p-4 flex flex-col gap-3 bg-white">
                <h3 className="font-bold text-gray-800 text-sm truncate" title={plan.title}>{plan.title}</h3>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">{plan.dimensions || `${plan.area_sqft} sqft`}</span>
                  <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">{plan.facing}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => setSelectedPlan(plan)} className="w-full py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Specs</button>
                  <button onClick={() => handleDownload(plan)} className={`w-full py-2 text-xs font-bold rounded-xl transition-colors ${!isLockedForUser ? "bg-primary text-white hover:bg-yellow-600" : "bg-gray-100 text-gray-500"}`}>
                    <i className={`mr-1 ${!isLockedForUser ? "fas fa-download" : "fas fa-lock"}`}></i> {!isLockedForUser ? "DL" : "Pro"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW: YouTube Shorts Modal (Responsive 9:16) */}
      {activeVideo && (
        <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setActiveVideo(null)}>
          <div className="relative w-full max-w-[420px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveVideo(null)} className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
              <i className="fas fa-times"></i>
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
              title="Tour Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => { if(!isEditing) setSelectedPlan(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            
            <div className="md:w-1/2 bg-gray-100 relative h-64 md:h-auto overflow-hidden flex-shrink-0">
               <img src={getImageUrl(selectedPlan.file_url)} className="w-full h-full object-contain" alt={selectedPlan.title} />
            </div>

            <div className="md:w-1/2 p-6 md:p-8 flex flex-col h-[50vh] md:h-auto overflow-y-auto relative">
              <div className="flex justify-between items-start mb-4">
                {isEditing ? (
                  <input type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="text-2xl font-bold text-gray-800 pr-4 w-full border-b-2 border-primary outline-none focus:bg-gray-50" />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800 pr-4">{selectedPlan.title}</h2>
                )}
                <button onClick={() => { setSelectedPlan(null); setIsEditing(false); }} className="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
              </div>

              {/* Developer Provision: Edit YouTube Link */}
              {isEditing && (
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">YouTube Tour URL</label>
                  <div className="relative">
                    <i className="fab fa-youtube absolute left-3 top-3 text-red-600"></i>
                    <input 
                      type="text" 
                      placeholder="YouTube link..." 
                      value={editData.youtube_url || ""} 
                      onChange={e => setEditData({...editData, youtube_url: e.target.value})} 
                      className="w-full pl-10 p-2 text-xs border rounded-lg outline-none focus:border-primary" 
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Specifications</h4>
                {role === 'admin' && (
                  <button onClick={() => { if (isEditing) handleUpdatePlan(); else setIsEditing(true); }} disabled={isUpdating} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
                    {isUpdating ? "Saving..." : isEditing ? "Save" : "Edit"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100"><i className="fas fa-bed"></i></div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Bedrooms</p>
                    {isEditing ? <input type="number" value={editData.bedrooms} onChange={e=>setEditData({...editData, bedrooms: parseInt(e.target.value)||0})} className="w-16 border rounded text-sm font-bold" /> : <p className="font-bold text-gray-800">{selectedPlan.bedrooms}</p>}
                  </div>
                </div>
                {/* ... other spec fields follow same pattern ... */}
              </div>

              <div className="pt-4 border-t border-gray-100 mt-auto">
                <Button onClick={() => { setSelectedPlan(null); handleDownload(selectedPlan!); }} className="w-full py-4 text-sm shadow-md" icon={!isLockedForUser ? "fas fa-download" : "fas fa-lock"} disabled={isEditing}>
                  {!isLockedForUser ? "Download High-Res Blueprint" : "Unlock to Download Plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGallery;