// src/components/layout/CityContent.tsx
import React from "react";

export interface CityData {
  slug: string;
  cityName: string;
  stateName: string;
  metaDesc: string;
  neighborhoods: string;
  soilType: string;
  basicRate: string;
  standardRate: string;
  premiumRate: string;
}

export const CITIES_DATA: Record<string, CityData> = {
  mumbai: {
    slug: 'mumbai',
    cityName: 'Mumbai',
    stateName: 'Maharashtra',
    metaDesc: 'Calculate house construction cost in Mumbai per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Mumbai.',
    neighborhoods: 'Andheri, Borivali, Thane, Navi Mumbai, Bandra, Powai',
    soilType: 'Clayey and hard basaltic rock. Requires pile foundations in coastal areas or deep footing excavation.',
    basicRate: 'Rs. 1,600 - 2,200/sqft',
    standardRate: 'Rs. 2,200 - 3,200/sqft',
    premiumRate: 'Rs. 3,200 - 4,500/sqft'
  },
  bengaluru: {
    slug: 'bengaluru',
    cityName: 'Bengaluru',
    stateName: 'Karnataka',
    metaDesc: 'Calculate house construction cost in Bengaluru per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Bengaluru.',
    neighborhoods: 'Whitefield, Indiranagar, Electronic City, HSR Layout, Yelahanka, JP Nagar',
    soilType: 'Red soil with good bearing capacity. Standard isolated footings are usually sufficient, saving foundation costs.',
    basicRate: 'Rs. 1,550 - 2,100/sqft',
    standardRate: 'Rs. 2,100 - 3,000/sqft',
    premiumRate: 'Rs. 3,000 - 4,200/sqft'
  },
  'delhi-ncr': {
    slug: 'delhi-ncr',
    cityName: 'Delhi NCR',
    stateName: 'Delhi NCR',
    metaDesc: 'Calculate house construction cost in Delhi NCR per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Delhi NCR.',
    neighborhoods: 'Gurugram, Noida, Dwarka, South Delhi, Ghaziabad, Faridabad',
    soilType: 'Alluvial sandy soil. Requires strong raft foundations or deep footings due to earthquake vulnerability (Zone IV).',
    basicRate: 'Rs. 1,500 - 2,000/sqft',
    standardRate: 'Rs. 2,000 - 2,900/sqft',
    premiumRate: 'Rs. 2,900 - 4,000/sqft'
  },
  chennai: {
    slug: 'chennai',
    cityName: 'Chennai',
    stateName: 'Tamil Nadu',
    metaDesc: 'Calculate house construction cost in Chennai per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Chennai.',
    neighborhoods: 'Adyar, OMR, Velachery, Anna Nagar, Tambaram, Porur',
    soilType: 'Clayey and sandy coastal soil. High water table requires solid plinth beams and waterproofing/treatment.',
    basicRate: 'Rs. 1,500 - 2,000/sqft',
    standardRate: 'Rs. 2,000 - 2,900/sqft',
    premiumRate: 'Rs. 2,900 - 4,000/sqft'
  },
  hyderabad: {
    slug: 'hyderabad',
    cityName: 'Hyderabad',
    stateName: 'Telangana',
    metaDesc: 'Calculate house construction cost in Hyderabad per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Hyderabad.',
    neighborhoods: 'Gachibowli, Kukatpally, Madhapur, Jubilee Hills, Secunderabad, Uppal',
    soilType: 'Hard granite rock. Excavation and site preparation cost might be higher, but foundation is highly stable.',
    basicRate: 'Rs. 1,500 - 2,000/sqft',
    standardRate: 'Rs. 2,000 - 2,950/sqft',
    premiumRate: 'Rs. 2,950 - 4,100/sqft'
  },
  pune: {
    slug: 'pune',
    cityName: 'Pune',
    stateName: 'Maharashtra',
    metaDesc: 'Calculate house construction cost in Pune per sq ft. Check local standard & premium building rates, brick wall rates, plumbing and electrical charges in Pune.',
    neighborhoods: 'Baner, Kothrud, Hinjawadi, Wakad, Hadapsar, Kharadi',
    soilType: 'Black cotton soil to hard rock. Heavy expansive soils in some regions require deep RCC columns and footings.',
    basicRate: 'Rs. 1,550 - 2,100/sqft',
    standardRate: 'Rs. 2,100 - 3,000/sqft',
    premiumRate: 'Rs. 3,000 - 4,200/sqft'
  }
};

interface CityContentProps {
  cityData: CityData;
}

export default function CityContent({ cityData }: CityContentProps) {
  const { cityName, stateName, metaDesc, neighborhoods, soilType, basicRate, standardRate, premiumRate } = cityData;

  return (
    <>
      {/* Localized SEO Banner/Heading Section */}
      <section className="bg-gradient-to-br from-secondary via-zinc-950 to-secondary text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-primary/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4 uppercase tracking-wider">
                Localized Building Cost Guide
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-100 tracking-tight">
                House Construction Cost in <span className="text-primary">{cityName}</span>, {stateName}
              </h1>
              <p className="mt-3 text-stone-300 max-w-3xl text-sm sm:text-base leading-relaxed">
                Estimate the complete residential construction cost including materials, finishes, MEP fitting, and designer fees in {cityName}. Try our dynamic builder-funnel calculators below.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-xl">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">⚡ Quick Stats for {cityName}</h3>
              <ul className="space-y-2.5 text-xs text-stone-300">
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span>Basic Rate:</span>
                  <span className="font-bold text-stone-200">{basicRate}</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span>Standard Rate:</span>
                  <span className="font-bold text-stone-200">{standardRate}</span>
                </li>
                <li className="flex justify-between border-b border-white/10 pb-1.5">
                  <span>Premium Rate:</span>
                  <span className="font-bold text-stone-200">{premiumRate}</span>
                </li>
                <li className="flex justify-between">
                  <span>Soil Condition:</span>
                  <span className="font-bold text-primary">Localized</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rich Statically Rendered Localized Content Section for search crawlers */}
      <section className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Understanding Building Costs in {cityName}
            </h2>
            
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Building a home in <strong>{cityName}</strong> requires navigating specific local market factors. Ready-mix concrete (RMC) availability, local sand excavation bans, and varying transport/logistics rules directly impact the raw materials pricing. Over the past 12 months, standard steel rates and premium grade 53 OPC cement prices have witnessed slight volatility, making accurate estimation critical before breaking ground.
            </p>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
                <span className="text-xl">📍</span> Key Neighborhoods We Estimate:
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                Our cost calculators support projects in all prime sectors including {neighborhoods}. Whether you are constructing a high-rise duplex or a private luxury villa, local logistics charges are accounted for.
              </p>
              <div className="h-px bg-stone-100 my-4"></div>
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🏗️</span> Substructure & Soil Report:
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                {soilType} It is always recommended to perform a local soil testing survey to customize column steel sizing and depth.
              </p>
            </div>

            <h3 className="text-xl font-extrabold text-stone-950">Local Approvals & Construction Norms</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Before initiating building work in {cityName}, ensure you secure all necessary municipal approvals (like building plan sanctions, local water line connections, and electrical sub-meter clearances). These clearances usually require structural drawings prepared by registered local structural engineers to guarantee safety.
            </p>
          </div>

          <div className="bg-stone-900 text-stone-100 p-8 rounded-3xl border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">💡 Expert Advice</span>
              <h3 className="text-xl font-bold mt-2 mb-4 text-stone-100">Builder Margin Control</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                Contractors typically charge a markup of 10% to 20% on materials and labor. By upgrading to <strong>HDE Pro</strong>, you can configure your exact contractor margin, generating white-label PDFs that hide raw profit margins from clients—ensuring clean client relationships.
              </p>
            </div>
            <div className="p-4 bg-stone-800 rounded-2xl border border-stone-700 text-xs text-stone-300">
              <strong>Tip:</strong> Share inputs automatically between the flooring, plumbing, electrical, and structural calculators by using the top tabs sequence.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
