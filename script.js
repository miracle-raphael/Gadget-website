
/* CONFIG: keep the Supabase publishable/anon key here. Never put a Paystack secret key in this file. */
const SUPABASE_URL = "https://nrsluftpnmmriqldxcfb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DIHR2ju_34YXFrMTCnpL5Q_Q--vLKng";
const PAYMENT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/paystack`;
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const products = [
 {id:"soundpro-x1",name:"SoundPro X1",detail:"Wireless Earbuds",price:19500,image:"images/headphones.webp",badge:"NEW"},
 {id:"pouches",name:"Premium Pouches",detail:"Smartphone Accessories",price:12500,image:"images/speaker.webp",badge:"POPULAR"},
 {id:"boommate",name:"BoomMate",detail:"Portable Bluetooth Speaker",price:45000,image:"images/speaker.webp",badge:"SALE"},
 {id:"flagship-phones",name:"Flagship Phones",detail:"Samsung • iPhone • Pixel",price:850000,image:"images/phones3.webp",badge:"HOT"}
];
const money = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n);
const toast = msg => {const t=document.getElementById("toast");t.textContent=msg;t.classList.remove("opacity-0");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.add("opacity-0"),2800)};
const showErr=(id,msg)=>{const el=document.getElementById(id);el.textContent=msg;el.classList.toggle("hidden",!msg)};
const validEmail=v=>/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v);
let cart={}; try{cart=JSON.parse(localStorage.getItem("eg_cart"))||{}}catch{}
Object.keys(cart).forEach(k=>{if(!products.some(p=>p.id===k)||!Number.isInteger(cart[k])||cart[k]<1)delete cart[k]});
const cartOverlay=document.getElementById("cartOverlay");
const productById=id=>products.find(p=>p.id===id);
function renderProducts(){
 document.getElementById("prodGrid").innerHTML=products.map(p=>`
 <article class="flex flex-col overflow-hidden rounded-2xl bg-slate-50 p-4">
  <div class="relative flex h-40 items-center justify-center"><span class="absolute left-0 top-0 rounded bg-orange-500 px-2 py-1 text-[9px] font-extrabold text-black">${p.badge}</span><img src="${p.image}" alt="${p.name}" class="h-32 w-full object-contain"></div>
  <h3 class="mt-3 text-sm font-bold">${p.name}</h3><p class="mt-1 text-xs text-slate-500">${p.detail}</p><p class="mb-3 mt-2 font-extrabold">${money(p.price)}</p>
  <button data-add="${p.id}" class="mt-auto rounded-md bg-orange-500 py-2.5 text-xs font-bold text-black hover:bg-orange-400">🛒 Add to Cart</button>
 </article>`).join("");
}
function renderCart(){
 const ids=Object.keys(cart),count=ids.reduce((s,id)=>s+cart[id],0),total=ids.reduce((s,id)=>s+productById(id).price*cart[id],0);
 document.getElementById("cartCount").textContent=count;
 document.getElementById("cartEmpty").classList.toggle("hidden",count>0);
 document.getElementById("cartFoot").classList.toggle("hidden",count===0);
 document.getElementById("cartTotal").textContent=money(total);
 document.getElementById("cartShip").textContent="Delivery fee, if applicable, will be confirmed before dispatch.";
 document.getElementById("cartList").innerHTML=ids.map(id=>{const p=productById(id);return `<div class="flex items-center gap-3 border-b py-3"><img src="${p.image}" alt="" class="h-14 w-14 object-contain"><div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">${p.name}</p><p class="text-xs text-slate-500">${money(p.price)}</p><div class="mt-2 flex items-center gap-3 text-sm"><button data-action="dec" data-id="${id}">−</button><span>${cart[id]}</span><button data-action="inc" data-id="${id}">+</button></div></div><button data-action="remove" data-id="${id}" class="text-xs text-red-500">Remove</button></div>`}).join("");
 localStorage.setItem("eg_cart",JSON.stringify(cart));
}
document.getElementById("prodGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;cart[b.dataset.add]=(cart[b.dataset.add]||0)+1;renderCart();toast("Added to cart")});
document.getElementById("cartList").addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const id=b.dataset.id;if(b.dataset.action==="inc")cart[id]++;if(b.dataset.action==="dec"){cart[id]--;if(cart[id]<=0)delete cart[id]}if(b.dataset.action==="remove")delete cart[id];renderCart()});
document.getElementById("cartBtn").onclick=()=>cartOverlay.classList.replace("hidden","flex");
function closeCart(){cartOverlay.classList.add("hidden");cartOverlay.classList.remove("flex")}
document.getElementById("cartClose").onclick=closeCart;cartOverlay.addEventListener("click",e=>{if(e.target===cartOverlay)closeCart()});
document.getElementById("clearCart").onclick=()=>{cart={};renderCart()};

/* Hero copy follows the matching product image. */
const heroCopy=[
 ["Enhance Your Gadget Style","Smart Tech. Better Everyday.","Discover innovative gadgets and accessories built for performance and style."],
 ["See Every Detail","Capture More. Experience More.","Explore smartphones designed to bring your everyday moments into focus."],
 ["Sound Without Limits","Your Music. Your Moment.","Enjoy rich, immersive audio with wireless headphones made for everyday listening."],
 ["Premium Technology","Power Meets Design.","Discover smartphones that combine sleek design, reliable performance and everyday convenience."],
 ["Experience Sound Differently","Turn Up the Sound. Feel Every Beat.","Discover powerful audio, deep bass and clear sound designed to make every moment sound better."],
 ["Level Up Your Play","Play Without Limits.","Bring your favourite games to life with powerful consoles and immersive entertainment."],
 ["Work Smarter","Power Your Next Big Idea.","Find laptops built for productivity, creativity and everyday performance."]
];
const slides=[...document.querySelectorAll("[data-slide]")],dots=document.getElementById("heroDots");
dots.innerHTML=slides.map((_,i)=>`<button data-dot="${i}" aria-label="Show slide ${i+1}" class="h-1.5 rounded-full ${i===0?"w-6 bg-orange-400":"w-1.5 bg-white/50"}"></button>`).join("");
let current=0,carouselTimer;
function showSlide(n){current=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle("opacity-100",i===current);s.classList.toggle("opacity-0",i!==current);s.classList.toggle("scale-100",i===current);s.classList.toggle("scale-90",i!==current)});document.getElementById("heroEyebrow").textContent=heroCopy[current][0];document.getElementById("heroTitle").textContent=heroCopy[current][1];document.getElementById("heroDescription").textContent=heroCopy[current][2];dots.querySelectorAll("button").forEach((d,i)=>{d.className="h-1.5 rounded-full "+(i===current?"w-6 bg-orange-400":"w-1.5 bg-white/50")})}
function startCarousel(){clearInterval(carouselTimer);carouselTimer=setInterval(()=>showSlide(current+1),3800)}
dots.addEventListener("click",e=>{const b=e.target.closest("[data-dot]");if(b){showSlide(Number(b.dataset.dot));startCarousel()}});showSlide(0);startCarousel();

/* Mobile navigation and reveal animation */
document.getElementById("menuBtn").onclick=()=>document.getElementById("mobileMenu").classList.toggle("hidden");
const revealObserver=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.remove("opacity-0","translate-y-6");revealObserver.unobserve(x.target)}}),{threshold:.1});
document.querySelectorAll(".reveal").forEach(el=>{el.classList.add("opacity-0","translate-y-6","transition","duration-700");revealObserver.observe(el)});

/* Authentication */
const authModal=document.getElementById("authModal"),userBtn=document.getElementById("userBtn"),accountMenu=document.getElementById("accountMenu");
let currentUser=null;
function setAuthTab(tab){const login=tab==="login";document.getElementById("loginForm").classList.toggle("hidden",!login);document.getElementById("signupForm").classList.toggle("hidden",login);document.getElementById("authTitle").textContent=login?"Welcome back":"Create your account";document.getElementById("authSub").textContent=login?"Log in to your e-Global account.":"Create an account to shop with e-Global";document.getElementById("tabLogin").className="flex-1 rounded-lg py-2 text-sm font-bold "+(login?"bg-orange-500":"");document.getElementById("tabSignup").className="flex-1 rounded-lg py-2 text-sm font-bold "+(!login?"bg-orange-500":"")}
function openAuth(tab="login"){accountMenu.classList.add("hidden");setAuthTab(tab);authModal.classList.remove("hidden");authModal.classList.add("flex")}
function closeAuth(){authModal.classList.add("hidden");authModal.classList.remove("flex")}
document.getElementById("authClose").onclick=closeAuth;authModal.addEventListener("click",e=>{if(e.target===authModal)closeAuth()});
document.getElementById("tabLogin").onclick=()=>setAuthTab("login");document.getElementById("tabSignup").onclick=()=>setAuthTab("signup");
function updateUser(user){currentUser=user;userBtn.textContent=user?(user.user_metadata?.full_name||user.email||"U").charAt(0).toUpperCase():"👤";userBtn.className=user?"flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-black":"rounded-full";document.getElementById("accountName").textContent=user?(user.user_metadata?.full_name||user.email):"Your account"}
userBtn.onclick=()=>{if(!currentUser)return openAuth("login");accountMenu.classList.toggle("hidden")};
document.addEventListener("click",e=>{if(!accountMenu.contains(e.target)&&e.target!==userBtn)accountMenu.classList.add("hidden")});
document.getElementById("logoutBtn").onclick=async()=>{const {error}=await sb.auth.signOut({scope:"local"});if(error)return toast(error.message);updateUser(null);accountMenu.classList.add("hidden");toast("You have been logged out")};
document.getElementById("loginForm").onsubmit=async e=>{e.preventDefault();if(!sb)return showErr("loginErr","Authentication service is unavailable. Refresh and try again.");const f=e.target, email=f.email.value.trim(),password=f.password.value;showErr("loginErr","");const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)return showErr("loginErr",error.message);updateUser(data.user);f.reset();closeAuth();toast("Welcome back")};
document.getElementById("signupForm").onsubmit=async e=>{e.preventDefault();const f=e.target;if(!sb)return showErr("signupErr","Authentication service is unavailable. Refresh and try again.");if(f.password.value!==f.confirm.value)return showErr("signupErr","Your passwords do not match.");showErr("signupErr","");const {data,error}=await sb.auth.signUp({email:f.email.value.trim(),password:f.password.value,options:{data:{full_name:f.fullname.value.trim()},emailRedirectTo:location.origin}});if(error)return showErr("signupErr",error.message);f.reset();closeAuth();if(data.session){updateUser(data.user);toast("Your account has been created")}else toast("Check your email to confirm your account")};
if(sb){sb.auth.getSession().then(({data})=>updateUser(data.session?.user||null));sb.auth.onAuthStateChange((_event,session)=>updateUser(session?.user||null))}

/* Paystack checkout: secret key stays inside the Supabase Edge Function. */
document.getElementById("checkoutBtn").onclick=async()=>{
 const items=Object.entries(cart).map(([id,qty])=>({id,qty}));
 if(!items.length)return toast("Your cart is empty");
 if(!sb)return toast("Payment service is unavailable. Please try again later.");
 const email=currentUser?.email;
 if(!email){closeCart();openAuth("login");return toast("Please log in before checkout")}
 const btn=document.getElementById("checkoutBtn");btn.disabled=true;btn.textContent="Preparing secure checkout…";
 try{
  const {data:{session}}=await sb.auth.getSession();
  const response=await fetch(PAYMENT_FUNCTION_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session.access_token}`,"apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"initialize",items})});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Could not start payment");
  if(!result.authorization_url)throw new Error("Payment link was not returned");
  location.href=result.authorization_url;
 }catch(err){toast(err.message||"Payment could not be started")}finally{btn.disabled=false;btn.textContent="Proceed to Payment"}
};

/* Payment return: verify with backend before emptying cart or showing success. */
(async()=>{
 const params=new URLSearchParams(location.search),reference=params.get("reference");
 if(!reference)return;
 history.replaceState({},document.title,location.pathname);
 if(!sb){toast("Unable to verify payment. Contact support.");return}
 try{
  const {data:{session}}=await sb.auth.getSession();if(!session)throw new Error("Please log in to verify this order.");
  const res=await fetch(PAYMENT_FUNCTION_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session.access_token}`,"apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"verify",reference})});
  const result=await res.json();if(!res.ok||result.status!=="success")throw new Error(result.error||"Payment was not confirmed.");
  cart={};renderCart();toast("Payment confirmed. Thank you for your order!");
 }catch(err){toast(err.message)}
})();

/* Newsletter: create newsletter_subscribers table and its insert policy in Supabase before enabling. */
document.getElementById("nlBtn").onclick=async()=>{const input=document.getElementById("nlEmail"),email=input.value.trim().toLowerCase();if(!validEmail(email))return toast("Enter a valid email address.");if(!sb)return toast("Newsletter service is unavailable.");const btn=document.getElementById("nlBtn");btn.disabled=true;const {error}=await sb.from("newsletter_subscribers").insert({email});btn.disabled=false;if(error?.code==="23505"){input.value="";return toast("You are already subscribed.")}if(error)return toast("Subscription failed. Please try again.");input.value="";toast("Thanks for subscribing!")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();closeAuth();accountMenu.classList.add("hidden")}});
renderProducts();renderCart();


