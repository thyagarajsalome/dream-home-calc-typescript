// src/features/directory/ProCard.tsx
import React from 'react';
import { Card } from '../../components/ui/Card';
import { Professional } from '../../types/directory';
import { useUser } from '../../context/UserContext';
import { Link } from 'react-router-dom';

interface ProCardProps {
  pro: Professional;
}

export const ProCard: React.FC<ProCardProps> = ({ pro }) => {
  const { user } = useUser(); // Access auth state

  return (
    <Card className="h-full flex flex-col group hover:border-primary/40 transition-all duration-300">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-secondary border border-gray-100">
          {pro.profile_pic_url ? (
            <img src={pro.profile_pic_url} alt={pro.name} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <i className="fas fa-user-tie text-2xl opacity-40"></i>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-800 truncate flex items-center gap-1">
            {pro.name}
            {pro.is_verified && <i className="fas fa-check-circle text-primary text-[10px]" title="Verified"></i>}
          </h3>
          <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{pro.category}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <i className="fas fa-location-dot text-[10px]"></i> {pro.city}{pro.area ? `, ${pro.area}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6 flex-grow">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded-lg">
          <i className="fas fa-briefcase text-primary"></i>
          <span>{pro.years_of_experience}+ Years Experience</span>
        </div>
        
        {/* Actual Numbers - Only shown to signed-in users */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {user ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-phone text-primary"></i> {pro.contact_number}
              </p>
              {pro.whatsapp_number && (
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-green-500"></i> {pro.whatsapp_number}
                </p>
              )}
            </div>
          ) : (
            <Link to="/signin" className="text-[10px] font-bold text-primary hover:underline">
              <i className="fas fa-lock mr-1"></i> Sign in to view actual contact numbers
            </Link>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-50 flex gap-2">
        <a 
          href={user ? `tel:${pro.contact_number}` : "#"}
          onClick={(e) => !user && e.preventDefault()}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${user ? "bg-secondary text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          <i className="fas fa-phone"></i> Call
        </a>
        {pro.whatsapp_number && (
          <a 
            href={user ? `https://wa.me/${pro.whatsapp_number.replace(/\D/g, '')}` : "#"}
            target={user ? "_blank" : undefined}
            rel="noopener noreferrer"
            onClick={(e) => !user && e.preventDefault()}
            className={`w-12 flex items-center justify-center rounded-xl transition-colors ${user ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`}
          >
            <i className="fab fa-whatsapp text-lg"></i>
          </a>
        )}
      </div>
    </Card>
  );
};