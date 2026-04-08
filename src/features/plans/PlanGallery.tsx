// src/features/plans/PlanGallery.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link
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
  dimensions: string;
  floors: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  description: string;
}

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

  useEffect(() => { fetchPlans(0); }, [fetchPlans]);

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
        throw new Error("Deletion blocked by Database RLS Policy. Ensure Admin has DELETE permissions.");
      }

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
      
      // FIX: Use download() instead of createSignedUrl() for public buckets
      const { data, error } = await supabase.storage.from('house-plans').download(cleanPath);
      
      if (error) throw error;
      
      setDownloadProgress(100);
      clearInterval(interval);
      
      if (data) {
        setTimeout(() => {
          // FIX: Force browser to download the file as an attachment
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = cleanPath.split('/').pop() || 'House-Plan';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
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

  const handleImageClick = (plan: HousePlan) => {
    if (!user) { navigate("/signin"); return; }
    if (!hasPaid && user.email !== ADMIN_EMAIL) { navigate("/upgrade"); return; }
    handleDownload(plan);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/house-plans/${path.replace(/^\/+/, '')}`;
  };

  const isLockedForUser = !hasPaid && user?.email !== ADMIN_EMAIL;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in relative">
      
      {/* NEW: Back to Home Button */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md w-fit">
          <i className="fas fa-arrow-left"></i> Back to Calculator
        </Link>
      </div>

      {user?.email === ADMIN_EMAIL && <PlanUploader onUploadSuccess={() => fetchPlans(0)} />}

      {/* NEW: Premium Hero Banner */}
      <div className="relative bg-gradient-to-br from-secondary to-gray-900 rounded-3xl p-8 md:p-12 mb-10 overflow-hidden shadow-2xl">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span className="bg-primary/20 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block border border-primary/50 shadow-sm">
              <i className="fas fa-star text-primary mr-1"></i> Premium Collection
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Architectural House Plans</h1>
            <p className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed">
              Explore our curated gallery of modern, compliant designs. Hover to inspect layouts, or unlock high-resolution blueprints and detailed specifications for your dream home.
            </p>
          </div>
          {/* Decorative Icon Graphic */}
          <div className="hidden md:flex flex-shrink-0 w-32 h-32 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-xl">
             <i className="fas fa-drafting-compass text-6xl text-primary drop-shadow-lg"></i>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col relative transition-all duration-300">
            
            {user?.email === ADMIN_EMAIL && (
              <button onClick={() => handleDelete(plan)} className="absolute top-2 right-2 z-20 bg-red-500/90 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
                <i className="fas fa-trash-alt text-sm"></i>
              </button>
            )}

            <HoverZoomImage src={getImageUrl(plan.file_url)} alt={plan.title} onClick={() => handleImageClick(plan)} isLocked={isLockedForUser} />
            
            <div className="p-4 flex flex-col gap-3 bg-white">
              <div>
                <h3 className="font-bold text-gray-800 text-sm truncate mb-2" title={plan.title}>{plan.title}</h3>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">{plan.dimensions || `${plan.area_sqft} sqft`}</span>
                  <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">{plan.facing}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-100 pt-3 px-1">
                <span title="Bedrooms" className="flex items-center gap-1"><i className="fas fa-bed text-gray-400"></i>{plan.bedrooms}</span>
                <span title="Bathrooms" className="flex items-center gap-1"><i className="fas fa-bath text-gray-400"></i>{plan.bathrooms}</span>
                <span title="Floors" className="flex items-center gap-1"><i className="fas fa-layer-group text-gray-400"></i>{plan.floors}</span>
                <span title="Parking" className="flex items-center gap-1"><i className="fas fa-car text-gray-400"></i>{plan.parking?.split(' ')[0] || '1'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button 
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <i className="fas fa-eye mr-1"></i> Specs
                </button>

                {downloadingId === plan.id ? (
                   <div className="w-full flex items-center bg-gray-100 rounded-xl px-2"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${downloadProgress}%` }}></div></div></div>
                ) : (
                  <button 
                    onClick={() => handleDownload(plan)}
                    className={`w-full py-2 text-xs font-bold rounded-xl shadow-sm transition-colors ${!isLockedForUser ? "bg-primary text-white hover:bg-yellow-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    <i className={`mr-1 ${!isLockedForUser ? "fas fa-download" : "fas fa-lock"}`}></i> {!isLockedForUser ? "DL" : "Pro"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && plans.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button onClick={() => { setPage(page + 1); fetchPlans(page + 1); }} variant="secondary" isLoading={loading} disabled={loading} className="px-8 py-3 shadow-md hover:shadow-lg">
            {loading ? "Loading..." : "Load More Plans"}
          </Button>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPlan(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Image Side with Watermark */}
            <div className="md:w-1/2 bg-gray-100 relative h-64 md:h-auto overflow-hidden">
               <img src={getImageUrl(selectedPlan.file_url)} className="w-full h-full object-contain" alt={selectedPlan.title} />
               
               {isLockedForUser && (
                 <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-10 opacity-20 transform -rotate-12 scale-150">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <span key={i} className="text-black font-black text-5xl select-none">HDE</span>
                      ))}
                    </div>
                    <div className="relative z-10 w-20 h-20 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl border border-white/10">
                      <i className="fas fa-lock text-white text-3xl drop-shadow-lg"></i>
                    </div>
                 </div>
               )}
            </div>

            {/* Details Side */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col h-[50vh] md:h-auto overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800 pr-4">{selectedPlan.title}</h2>
                <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-800 text-3xl leading-none transition-colors">&times;</button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                 <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/20"><i className="fas fa-ruler-combined mr-1"></i> {selectedPlan.area_sqft} Sq.Ft</span>
                 <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200"><i className="fas fa-compass mr-1"></i> Facing: {selectedPlan.facing}</span>
                 {selectedPlan.dimensions && <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200"><i className="fas fa-vector-square mr-1"></i> {selectedPlan.dimensions}</span>}
              </div>

              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Key Specifications</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100"><i className="fas fa-bed"></i></div><div><p className="text-[10px] text-gray-500 font-bold uppercase">Bedrooms</p><p className="font-bold text-gray-800">{selectedPlan.bedrooms}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center border border-cyan-100"><i className="fas fa-bath"></i></div><div><p className="text-[10px] text-gray-500 font-bold uppercase">Bathrooms</p><p className="font-bold text-gray-800">{selectedPlan.bathrooms}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100"><i className="fas fa-layer-group"></i></div><div><p className="text-[10px] text-gray-500 font-bold uppercase">Floors</p><p className="font-bold text-gray-800">{selectedPlan.floors}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center border border-green-100"><i className="fas fa-car"></i></div><div><p className="text-[10px] text-gray-500 font-bold uppercase">Parking</p><p className="font-bold text-gray-800">{selectedPlan.parking}</p></div></div>
              </div>

              {selectedPlan.description && (
                <>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Detailed Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6 flex-grow">{selectedPlan.description}</p>
                </>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed mb-4 mt-auto shadow-sm">
                <strong>Disclaimer:</strong> This plan is provided as a bonus for Pro account users. It is intended for conceptual design purposes only and to give you an idea for planning your house. For accurate planning, safety, and execution, it is always recommended to consult a professional architect.
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button 
                  onClick={() => { setSelectedPlan(null); handleDownload(selectedPlan); }}
                  className="w-full py-4 text-sm shadow-md"
                  icon={!isLockedForUser ? "fas fa-download" : "fas fa-lock"}
                >
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