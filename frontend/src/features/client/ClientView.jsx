import { useState } from "react";
import {
  SectionHead,
  PaymentsTable,
  DebtTable,
  ReturnList,
  Spinner,
} from "../../components/shared.jsx";
import { money } from "../../data/demoData.js";
import { activeReturns } from "../../utils/returns.js";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

export function ClientView({
  page,
  products,
  cart,
  cartCount,
  cartTotal,
  addToCart,
  updateQuantity,
  paymentMethod,
  setPaymentMethod,
  mobileNumber,
  setMobileNumber,
  debtDays,
  setDebtDays,
  checkout,
  loading,
  debts,
  returns,
  payments,
  createReturn,
  payDebt,
}) {
  const [category, setCategory] = useState("Everything");
  const [returnProduct, setReturnProduct] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const purchasedItems = payments
    .filter((payment) =>
      ["Paid", "Unpaid", "Partial", "Overdue"].includes(payment.status),
    )
    .flatMap((payment) => payment.items || [])
    .filter(
      (item) => item.product && item.quantity > (item.returned_quantity || 0),
    );
  const categories = [
    "Everything",
    ...new Set(products.map((product) => product.category)),
  ];
  const visible = products.filter(
    (product) => category === "Everything" || product.category === category,
  );
  if (page === "My purchases")
    return (
      <section className="content-section">
        <SectionHead
          title="Your purchases"
          subtitle="A little history of the good things you’ve found."
        />
        <div className="table-shell">
          <PaymentsTable
            payments={payments.map((payment) => ({
              ...payment,
              name:
                payment.items
                  ?.map((item) => item.product?.name || item.name)
                  .join(", ") || "Store purchase",
            }))}
            client
          />
        </div>
      </section>
    );
  if (page === "My debts")
    return (
      <section className="content-section">
        <SectionHead
          title="Your balances"
          subtitle="A clear picture of what’s paid and what’s still due."
        />
        {debts.some(
          (debt) => debt.review_status === "accepted" && debt.balance > 0,
        ) && (
          <label className="debt-payment-number">
            Mobile money number
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+250 7xx xxx xxx"
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              required
            />
          </label>
        )}
        <DebtTable debts={debts} client payDebt={payDebt} loading={loading} />
      </section>
    );
  if (page === "Returns")
    return (
      <section className="content-section">
        <SectionHead
          title="Purchase returns"
          subtitle="Something not quite right? We’ll help put it right."
        />
        <div className="return-form">
          <h3>Start a return</h3>
          <p>Choose a purchased item and tell us a little about it.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createReturn(
                returnProduct,
                Number(returnQuantity),
                returnReason,
              ).then((submitted) => {
                if (!submitted) return;
                setReturnProduct("");
                setReturnReason("");
                setReturnQuantity("1");
              });
            }}
          >
            <label>
              Purchased item
              <select
                required
                value={returnProduct}
                onChange={(event) => setReturnProduct(event.target.value)}
              >
                <option value="">Select an item</option>
                {purchasedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.product.name} ·{" "}
                    {item.quantity - (item.returned_quantity || 0)} available
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={
                  purchasedItems.find((item) => item.id === returnProduct)
                    ?.quantity || 1
                }
                value={returnQuantity}
                onChange={(event) => setReturnQuantity(event.target.value)}
                required
              />
            </label>
            <label>
              Reason
              <textarea
                required
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Tell us what happened..."
              />
            </label>
            <button className="button button-primary">
              <ArrowRight size={16} /> Submit request
            </button>
          </form>
        </div>
        <div className="return-history">
          <h3>Previous requests</h3>
          <ReturnList returns={returns} client />
        </div>
      </section>
    );
  return (
    <>
      <div className="shop-intro">
        <div className="shop-welcome">
          <span className="eyebrow">A GOOD THING, EVERY DAY</span>
          <h2>
            Find your <em>favourite.</em>
          </h2>
          <p>
            Useful little things, chosen with care and ready to come home with
            you.
          </p>
        </div>
        <div className="shop-note">
          <span className="note-icon">
            <Truck size={18} />
          </span>
          <span>
            <b>Ready when you are</b>
            <small>Pay by mobile money, cash, or over time.</small>
          </span>
          <ArrowRight size={16} />
        </div>
      </div>
      <div className="shop-toolbar">
        <div className="category-tabs">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "category-active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="button button-soft cart-mobile"
          onClick={() =>
            document
              .getElementById("checkout-panel")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <ShoppingCart size={16} /> Bag{" "}
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
      </div>
      <div className="shop-layout">
        <div className="product-area">
          <div className="product-grid">
            {visible.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                  />
                  <span className="product-category">{product.category}</span>
                  <button
                    className="quick-add"
                    title={`Add ${product.name} to cart`}
                    onClick={() => addToCart(product)}
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <div className="product-meta">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <b>{money(product.price)}</b>
                </div>
                <div className="product-stock">
                  {product.stock_quantity} in stock <span>·</span> Ships in 1–2
                  days
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="checkout-panel" id="checkout-panel">
          <div className="checkout-title">
            <div>
              <span className="eyebrow">YOUR BAG</span>
              <h3>Ready when you are.</h3>
            </div>
            <span className="bag-count">{cartCount}</span>
          </div>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <span className="empty-icon">
                <ShoppingBag size={21} />
              </span>
              <b>A little room for something good.</b>
              <p>Your chosen things will show up here.</p>
            </div>
          ) : (
            <div className="cart-lines">
              {cart.map((item) => (
                <div className="cart-line" key={item.id}>
                  <img src={item.image_url} alt="" />
                  <div className="cart-line-main">
                    <b>{item.name}</b>
                    <span>{money(item.price)}</span>
                    <div className="quantity-stepper">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <b className="line-total">
                    {money(item.price * item.quantity)}
                  </b>
                </div>
              ))}
            </div>
          )}
          <div className="checkout-total">
            <span>Subtotal</span>
            <b>{money(cartTotal)}</b>
          </div>
          <div className="payment-choices">
            <span className="input-caption">HOW WOULD YOU LIKE TO PAY?</span>
            {[
              ["Mobile money", "Approve securely on your phone"],
              ["Cash", "Pay when you collect"],
              ["Debt", "Choose a payment date"],
            ].map(([method, description]) => (
              <label
                className={`payment-choice ${paymentMethod === method ? "payment-choice-active" : ""}`}
                key={method}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="radio-dot" />
                <span className="payment-choice-copy">
                  <b>{method}</b>
                  <small>{description}</small>
                </span>
                {method === "Mobile money" ? (
                  <CreditCard size={16} />
                ) : method === "Cash" ? (
                  <Wallet size={16} />
                ) : (
                  <CalendarDays size={16} />
                )}
              </label>
            ))}
            {paymentMethod === "Debt" && (
              <label className="debt-period">
                Pay within
                <select
                  value={debtDays}
                  onChange={(event) => setDebtDays(event.target.value)}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                </select>
              </label>
            )}
            {paymentMethod === "Mobile money" && (
              <label className="mobile-money-number">
                Mobile money number
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+250 7xx xxx xxx"
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                  required
                />
              </label>
            )}
          </div>
          <button
            className="button button-primary checkout-button"
            disabled={!cart.length || loading}
            onClick={checkout}
          >
            {loading ? (
              <Spinner />
            ) : paymentMethod === "Debt" ? (
              <CalendarDays size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            {paymentMethod === "Debt"
              ? "Place order on credit"
              : `Continue · ${money(cartTotal)}`}
          </button>
          <div className="secure-note">
            <ShieldCheck size={13} /> Your details are always kept safe.
          </div>
        </aside>
      </div>
      {activeReturns(returns) && (
        <div className="inline-note">
          <Check size={15} /> Your recent return request is being reviewed.
        </div>
      )}
    </>
  );
}
