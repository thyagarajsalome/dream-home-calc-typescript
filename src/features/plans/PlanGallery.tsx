import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

// Number of plans to load per batch
const PLANS_PER_PAGE = 12;

interface HousePlan {
  id: string;
  title: string;
  area_sqft: number;
  facing: string;
  preview_url: string;
  file_url: string; // This should be the storage path, e.g., 'full-plans/plan1.png'
}

export const PlanGallery: React.FC = () => {
  const [plans, setPlans] = useState<HousePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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
        .range(from, to); // Pagination logic

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

    if (!hasPaid) {
      navigate("/upgrade");
      return;
    }

    // Pro User Logic: Generate a secure, temporary download link
    try {
      const { data, error } = await supabase.storage
        .from('house-plans')
        .createSignedUrl(plan.file_url, 60); // Link expires in 60 seconds

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        showToast("Download started!", "success");
      }
    } catch (err: any) {
      showToast("Download failed: " + err.message, "error");
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPlans(nextPage);
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-secondary">House Plan Library</h1>
        <p className="text-gray-500 mt-2">Explore professional 9:16 floor plans ready for download.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="overflow-hidden border-gray-100 flex flex-col h-full">
            <div className="relative aspect-[9/16] bg-gray-100 group">
              <img 
                src={plan.preview_url} 
                alt={plan.title}
                className="w-full h-full object-cover filter blur-[0.5px] group-hover:blur-none transition-all duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <i className="fas fa-search-plus text-white text-3xl opacity-50"></i>
              </div>
            </div>
            
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1">{plan.title}</h3>
                <div className="flex gap-2 mt-1 mb-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                    {plan.area_sqft} sq.ft
                  </span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary font-bold">
                    {plan.facing} Facing
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleAction(plan)}
                variant={hasPaid ? "primary" : "outline"}
                className="w-full"
                icon={hasPaid ? "fas fa-download" : "fas fa-lock"}
              >
                {hasPaid ? "Download PNG" : "Unlock with Pro"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button 
            onClick={loadMore} 
            variant="secondary" 
            isLoading={loading}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More Plans"}
          </Button>
        </div>
      )}

      {plans.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-400">
          <i className="fas fa-drafting-hammer text-5xl mb-4"></i>
          <p className="text-lg">No plans found in the library yet.</p>
        </div>
      )}
    </div>
  );
};

export default PlanGallery;