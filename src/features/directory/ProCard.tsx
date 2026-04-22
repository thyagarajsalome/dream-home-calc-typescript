// src/features/directory/ProCard.tsx
import React from 'react';
import { Card } from '../../components/ui/Card';
import { Professional } from '../../types/directory';
import { useUser } from '../../context/UserContext'; // To protect sensitive contact data
import { Link } from 'react-router-dom';

interface ProCardProps {
  pro: Professional;
}

export const ProCard: React.FC<ProCardProps> = ({ pro }) => {
  const { user } = useUser(); // Access auth state to protect email and numbers

  return (
    <Card className="h-full flex flex-col group hover:border-primary/40 transition-all duration-300 relative">
      <div className="flex items-start gap-4 mb-5">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-secondary border border-gray-100 group-hover:scale-105 transition-transform duration-300">
            {pro.profile_pic_url ? (
              <img src={pro.profile_pic_url} alt={pro.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <i className="fas fa-user-tie text-2xl opacity-40"></i>
            )}
          </div>
          
          {/* UPDATED: Larger, Stylish, Green Verified Badge overlay */}
          {pro.is_verified && (
            <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1.5 shadow-lg border-2 border-white scale-100 group-hover:scale-110 transition-transform duration-300" title="HDE Verified Professional">
              <i className="fas fa-check text-white text-[11px] font-bold"></i>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-grow">
          <h3 className="font-bold text-gray-800 truncate flex items-center gap-1 leading-tight">
            {pro.name}
          </h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{pro.category}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
            <i className="fas fa-location-dot text-[10px]"></i> {pro.city}{pro.area ? `, ${pro.area}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-grow">
        {/* Experience Label */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg w-fit">
          <i className="fas fa-briefcase text-primary"></i>
          <span>{pro.years_of_experience}+ Years Exp.</span>
        </div>
        
        {/* Professional Bio & Services Section */}
        {pro.bio && (
          <div className="mt-3">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Services & Bio</p>
             <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed italic">
               "{pro.bio}"
             </p>
          </div>
        )}
        
        {/* Contact Details (Numbers AND Email) - Only shown to signed-in users */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          {user ? (
            <div className="space-y-2.5">
              {/* Added Email display - Protected from public scraping */}
              <p className="text-xs font-bold text-gray-700 flex items-center gap-2 truncate" title={pro.email}>
                <i className="fas fa-envelope text-primary w-4 text-center"></i> {pro.email}
              </p>
              
              <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-phone text-primary w-4 text-center"></i> {pro.contact_number}
              </p>
              
              {pro.whatsapp_number && (
                <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-green-500 w-4 text-center"></i> {pro.whatsapp_number}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-center">
              <Link to="/signin" className="text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1.5">
                <i className="fas fa-lock"></i> Sign in to view email and contact numbers
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons with permission check */}
      <div className="pt-4 border-t border-gray-50 flex gap-2">
        <a 
          href={user ? `tel:${pro.contact_number}` : "#"}
          onClick={(e) => !user && e.preventDefault()}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${user ? "bg-secondary text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          <i className="fas fa-phone"></i> Call
        </a>
        {pro.whatsapp_number && (
          <a 
            href={user ? `https://wa.me/${pro.whatsapp_number.replace(/\D/g, '')}` : "#"}
            target={user ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={(e) => !user && e.preventDefault()}
            className={`w-12 flex items-center justify-center rounded-xl transition-all ${user ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`}
          >
            <i className="fab fa-whatsapp text-lg"></i>
          </a>
        )}
      </div>
    </Card>
  );
};