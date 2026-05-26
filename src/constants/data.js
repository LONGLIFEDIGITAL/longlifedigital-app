export const DEFAULT_CONTACT = { email:"support@lldhome.com", social:"@longlifedigital", website:"longlifedigital.co" };

export const CATS = [
 { id:"all", label:"All Products", icon:"✦" },
 { id:"ebook", label:"Ebooks", icon:"📖" },
 { id:"course", label:"Courses", icon:"🎓" },
 { id:"marketing", label:"Marketing Tools", icon:"📈" },
 { id:"digital", label:"Digital Products", icon:"⬡" },
 { id:"book", label:"Books", icon:"📚" },
 { id:"domain", label:"Domains", icon:"🌐" },
];

export const PROD_THEMES = {
 1:{ bg:"linear-gradient(135deg,#0a001e 0%,#1a0533 40%,#2d0f6b 70%,#1a0533 100%)",orb1:"rgba(147,51,234,0.4)",orb2:"rgba(201,150,63,0.2)",bar:"linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A,#C9963F,#7C3AED)",priceColor:"#E8C97A",tagColor:"#C084FC",icon:"🚀"},
 2:{ bg:"linear-gradient(135deg,#0a001e 0%,#1a0533 45%,#3d1580 70%,#1a0533 100%)",orb1:"rgba(147,51,234,0.35)",orb2:"rgba(201,150,63,0.15)",bar:"linear-gradient(90deg,#9333EA,#C084FC,#E8C97A,#C084FC,#9333EA)",priceColor:"#C084FC",tagColor:"#E8C97A",icon:"📋"},
 3:{ bg:"linear-gradient(135deg,#001628 0%,#002a4a 40%,#003d6b 70%,#001628 100%)",orb1:"rgba(14,165,233,0.35)",orb2:"rgba(6,182,212,0.2)",bar:"linear-gradient(90deg,#0EA5E9,#06B6D4,#38BDF8,#06B6D4,#0EA5E9)",priceColor:"#7DD3FC",tagColor:"#67E8F9",icon:"📈"},
 4:{ bg:"linear-gradient(135deg,#1a0800 0%,#2d1200 40%,#441e00 70%,#1a0800 100%)",orb1:"rgba(245,158,11,0.3)",orb2:"rgba(217,119,6,0.2)",bar:"linear-gradient(90deg,#D97706,#F59E0B,#FCD34D,#F59E0B,#D97706)",priceColor:"#FCD34D",tagColor:"#FDE68A",icon:"📚"},
 5:{ bg:"linear-gradient(135deg,#000d33 0%,#001666 40%,#001d4a 70%,#000a1a 100%)",orb1:"rgba(99,102,241,0.35)",orb2:"rgba(79,70,229,0.2)",bar:"linear-gradient(90deg,#4F46E5,#6366F1,#818CF8,#6366F1,#4F46E5)",priceColor:"#A5B4FC",tagColor:"#C7D2FE",icon:"🎓"},
 6:{ bg:"linear-gradient(135deg,#0f001a 0%,#1a0028 40%,#280040 70%,#0f001a 100%)",orb1:"rgba(167,139,250,0.3)",orb2:"rgba(139,92,246,0.2)",bar:"linear-gradient(90deg,#7C3AED,#A78BFA,#DDD6FE,#A78BFA,#7C3AED)",priceColor:"#C4B5FD",tagColor:"#DDD6FE",icon:"⬡"},
 7:{ bg:"linear-gradient(135deg,#001510 0%,#002d20 40%,#004535 70%,#001510 100%)",orb1:"rgba(16,185,129,0.3)",orb2:"rgba(201,150,63,0.2)",bar:"linear-gradient(90deg,#059669,#10B981,#C9963F,#E8C97A,#C9963F)",priceColor:"#6EE7B7",tagColor:"#A7F3D0",icon:"🏠"},
 8:{ bg:"linear-gradient(135deg,#001628 0%,#001a10 40%,#003d28 70%,#001a10 100%)",orb1:"rgba(16,185,129,0.28)",orb2:"rgba(201,150,63,0.2)",bar:"linear-gradient(90deg,#059669,#E8C97A,#10B981,#E8C97A,#059669)",priceColor:"#E8C97A",tagColor:"#6EE7B7",icon:"📖"},
 9:{ bg:"linear-gradient(135deg,#1a1000 0%,#2d1a00 40%,#3f2800 70%,#1a1000 100%)",orb1:"rgba(201,150,63,0.32)",orb2:"rgba(147,51,234,0.18)",bar:"linear-gradient(90deg,#C9963F,#E8C97A,#FFF8EC,#E8C97A,#C9963F)",priceColor:"#E8C97A",tagColor:"#FDE68A",icon:"🤖"},
 10:{ bg:"linear-gradient(135deg,#0a001e 0%,#1a0533 40%,#2d0f6b 70%,#1a0533 100%)",orb1:"rgba(147,51,234,0.4)",orb2:"rgba(201,150,63,0.2)",bar:"linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A,#C9963F,#7C3AED)",priceColor:"#E8C97A",tagColor:"#C084FC",icon:"✦"},
 11:{ bg:"linear-gradient(135deg,#001a10 0%,#003320 40%,#004d30 70%,#001a10 100%)",orb1:"rgba(16,185,129,0.32)",orb2:"rgba(201,150,63,0.22)",bar:"linear-gradient(90deg,#059669,#10B981,#E8C97A,#10B981,#059669)",priceColor:"#6EE7B7",tagColor:"#E8C97A",icon:"🏢"},
};

export const INIT_PRODUCTS = [
 {id:1,name:"AI Wealth Accelerator Bundle",cat:"course",price:497,oldPrice:997,tag:"🔥 Best Seller",rating:4.9,reviews:128,desc:"The complete system to build a profitable AI-powered business. 10-week master...",includes:"10-Week Masterclass, 1000+ AI Prompts, Marketing Templates, Brand Kit, SEO Toolkit, Email Swipe File, Community Access, Lifetime Updates.",level:"All Levels",duration:"10 Weeks",featured:true,payhipUrl:"",stripeUrl:""},
 {id:2,name:"AI Prompts for Real Estate Agents",cat:"marketing",price:37,oldPrice:74,tag:"⭐ Popular",rating:4.8,reviews:67,desc:"200 done-for-you ChatGPT prompts for realtors. Listing descriptions, client e...",includes:"200+ Prompts, 10 Categories, Listing Copy, Client Emails, Social Media, Negotiation Scripts.",level:"Beginner",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
 {id:3,name:"Migraine & Headache Tracker",cat:"digital",price:12,oldPrice:24,tag:"🏥 Health",rating:4.9,reviews:112,desc:"30-day printable migraine log with trigger tracker, medication log, monthly p...",includes:"30-Day Daily Log, Trigger Worksheet, Medication Tracker, Monthly Chart, Doctor Sheet, 60 Pages.",level:"",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
 {id:4,name:"Airbnb Host Welcome Book Template",cat:"digital",price:27,oldPrice:54,tag:"🏡 Host Fave",rating:4.8,reviews:89,desc:"Fully editable Canva welcome book template for Airbnb and vacation rental hos...",includes:"15-Page Template, Editable Canva File, House Rules, WiFi Guide, Local Area, Checkout Instructions.",level:"",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
 {id:5,name:"Kindergarten Phonics Worksheets",cat:"ebook",price:19,oldPrice:38,tag:"📚 Education",rating:4.9,reviews:134,desc:"50 printable phonics worksheets for kindergarteners ages 4-6. Covers letters ...",includes:"50 Worksheets, Letters A-Z, Tracing Pages, Beginning Sounds, Short Vowels, Answer Key, Certificate.",level:"Ages 4-6",duration:"",featured:false,payhipUrl:"",stripeUrl:""},
 {id:6,name:"Freelancer Business Notion Template",cat:"digital",price:37,oldPrice:74,tag:"💼 Pro Tool",rating:4.7,reviews:56,desc:"Complete Notion workspace for freelancers. Client CRM, project tracker, invoi...",includes:"Client CRM, Project Tracker, Invoice Log, Income Dashboard, Rate Calculator, Email Templates.",level:"",duration:"",featured:false,payhipUrl:"",stripeUrl:""},
 {id:7,name:"Anxiety Journal & Mood Tracker",cat:"digital",price:12,oldPrice:24,tag:"🧘 Wellness",rating:4.9,reviews:203,desc:"30-day printable anxiety journal and mood tracker. Daily check-in, trigger lo...",includes:"30-Day Daily Log, Mood Tracker, Trigger Journal, Coping Tools, Monthly Chart, 60 Pages.",level:"",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
 {id:8,name:"PLR Online Business Bundle",cat:"digital",price:67,oldPrice:134,tag:"♻️ Resell",rating:4.8,reviews:44,desc:"5 complete digital products with Private Label Rights. Rebrand and resell as ...",includes:"5 Products, Full PLR License, AI Money Guide, Social Media Checklist, Planner, Email Swipe File, Side Hustle Guide.",level:"",duration:"",featured:false,payhipUrl:"",stripeUrl:""},
 {id:9,name:"AI Money Machine Toolkit",cat:"ebook",price:47,oldPrice:197,tag:"🤖 Trending",rating:4.9,reviews:88,desc:"Complete system to make $3,000-$10,000/month selling AI products. 6 modules, ...",includes:"6 Modules, 50 Product Ideas, 30-Day Roadmap, Launch Checklist, 1000+ AI Prompts, Income Calculator.",level:"All Levels",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
 {id:10,name:"SEO Booster Pro",cat:"marketing",price:149,oldPrice:299,tag:"🔥 Hot",rating:4.7,reviews:61,desc:"Complete SEO audit and strategy kit to rank #1 on Google. 50+ checklists, key...",includes:"50+ Checklists, Keyword Templates, Technical Audit, 90-Day Plan, Link Building Guide.",level:"Intermediate",duration:"",featured:false,payhipUrl:"",stripeUrl:""},
 {id:11,name:"7 Figures, Multiple Streams: The Complete Business Stack Guide",cat:"book",price:37,oldPrice:97,tag:"🆕 New",rating:4.9,reviews:0,desc:"The modern entrepreneur's complete guide to building multiple income streams....",includes:"12 Business Models, Step-by-Step Launch Guide, 90-Day Plan, Automation System, Money Management, Avoid Mistakes Guide.",level:"All Levels",duration:"",featured:true,payhipUrl:"",stripeUrl:""},
];

export const BLOG_POSTS = [
 {id:1,title:"10 AI Prompts That Will Transform Your Business in 2024",date:"Jan 15, 2024",tag:"AI & Business",img:"📖",excerpt:"Discover the most powerful AI prompts that successful entrepreneurs use daily to save time, create content and grow revenue."},
 {id:2,title:"How to Rank #1 on Google: The Complete SEO Guide for Beginners",date:"Jan 8, 2024",tag:"SEO",img:"📈",excerpt:"A step-by-step guide to understanding SEO and implementing strategies that actually work for small business owners."},
 {id:3,title:"From Zero to $10K: The Exact Blueprint I Used to Build My Online Business",date:"Dec 28, 2023",tag:"Entrepreneurship",img:"🚀",excerpt:"Real strategies, real numbers, real results. Everything you need to know to build a profitable online business from scratch."},
];

export const EMPTY_FORM = {name:"",cat:"ebook",price:"",oldPrice:"",tag:"",desc:"",includes:"",level:"",duration:"",featured:false,payhipUrl:"",stripeUrl:"",image:"",thumbnail:"",pdfFile:"",pdfName:"",pdfSize:""};
