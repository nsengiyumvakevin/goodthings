import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { initialProducts, money } from "../../data/demoData.js";

export default function LandingPage({ onClientSignIn, onClientRegister, onAdminSignIn }) {
  const featured = initialProducts.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fbfcf8] text-[#1c3028]">
      <header className="sticky top-0 z-30 flex min-h-19 items-center justify-between gap-6 border-b border-[#dfe6dc]/80 bg-[#fbfcf8]/95 px-5 backdrop-blur md:px-12 xl:px-22">
        <Link className="inline-flex items-center gap-2.5 text-lg font-bold leading-none text-[#1c3028] no-underline" to="/#top" aria-label="Goodthings Market home">
          <span className="grid size-8.5 place-items-center rounded-lg bg-[#e5edcf] text-[#244f3a]"><Sparkles size={17} /></span>
          <span>good<span className="font-medium text-[#55765e]">things</span><small className="mt-1 block text-[10px] font-bold text-[#53665a]">MARKET & LEDGER</small></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#56645a] md:flex" aria-label="Main navigation">
          <Link className="hover:text-[#245e46]" to="/#collection">The collection</Link>
          <Link className="hover:text-[#245e46]" to="/#how-it-works">How it works</Link>
          <Link className="hover:text-[#245e46]" to="/#for-business">For business</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="inline-flex items-center text-xs text-[#53665a] hover:text-[#245e46] sm:text-sm" onClick={onAdminSignIn}>Admin sign in</button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded bg-[#245e46] px-3 text-xs font-bold text-white hover:bg-[#194832] sm:text-sm" onClick={onClientSignIn}>Client sign in <ArrowRight size={15} /></button>
        </div>
      </header>

      <section className="mx-auto grid max-w-360 items-center gap-10 px-6 py-14 md:grid-cols-[.92fr_1.08fr] md:gap-16 md:px-12 md:py-24 xl:px-33" id="top">
        <div className="relative z-10 max-w-125">
          <div className="mb-5 flex items-center gap-2.5 text-xs font-semibold text-[#526b57]"><span className="h-px w-4.5 bg-[#a1b394]" /> Thoughtful goods. A little closer to home.</div>
          <h1 className="m-0 font-serif text-[clamp(3.5rem,7vw,5.25rem)] font-medium leading-[.99] text-[#1e3228]">Good things<br />for <em className="text-[#557b5e]">every day.</em></h1>
          <p className="mt-6 max-w-107.5 text-[15px] leading-7 text-[#56655b]">Find useful, well-made favourites for home and table. Shop with care, pay your way, and keep every order in one place.</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <button className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded border border-[#245e46] bg-[#245e46] px-4 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-[#194832]" onClick={onClientRegister}>Create your account <ArrowRight size={16} /></button>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#526a58]" to="/#collection">Explore the collection <ArrowDownRight size={16} /></Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#5e6d61]">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#6a8b6d]" /> Secure checkout</span>
            <span className="size-0.75 rounded-full bg-[#abb6aa]" />
            <span className="inline-flex items-center gap-1.5"><PackageCheck size={15} className="text-[#6a8b6d]" /> Clear order history</span>
          </div>
        </div>
        <div className="relative min-h-85 h-[min(46vw,530px)] max-md:h-[88vw] max-md:max-h-102.5" aria-label="Featured goods from Goodthings Market">
          <div className="absolute -right-4 -top-4 z-0 h-3/4 w-[78%] border border-[#d6e2d2]" />
          <img className="relative z-1 size-full rounded-sm object-cover" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1300&q=88" alt="Fresh produce and thoughtfully selected market goods" />
          <div className="absolute -bottom-2 left-0 z-10 grid w-3/4 gap-1.5 bg-[#244b39] p-4 text-white shadow-xl md:-left-6 md:bottom-5 md:w-62.5">
            <span className="text-[10px] font-bold text-[#d3e1d0]">GOOD THINGS, GATHERED</span><b className="font-serif text-base font-medium">Small choices. Better everyday rituals.</b>
          </div>
          <div className="absolute -bottom-8 right-0 z-20 flex items-center gap-2.5 bg-white p-3 text-[#526458] shadow-xl md:-right-5 md:bottom-14">
            <span className="grid size-7 place-items-center rounded-full bg-[#6c946f] text-white"><Check size={16} /></span>
            <span><b className="block text-xs text-[#384a3e]">Your next favourite</b><small className="mt-1 block text-[10px] text-[#68766c]">Ready to find its way home</small></span><ArrowUpRight size={17} className="ml-2 text-[#77877a]" />
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8ece5] bg-[#f3f5ef] px-6 py-14 md:px-12 md:py-17 xl:px-33" id="collection">
        <div className="mx-auto mb-6 flex max-w-294 items-end justify-between gap-5">
          <div><span className="text-[10px] font-bold text-[#617363]">A FEW GOOD PLACES TO START</span><h2 className="mt-2 font-serif text-3xl font-medium text-[#23382c]">Made for the everyday.</h2></div>
          <button className="inline-flex items-center gap-2 text-xs font-bold text-[#245e46]" onClick={onClientRegister}>Shop all goods <ArrowRight size={15} /></button>
        </div>
        <div className="mx-auto grid max-w-294 gap-3 md:grid-cols-3 md:gap-4.5">
          {featured.map((product) => (
            <article className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-3 border border-[#e5e9e1] bg-white p-2.5 md:grid-cols-[102px_minmax(0,1fr)]" key={product.id}>
              <img className="h-18 w-19.5 object-cover md:h-23 md:w-25.5" src={product.image_url} alt={product.name} loading="lazy" />
              <div><span className="text-[10px] text-[#647466]">{product.category}</span><h3 className="my-1.5 text-xs font-semibold text-[#34483a] md:text-[13px]">{product.name}</h3><b className="text-xs text-[#315842]">{money(product.price)}</b></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-360 gap-8 px-6 py-16 md:grid-cols-[.75fr_1.25fr] md:gap-14 md:px-12 xl:px-33" id="how-it-works">
        <div><span className="text-[10px] font-bold text-[#617363]">THOUGHTFUL FROM START TO FINISH</span><h2 className="mt-2 font-serif text-3xl font-medium text-[#23382c]">A simpler way to shop.</h2><p className="mt-3 max-w-97.5 text-[13px] leading-6 text-[#56655b]">From choosing your goods to keeping track of payment, the important details stay together.</p></div>
        <div className="grid gap-5 sm:grid-cols-3">
          <article className="border-t border-[#cfd9ce] pt-3"><span className="font-serif text-base text-[#557b5e]">01</span><h3 className="mb-2 mt-4 text-sm font-semibold text-[#304536]">Find your favourites</h3><p className="text-xs leading-5 text-[#58695d]">Browse a considered collection and add what you love to your bag.</p></article>
          <article className="border-t border-[#cfd9ce] pt-3"><span className="font-serif text-base text-[#557b5e]">02</span><h3 className="mb-2 mt-4 text-sm font-semibold text-[#304536]">Choose how to pay</h3><p className="text-xs leading-5 text-[#58695d]">Pay by mobile money or cash, or set a clear period for a debt purchase.</p></article>
          <article className="border-t border-[#cfd9ce] pt-3"><span className="font-serif text-base text-[#557b5e]">03</span><h3 className="mb-2 mt-4 text-sm font-semibold text-[#304536]">Keep it all in view</h3><p className="text-xs leading-5 text-[#58695d]">Check your purchases, balances, and return requests from your account.</p></article>
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 border-y border-[#dfe8db] bg-[#e9efe4] px-6 py-10 md:flex-row md:items-center md:px-12 xl:px-33" id="for-business">
        <div className="max-w-167.5"><span className="text-[10px] font-bold text-[#617363]">FOR THE PEOPLE BEHIND THE COUNTER</span><h2 className="mt-2 font-serif text-3xl font-medium text-[#23382c]">Run your shop with a clearer view.</h2><p className="mt-3 max-w-140 text-[13px] leading-6 text-[#56655b]">Review payments, follow up on debts, record income and expenses, and keep customer returns moving.</p></div>
        <button className="inline-flex items-center gap-2.5 rounded bg-[#294f3b] px-4 py-3 text-sm font-bold text-white hover:bg-[#194832]" onClick={onAdminSignIn}>Administrator sign in <ArrowRight size={16} /></button>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-[#5c6b60] md:px-12 xl:px-22"><Link className="inline-flex items-center gap-2 text-base font-bold text-[#1c3028]" to="/#top"><span className="grid size-8 place-items-center rounded-lg bg-[#e5edcf] text-[#244f3a]"><Sparkles size={16} /></span>good<span className="font-medium text-[#55765e]">things</span></Link><span>Considered goods for everyday living.</span><button className="inline-flex items-center gap-2 font-bold text-[#245e46]" onClick={onClientSignIn}>Your account <ArrowRight size={14} /></button></footer>
    </main>
  );
}
