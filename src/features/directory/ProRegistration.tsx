// src/features/directory/ProRegistration.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const GROUPED_CATEGORIES: Record<string, string[]> = {
  "Design & Planning": ["3D Designer / Visualizer", "Architect", "Draftsman", "Structural Engineer"],
  "Construction & Structure": ["Borewell Contractor", "Fabricator (Grill/Gate)", "House Contractor", "Material Vendor", "Waterproofing Specialist"],
  "Essential Services": ["Electrician", "Plumber", "Solar / UPS Vendor"],
  "Finishing & Interiors": ["Carpenter", "Floor Layman", "Interior Designer", "Painter", "Windows & Door Contractor"]
};

const INDIAN_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Bhubaneswar", "Noida", "Kochi"].sort();

export const ProRegistration = () => {
  const { user, loading: authLoading } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const BIO_LIMIT = 300;

  const [formData, setFormData] = useState({
    name: "", email: "", category: "House Contractor", years_of_experience: 0, 
    city: "", area: "", contact_number: "", whatsapp_number: "", bio: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setFormData(data);
        setIsExisting(true);
        setAgreed(true); // Auto-agree for existing profiles
      }
    };
    if (!authLoading) loadProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast("Session expired. Please sign in again.", "error");
    if (!agreed) return showToast("Please agree to the disclaimer to proceed.", "error");
    
    setLoading(true);
    showToast("Connecting to database...", "info"); // Feedback for the "delay"

    try {
      const payload = { ...formData, user_id: user.id };
      const { error } = isExisting 
        ? await supabase.from('professionals').update(payload).eq('user_id', user.id)
        : await supabase.from('professionals').insert(payload);

      if (error) throw error;
      showToast(isExisting ? "Profile updated successfully!" : "Profile submitted for verification!", "success");
      setIsExisting(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete your professional profile? records will be removed! This action cannot be undone.");
    if (!isConfirmed || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('professionals').delete().eq('user_id', user.id);
      if (error) throw error;
      showToast("Listing deleted and records removed from database.", "success");
      navigate("/directory");
    } catch (err: any) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="p-20 text-center font-bold text-gray-400">Verifying session...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-10">
      <Link to="/" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-2 transition-colors uppercase tracking-widest">
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      <Card title={isExisting ? "Manage Your Listing" : "Register as a Professional"}>
        {isExisting && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Remove Public Listing</p>
              <p className="text-[10px] text-red-600 mt-0.5">This will permanently delete your records from our database.</p>
            </div>
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading}
              className="px-4 py-2 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              {loading ? "Deleting..." : "Delete Profile"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Full Name / Business Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Business Email *" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="For Verification" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase ml-1">Professional Category *</label>
              <select className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/30 text-sm focus:border-primary outline-none focus:bg-white transition-all" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                {Object.entries(GROUPED_CATEGORIES).map(([group, cats]) => (
                  <optgroup label={group} key={group}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <Input label="Years of Experience (Optional)" type="number" value={formData.years_of_experience} onChange={e => setFormData({...formData, years_of_experience: parseInt(e.target.value) || 0})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase ml-1">City *</label>
              <select className="w-full p-3.5 border-2 border-gray-100 rounded-xl bg-gray-50/30 text-sm focus:border-primary outline-none focus:bg-white transition-all" 
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required>
                <option value="">Select City</option>
                {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <Input label="Area / Locality (Optional)" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="e.g. Whitefield" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Contact Number *" icon="fas fa-phone" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} required />
            <Input label="WhatsApp Number (Optional)" icon="fab fa-whatsapp" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Professional Bio & Services (Optional)</label>
              <span className={`text-[10px] font-bold ${formData.bio.length >= BIO_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.bio.length}/{BIO_LIMIT}
              </span>
            </div>
            <textarea 
              className="w-full p-4 border-2 border-gray-100 rounded-xl h-32 text-sm focus:border-primary outline-none resize-none bg-gray-50/30 focus:bg-white transition-all" 
              placeholder="Describe your specializations..." 
              maxLength={BIO_LIMIT}
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
            />
          </div>

          {/* Disclaimer & Checklist */}
          <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100 space-y-3">
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="disclaimer" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="disclaimer" className="text-[11px] text-gray-600 leading-relaxed cursor-pointer font-medium">
                I agree to the HDE terms and conditions. I understand that HDE is strictly a platform for connectivity; 
                I am an individual professional providing services based on my own experience and am not legally 
                partnered with or related to HDE.
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            isLoading={loading} 
            disabled={!agreed}
            className="w-full py-4 text-lg shadow-xl shadow-primary/20"
          >
            {loading ? "Processing Submission..." : isExisting ? "Update Profile Details" : "Submit Profile for Verification"}
          </Button>
          
          <p className="text-[10px] text-center text-gray-400">
            * Once submitted, an Admin may contact you to verify your credentials before the verified badge is awarded.
          </p>
        </form>
      </Card>
    </div>
  );
};

export default ProRegistration;