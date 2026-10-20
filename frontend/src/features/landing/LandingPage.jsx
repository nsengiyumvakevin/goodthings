import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { initialProducts, money } from "../../data/demoData.js";
import "./LandingPage.css";

export default function LandingPage({ onClientSignIn, onClientRegister, onAdminSignIn }) {
  const featured = initialProducts.slice(0, 3);

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Goodthings Market home">
          <span className="landing-brand-mark"><Sparkles size={17} /></span>
          <span>good<span>things</span><small>MARKET & LEDGER</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#collection">The collection</a>
          <a href="#how-it-works">How it works</a>
          <a href="#for-business">For business</a>
        </nav>
        <div className="landing-actions">
          <button className="landing-admin-link" onClick={onAdminSignIn}>Admin sign in</button>
          <button className="landing-signin" onClick={onClientSignIn}>Client sign in <ArrowRight size={15} /></button>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span /> Thoughtful goods. A little closer to home.</div>
          <h1>Good things<br />for <em>every day.</em></h1>
          <p>Find useful, well-made favourites for home and table. Shop with care, pay your way, and keep every order in one place.</p>
          <div className="landing-hero-actions">
            <button className="landing-primary" onClick={onClientRegister}>Create your account <ArrowRight size={16} /></button>
            <a className="landing-secondary" href="#collection">Explore the collection <ArrowDownRight size={16} /></a>
          </div>
          <div className="landing-proof">
            <span><ShieldCheck size={15} /> Secure checkout</span>
            <i />
            <span><PackageCheck size={15} /> Clear order history</span>
          </div>
        </div>
        <div className="landing-hero-visual" aria-label="Featured goods from Goodthings Market">
          <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1300&q=88" alt="Fresh produce and thoughtfully selected market goods" />
          <div className="landing-image-caption"><span>GOOD THINGS, GATHERED</span><b>Small choices. Better everyday rituals.</b></div>
          <div className="landing-order-note"><span className="landing-order-icon"><Check size={16} /></span><span><b>Your next favourite</b><small>Ready to find its way home</small></span><ArrowUpRight size={17} /></div>
        </div>
      </section>

      <section className="landing-collection" id="collection">
        <div className="landing-section-heading">
          <div><span className="landing-overline">A FEW GOOD PLACES TO START</span><h2>Made for the everyday.</h2></div>
          <button onClick={onClientRegister}>Shop all goods <ArrowRight size={15} /></button>
        </div>
        <div className="landing-product-row">
          {featured.map((product) => (
            <article className="landing-product" key={product.id}>
              <img src={product.image_url} alt={product.name} loading="lazy" />
              <div><span>{product.category}</span><h3>{product.name}</h3><b>{money(product.price)}</b></div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div><span className="landing-overline">THOUGHTFUL FROM START TO FINISH</span><h2>A simpler way to shop.</h2><p>From choosing your goods to keeping track of payment, the important details stay together.</p></div>
        <div className="landing-steps">
          <article><span>01</span><h3>Find your favourites</h3><p>Browse a considered collection and add what you love to your bag.</p></article>
          <article><span>02</span><h3>Choose how to pay</h3><p>Pay by mobile money or cash, or set a clear period for a debt purchase.</p></article>
          <article><span>03</span><h3>Keep it all in view</h3><p>Check your purchases, balances, and return requests from your account.</p></article>
        </div>
      </section>

      <section className="landing-business" id="for-business">
        <div><span className="landing-overline">FOR THE PEOPLE BEHIND THE COUNTER</span><h2>Run your shop with a clearer view.</h2><p>Review payments, follow up on debts, record income and expenses, and keep customer returns moving.</p></div>
        <button className="landing-business-button" onClick={onAdminSignIn}>Administrator sign in <ArrowRight size={16} /></button>
      </section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><span className="landing-brand-mark"><Sparkles size={16} /></span><span>good<span>things</span></span></a><span>Considered goods for everyday living.</span><button onClick={onClientSignIn}>Your account <ArrowRight size={14} /></button></footer>
    </main>
  );
}
