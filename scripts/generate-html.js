// scripts/generate-html.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to ensure directory exists
function ensureDirExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirExists(dirname);
  fs.mkdirSync(dirname);
}

// -------------------------------------------------------------
// 1. Shared Static HTML Snippets
// -------------------------------------------------------------

const headerHtml = `
<header class="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
  <div class="container mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <div class="flex-shrink-0 flex items-center">
        <a href="/" class="flex items-center gap-2 text-2xl font-bold text-secondary dark:text-zinc-100 hover:text-primary transition-colors no-underline">
          <img src="/bg-logo.png" alt="HDE Logo" class="w-12 h-12 object-contain" />
          <span class="text-primary font-extrabold">HDE</span>
        </a>
      </div>
      <nav class="hidden md:flex items-center space-x-8">
        <a href="/" class="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">Home</a>
        <a href="/directory" class="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">Find Professionals</a>
        <a href="/plans" class="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">House Plans</a>
        <a href="/signin" class="px-5 py-2 text-sm font-medium text-white dark:text-zinc-950 bg-primary rounded-full shadow-md hover:shadow-lg transition-all no-underline">Sign In</a>
      </nav>
      <div class="md:hidden flex items-center">
        <button class="text-gray-600 dark:text-zinc-400 hover:text-primary focus:outline-none p-2 cursor-pointer">
          <i class="fas fa-bars text-xl"></i>
        </button>
      </div>
    </div>
  </div>
</header>
`;

const heroHtml = `
<section id="home" class="relative w-full h-[30vh] lg:h-[65vh] overflow-hidden flex items-center justify-center bg-secondary">
  <div class="hero-content relative z-10 container mx-auto px-4 text-center">
    <a href="#tools" class="inline-flex items-center gap-2 md:gap-3 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 text-base md:py-4 md:px-10 md:text-lg rounded-full shadow-2xl transform hover:-translate-y-1 transition-all duration-300 no-underline">
      Start Calculating
      <i class="fas fa-arrow-down text-sm"></i>
    </a>
  </div>
</section>
`;

const faqHtml = `
<section id="faq" class="py-16 bg-gray-50 border-t border-gray-100">
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="text-3xl font-extrabold text-center text-secondary mb-12">Frequently Asked Questions</h2>
    <div class="space-y-4">
      <details class="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
        <summary class="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
          <span>How accurate is this calculator?</span>
          <span class="transition-transform duration-300 group-open:rotate-180 text-primary">
            <i class="fas fa-chevron-down"></i>
          </span>
        </summary>
        <p class="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
          This tool provides a preliminary estimate based on generalized industry averages in India. Actual costs will vary based on your city, specific material choices, labor rates, and architectural complexity. Always consult a professional contractor for a detailed quote.
        </p>
      </details>
      <details class="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
        <summary class="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
          <span>What is included in the "Pro" version?</span>
          <span class="transition-transform duration-300 group-open:rotate-180 text-primary">
            <i class="fas fa-chevron-down"></i>
          </span>
        </summary>
        <p class="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
          Upgrading to a Pro plan (unlocked by purchasing credit packages starting from ₹199) unlocks all specialized calculators (Materials BOQ, Flooring, Painting, Plumbing, Electrical, Interiors, Doors & Windows), enables Standard & Premium quality estimates in the main construction calculator, and removes all restrictions on saving or sharing reports.
        </p>
      </details>
      <details class="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
        <summary class="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
          <span>What costs are NOT included in the estimate?</span>
          <span class="transition-transform duration-300 group-open:rotate-180 text-primary">
            <i class="fas fa-chevron-down"></i>
          </span>
        </summary>
        <p class="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
          The estimate covers core construction and finishing. It does not include the cost of land, architectural fees, government permits, utility connections, interior furnishings (furniture, appliances), landscaping, or boundary walls.
        </p>
      </details>
      <details class="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
        <summary class="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
          <span>How does my location affect the cost?</span>
          <span class="transition-transform duration-300 group-open:rotate-180 text-primary">
            <i class="fas fa-chevron-down"></i>
          </span>
        </summary>
        <p class="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
          Costs differ significantly between cities. Metropolitan areas like Mumbai, Delhi, or Bengaluru have higher labor and material costs compared to smaller towns. Our calculator provides a general average; please adjust for your local market.
        </p>
      </details>
      <details class="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
        <summary class="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
          <span>Can I use the specialized calculators without a Pro account?</span>
          <span class="transition-transform duration-300 group-open:rotate-180 text-primary">
            <i class="fas fa-chevron-down"></i>
          </span>
        </summary>
        <p class="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
          The basic Construction, Loan EMI, and Eligibility calculators are free to use. To access the specialized calculators for Interiors, Doors & Windows, Flooring, Painting, Plumbing, Electrical, and Materials BOQ, you will need to upgrade to a Pro account.
        </p>
      </details>
    </div>
  </div>
</section>
`;

const testimonialsHtml = `
<section class="bg-gray-900 py-16 overflow-hidden">
  <div class="container mx-auto px-4 mb-10 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-2">Trusted by Home Builders</h2>
    <p class="text-primary font-medium tracking-widest uppercase text-sm">Real feedback from across India</p>
  </div>
  <div class="flex w-full overflow-hidden group">
    <div class="flex animate-marquee whitespace-nowrap py-4 pause-on-hover">
      <div class="inline-block mx-4 w-80 md:w-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl whitespace-normal align-top">
        <div class="flex items-center gap-1 text-primary mb-3">
          <i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4 italic">"The construction calculator is spot on. It saved me from a major budgeting error during my foundation phase."</p>
        <div class="border-t border-gray-700 pt-3">
          <p class="text-white font-bold text-sm m-0">Anand Sharma</p>
          <p class="text-gray-500 text-xs uppercase tracking-tighter m-0 mt-0.5">Delhi, India</p>
        </div>
      </div>
      <div class="inline-block mx-4 w-80 md:w-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl whitespace-normal align-top">
        <div class="flex items-center gap-1 text-primary mb-3">
          <i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4 italic">"I love the house plans collection! The compliant designs helped us finalize our dream home layout."</p>
        <div class="border-t border-gray-700 pt-3">
          <p class="text-white font-bold text-sm m-0">Manjunatha R</p>
          <p class="text-gray-500 text-xs uppercase tracking-tighter m-0 mt-0.5">Bengaluru, India</p>
        </div>
      </div>
      <div class="inline-block mx-4 w-80 md:w-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl whitespace-normal align-top">
        <div class="flex items-center gap-1 text-primary mb-3">
          <i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4 italic">"HDE's material BOQ tool is a game changer for contractors. The brand recommendations are very practical."</p>
        <div class="border-t border-gray-700 pt-3">
          <p class="text-white font-bold text-sm m-0">Vikram Rao</p>
          <p class="text-gray-500 text-xs uppercase tracking-tighter m-0 mt-0.5">Hyderabad, India</p>
        </div>
      </div>
      <div class="inline-block mx-4 w-80 md:w-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl whitespace-normal align-top">
        <div class="flex items-center gap-1 text-primary mb-3">
          <i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i><i class="fas fa-star text-xs"></i>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed mb-4 italic">"The interior cost estimator helped us plan our 3BHK renovation perfectly without any hidden surprises."</p>
        <div class="border-t border-gray-700 pt-3">
          <p class="text-white font-bold text-sm m-0">Sneha Patil</p>
          <p class="text-gray-500 text-xs uppercase tracking-tighter m-0 mt-0.5">Mumbai, India</p>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const footerHtml = `
<footer class="footer bg-white border-t border-gray-100 pt-8 pb-4">
  <div class="container mx-auto px-4">
    <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-6">
      
      <div class="flex-1 space-y-4 text-center md:text-left">
        <a href="/" class="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-secondary mb-4 no-underline hover:text-primary transition-colors">
          <img src="/bg-logo.png" alt="HDE Logo" class="w-10 h-10 object-contain" />
          <span class="text-primary uppercase tracking-tighter font-extrabold text-2xl">HDE</span>
        </a>
        <p class="text-gray-500 text-sm max-w-md mx-auto md:mx-0">
          India's leading platform for construction cost estimation, material BOQ reports, and modern architectural house planning.
        </p>
        
        <div class="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-1 text-sm font-medium pt-1">
          <a href="/contact" class="text-gray-500 hover:text-primary transition-colors no-underline">Contact Us</a>
          <span class="text-gray-300">|</span>
          <a href="/disclaimer" class="text-gray-500 hover:text-primary transition-colors no-underline">Disclaimer</a>
          <span class="text-gray-300">|</span>
          <a href="/privacy" class="text-gray-500 hover:text-primary transition-colors no-underline">Privacy Policy</a>
          <span class="text-gray-300">|</span>
          <a href="/terms" class="text-gray-500 hover:text-primary transition-colors no-underline">Terms of Service</a>
        </div>
      </div>

      <div class="flex flex-col items-center md:items-end shrink-0 w-full md:w-auto">
        <h4 class="font-bold text-gray-800 mb-3 uppercase text-xs tracking-widest text-center md:text-right">Get Our Mobile Apps</h4>
        <div class="flex flex-wrap md:flex-col gap-2 justify-center">
          <a href="https://play.google.com/store/apps/details?id=in.toolwebsite.twa" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black hover:scale-[1.02] transition-all border border-gray-700 w-44 no-underline text-left">
            <i class="fab fa-google-play text-lg text-primary font-bold"></i>
            <div>
              <p class="text-[8px] uppercase font-bold text-gray-400 leading-none m-0">Download App</p>
              <p class="text-xs font-bold m-0 mt-0.5">HDE</p>
            </div>
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.aihomedecorator.twa&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black hover:scale-[1.02] transition-all border border-gray-700 w-44 no-underline text-left">
            <i class="fab fa-google-play text-lg text-green-400 font-bold"></i>
            <div>
              <p class="text-[8px] uppercase font-bold text-gray-400 leading-none m-0">Download App</p>
              <p class="text-xs font-bold m-0 mt-0.5">AI Home Decorator</p>
            </div>
          </a>
        </div>
      </div>
    </div>
    
    <div class="border-t border-gray-100 pt-4 mt-4 mb-4">
      <h4 class="font-bold text-gray-800 mb-2 uppercase text-xs tracking-widest text-center">House Construction Costs By City</h4>
      <div class="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-sm font-medium">
        <a href="/cost/construction-in-mumbai" class="text-gray-500 hover:text-primary transition-colors no-underline">Mumbai</a>
        <span class="hidden md:inline text-gray-300">|</span>
        <a href="/cost/construction-in-bengaluru" class="text-gray-500 hover:text-primary transition-colors no-underline">Bengaluru</a>
        <span class="hidden md:inline text-gray-300">|</span>
        <a href="/cost/construction-in-delhi-ncr" class="text-gray-500 hover:text-primary transition-colors no-underline">Delhi NCR</a>
        <span class="hidden md:inline text-gray-300">|</span>
        <a href="/cost/construction-in-chennai" class="text-gray-500 hover:text-primary transition-colors no-underline">Chennai</a>
        <span class="hidden md:inline text-gray-300">|</span>
        <a href="/cost/construction-in-hyderabad" class="text-gray-500 hover:text-primary transition-colors no-underline">Hyderabad</a>
        <span class="hidden md:inline text-gray-300">|</span>
        <a href="/cost/construction-in-pune" class="text-gray-500 hover:text-primary transition-colors no-underline">Pune</a>
      </div>
    </div>
    
    <div class="border-t border-gray-100 pt-4 text-center max-w-4xl mx-auto">
      <p class="text-gray-400 text-[10px] leading-relaxed mb-2">
        Disclaimer: Home Design English (HDE) is an independent budget calculation and estimation platform. All rates, material quantities, and cost estimates provided are approximate projections for general guidance only. HDE does not provide building contractor services, architectural supervision, or physical construction works. Users should verify final quotes and structural designs with licensed local builders and engineers before commencing actual construction.
      </p>
      <p class="text-gray-400 text-xs font-medium">
        &copy; 2025 Home Design English (HDE). All rights reserved.
      </p>
    </div>
  </div>
</footer>
`;

const loadingSkeletonHtml = `
<div class="container mx-auto px-4 py-8 max-w-7xl">
  <div class="flex flex-col justify-center items-center min-h-[600px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p class="text-gray-400 font-medium text-sm">Loading HDE Tools...</p>
  </div>
</div>
`;

// Base HTML Shell Template
function makeHtmlShell({ title, description, canonical, schemas = [], bodyContent, image = "https://homedesignenglish.com/bg-logo.png" }) {
  const schemaScripts = schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n    ');
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="p:domain_verify" content="80b699c05b55f8981cec0c1e0d20172d"/>
    <meta name="google-site-verification" content="j0tDFreq7BZOn79uEWGW5K_70WrkdIr8GCnJRcC57MA" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#ffffff" />
    
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonical}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${image}" />

    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
    <link rel="icon" type="image/png" href="/bg-logo.png" />
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" as="style">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    ${schemaScripts}
  </head>
  <body class="bg-background text-zinc-900 min-h-screen flex flex-col font-sans">
    <div id="root">${bodyContent}</div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

// -------------------------------------------------------------
// 2. City Definitions & Content
// -------------------------------------------------------------

const cities = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
];

function generateCityContentHtml(city) {
  return `
  <!-- Localized SEO Banner/Heading Section -->
  <section class="bg-gradient-to-br from-secondary via-zinc-950 to-secondary text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-primary/20">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-6">
        <div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4 uppercase tracking-wider">
            Localized Building Cost Guide
          </span>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-100 tracking-tight">
            House Construction Cost in <span class="text-primary">${city.cityName}</span>, ${city.stateName}
          </h1>
          <p class="mt-3 text-stone-300 max-w-3xl text-sm sm:text-base leading-relaxed">
            Estimate the complete residential construction cost including materials, finishes, MEP fitting, and designer fees in ${city.cityName}. Try our dynamic builder-funnel calculators below.
          </p>
        </div>
        <div class="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-xl">
          <h3 class="text-xs font-bold text-primary uppercase tracking-wider mb-3">⚡ Quick Stats for ${city.cityName}</h3>
          <ul class="space-y-2.5 text-xs text-stone-300">
            <li class="flex justify-between border-b border-white/10 pb-1.5">
              <span>Basic Rate:</span>
              <span class="font-bold text-stone-200">${city.basicRate}</span>
            </li>
            <li class="flex justify-between border-b border-white/10 pb-1.5">
              <span>Standard Rate:</span>
              <span class="font-bold text-stone-200">${city.standardRate}</span>
            </li>
            <li class="flex justify-between border-b border-white/10 pb-1.5">
              <span>Premium Rate:</span>
              <span class="font-bold text-stone-200">${city.premiumRate}</span>
            </li>
            <li class="flex justify-between">
              <span>Soil Condition:</span>
              <span class="font-bold text-primary">Localized</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Rich Statically Rendered Localized Content Section for search crawlers -->
  <section class="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div class="lg:col-span-2 space-y-8">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-stone-900">
          Understanding Building Costs in ${city.cityName}
        </h2>
        
        <p class="text-stone-600 text-sm sm:text-base leading-relaxed">
          Building a home in <strong>${city.cityName}</strong> requires navigating specific local market factors. Ready-mix concrete (RMC) availability, local sand excavation bans, and varying transport/logistics rules directly impact the raw materials pricing. Over the past 12 months, standard steel rates and premium grade 53 OPC cement prices have witnessed slight volatility, making accurate estimation critical before breaking ground.
        </p>

        <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h3 class="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
            <span class="text-xl">📍</span> Key Neighborhoods We Estimate:
          </h3>
          <p class="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
            Our cost calculators support projects in all prime sectors including ${city.neighborhoods}. Whether you are constructing a high-rise duplex or a private luxury villa, local logistics charges are accounted for.
          </p>
          <div class="h-px bg-stone-100 my-4"></div>
          <h3 class="text-lg font-bold text-stone-800 mb-3 flex items-center gap-2">
            <span class="text-xl">🏗️</span> Substructure & Soil Report:
          </h3>
          <p class="text-stone-600 text-xs sm:text-sm leading-relaxed">
            ${city.soilType} It is always recommended to perform a local soil testing survey to customize column steel sizing and depth.
          </p>
        </div>

        <h3 class="text-xl font-extrabold text-stone-950">Local Approvals & Construction Norms</h3>
        <p class="text-stone-600 text-sm leading-relaxed">
          Before initiating building work in ${city.cityName}, ensure you secure all necessary municipal approvals (like building plan sanctions, local water line connections, and electrical sub-meter clearances). These clearances usually require structural drawings prepared by registered local structural engineers to guarantee safety.
        </p>
      </div>

      <div class="bg-stone-900 text-stone-100 p-8 rounded-3xl border border-stone-800 flex flex-col justify-between">
        <div>
          <span class="text-amber-400 text-xs font-bold uppercase tracking-widest">💡 Expert Advice</span>
          <h3 class="text-xl font-bold mt-2 mb-4 text-stone-100">Builder Margin Control</h3>
          <p class="text-stone-400 text-sm leading-relaxed mb-6">
            Contractors typically charge a markup of 10% to 20% on materials and labor. By upgrading to <strong>HDE Pro</strong>, you can configure your exact contractor margin, generating white-label PDFs that hide raw profit margins from clients—ensuring clean client relationships.
          </p>
        </div>
        <div class="p-4 bg-stone-800 rounded-2xl border border-stone-700 text-xs text-stone-300">
          <strong>Tip:</strong> Share inputs automatically between the flooring, plumbing, electrical, and structural calculators by using the top tabs sequence.
        </div>
      </div>
    </div>
  </section>
  `;
}

// -------------------------------------------------------------
// 3. Write Home and SPA Pages
// -------------------------------------------------------------

// WebApplication Schema
const homeWebAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "HDE - Dream Home Construction & Interior Cost Calculator",
  "description": "Calculate your dream home construction, materials BOQ, interior design, flooring, and MEP utility costs in India accurately with builder mode controls.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
};

// FAQ Schema (used on Home and Cities)
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How accurate is this calculator?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "This tool provides a preliminary estimate based on generalized industry averages in India. Actual costs will vary based on your city, specific material choices, labor rates, and architectural complexity. Always consult a professional contractor for a detailed quote."
      }
    },
    {
      "@type": "Question",
      "name": "What is included in the \"Pro\" version?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Upgrading to a Pro plan (available as a monthly or annual subscription) unlocks all specialized calculators (Materials BOQ, Flooring, Painting, Plumbing, Electrical, Interiors, Doors & Windows), enables Standard & Premium quality estimates in the main construction calculator, and removes all restrictions on saving or sharing reports."
      }
    },
    {
      "@type": "Question",
      "name": "What costs are NOT included in the estimate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The estimate covers core construction and finishing. It does not include the cost of land, architectural fees, government permits, utility connections, interior furnishings (furniture, appliances), landscaping, or boundary walls."
      }
    },
    {
      "@type": "Question",
      "name": "How does my location affect the cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Costs differ significantly between cities. Metropolitan areas like Mumbai, Delhi, or Bengaluru have higher labor and material costs compared to smaller towns. Our calculator provides a general average; please adjust for your local market."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use the specialized calculators without a Pro account?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The basic Construction, Loan EMI, and Eligibility calculators are free to use. To access the specialized calculators for Interiors, Doors & Windows, Flooring, Painting, Plumbing, Electrical, and Materials BOQ, you will need to upgrade to a Pro account."
      }
    }
  ]
};

const pagesToGenerate = [
  {
    filePath: 'index.html',
    title: 'HDE - Dream Home Construction & Interior Cost Calculator',
    description: 'Calculate your dream home construction, materials BOQ, interior design, flooring, and MEP utility costs in India accurately with builder mode controls.',
    canonical: 'https://homedesignenglish.com/',
    schemas: [homeWebAppSchema, faqSchema],
    bodyContent: `${headerHtml}<main class="flex-grow">${heroHtml}${loadingSkeletonHtml}${faqHtml}${testimonialsHtml}</main>${footerHtml}`
  },
  {
    filePath: '404.html',
    title: 'Page Not Found | HDE',
    description: 'The requested page was not found.',
    canonical: 'https://homedesignenglish.com/404',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'plans/index.html',
    title: 'House Plan Gallery & Designs | HDE',
    description: 'Browse modern architectural house plans and compliant designs.',
    canonical: 'https://homedesignenglish.com/plans',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'directory/index.html',
    title: 'Find Verified Construction Professionals | HDE',
    description: 'Connect with architects, designers, and builders in India.',
    canonical: 'https://homedesignenglish.com/directory',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'signin/index.html',
    title: 'Sign In | HDE',
    description: 'Access your HDE account.',
    canonical: 'https://homedesignenglish.com/signin',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'signup/index.html',
    title: 'Sign Up | HDE',
    description: 'Create a free HDE account.',
    canonical: 'https://homedesignenglish.com/signup',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'upgrade/index.html',
    title: 'Upgrade to Pro | HDE',
    description: 'Unlock premium calculators and BOQ reports.',
    canonical: 'https://homedesignenglish.com/upgrade',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'register-pro/index.html',
    title: 'Register as Professional | HDE',
    description: 'Join our directory of construction pros.',
    canonical: 'https://homedesignenglish.com/register-pro',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'privacy/index.html',
    title: 'Privacy Policy | HDE',
    description: 'Our privacy policy.',
    canonical: 'https://homedesignenglish.com/privacy',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'terms/index.html',
    title: 'Terms of Service | HDE',
    description: 'Our terms of service.',
    canonical: 'https://homedesignenglish.com/terms',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'contact/index.html',
    title: 'Contact Us | HDE',
    description: 'Get in touch with the HDE team.',
    canonical: 'https://homedesignenglish.com/contact',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'disclaimer/index.html',
    title: 'Disclaimer | HDE',
    description: 'Legal disclaimer.',
    canonical: 'https://homedesignenglish.com/disclaimer',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'dashboard/index.html',
    title: 'Pro Dashboard | HDE',
    description: 'Manage your projects and reports.',
    canonical: 'https://homedesignenglish.com/dashboard',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  },
  {
    filePath: 'app/index.html',
    title: 'Download HDE Construction App | Smart Cost Estimator & Planning',
    description: 'Get the HDE Construction App for Android. Calculate building costs, estimate materials BOQ lists, browse modern house designs, and connect with verified local professionals.',
    canonical: 'https://homedesignenglish.com/app',
    image: 'https://homedesignenglish.com/promo/01.webp',
    schemas: [],
    bodyContent: `${headerHtml}<main class="flex-grow">${loadingSkeletonHtml}</main>${footerHtml}`
  }
];

// Write the primary pages
pagesToGenerate.forEach(p => {
  const fullPath = path.join(projectRoot, p.filePath);
  ensureDirExists(fullPath);
  const html = makeHtmlShell({
    title: p.title,
    description: p.description,
    canonical: p.canonical,
    schemas: p.schemas,
    bodyContent: p.bodyContent,
    image: p.image
  });
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`Generated: ${p.filePath}`);
});

// -------------------------------------------------------------
// 4. Write City Landing Pages
// -------------------------------------------------------------
cities.forEach(city => {
  const filePath = `cost/construction-in-${city.slug}/index.html`;
  const fullPath = path.join(projectRoot, filePath);
  
  const title = `House Construction Cost in ${city.cityName} - calculator & rates per sq.ft`;
  const canonical = `https://homedesignenglish.com/cost/construction-in-${city.slug}`;
  
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `House Construction Cost Calculator in ${city.cityName}`,
    "description": city.metaDesc,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://homedesignenglish.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Construction Cost in ${city.cityName}`,
        "item": canonical
      }
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "HDE Construction Services",
    "image": "https://homedesignenglish.com/bg-logo.png",
    "telephone": "+91-XXXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.cityName,
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "City",
      "name": city.cityName
    },
    "priceRange": "₹₹₹"
  };

  const cityBodyContent = `
    ${headerHtml}
    <main class="flex-grow">
      ${heroHtml}
      ${loadingSkeletonHtml}
      ${generateCityContentHtml(city)}
      ${faqHtml}
      ${testimonialsHtml}
    </main>
    ${footerHtml}
  `;

  ensureDirExists(fullPath);
  const html = makeHtmlShell({
    title,
    description: city.metaDesc,
    canonical,
    schemas: [webAppSchema, breadcrumbSchema, localBusinessSchema, faqSchema],
    bodyContent: cityBodyContent
  });
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`Generated: ${filePath}`);
});

console.log("HTML Generation pre-build script finished successfully!");
