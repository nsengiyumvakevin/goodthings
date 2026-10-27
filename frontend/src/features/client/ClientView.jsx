import { useState } from "react";
import {
  SectionHead,
  PaymentsTable,
  DebtTable,
  ReturnList,
  Spinner,
  StatusPill,
  MobileMoneyDialog,
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
  startMobileMoneyCheckout,
  checkMobileMoneyStatus,
  completeMobileMoneyPayment,
  loading,
  debts,
  returns,
  payments,
  createReturn,
  payDebt,
  findBill,
  payBill,
}) {
  const [category, setCategory] = useState("Everything");
  const [mobilePaymentOpen, setMobilePaymentOpen] = useState(false);
  const [returnProduct, setReturnProduct] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [billId, setBillId] = useState("");
  const [billResult, setBillResult] = useState(null);
  const [billError, setBillError] = useState("");
  const [billLoading, setBillLoading] = useState(false);
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
      <section className="space-y-5">
        <SectionHead
          title="Your purchases"
          subtitle="A little history of the good things you’ve found."
        />
        <section className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5" aria-labelledby="bill-lookup-title">
          <h3 className="mb-3 text-base font-semibold text-stone-900 dark:text-stone-100" id="bill-lookup-title">Find my bill</h3>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              setBillLoading(true);
              setBillError("");
              try {
                setBillResult(await findBill(billId));
              } catch (error) {
                setBillResult(null);
                setBillError(error.message);
              } finally {
                setBillLoading(false);
              }
            }}
          >
            <input
              className="min-h-10 min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 uppercase outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              value={billId}
              onChange={(event) => setBillId(event.target.value.toUpperCase())}
              placeholder="TXN-20261020-4821"
              aria-label="Bill ID"
              required
            />
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50" disabled={billLoading}>
              {billLoading ? <Spinner /> : "Find bill"}
            </button>
          </form>
          {billError && <p className="mt-3 text-sm text-rose-700 dark:text-rose-300" role="alert">{billError}</p>}
          {billResult && (
            <div className="mt-4 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4" role="status">
              <div className="flex flex-wrap items-center gap-3">
                <b className="font-mono text-sm text-stone-900 dark:text-stone-100">{billResult.bill_id}</b>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{money(billResult.amount)}</span>
                <StatusPill status={billResult.status} />
              </div>
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                Expires {new Date(billResult.expires_at).toLocaleString()}
              </p>
              {billResult.momo_requested_at && billResult.status === "Pending" && (
                <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Payment request sent. Confirm it on your phone.
                </p>
              )}
              {billResult.status === "Pending" &&
                billResult.method === "Mobile Money" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
                      Mobile money number
                      <input
                        className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+250 7xx xxx xxx"
                        value={mobileNumber}
                        onChange={(event) => setMobileNumber(event.target.value)}
                        required
                      />
                    </label>
                    {!billResult.momo_requested_at && <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                      disabled={loading || !mobileNumber.trim()}
                      onClick={async () => {
                        setBillLoading(true);
                        try {
                          const result = await payBill(billResult.bill_id, mobileNumber);
                          if (result.payment)
                            setBillResult({
                              ...billResult,
                              momo_requested_at: result.payment.momo_requested_at,
                            });
                        } catch (error) {
                          setBillError(error.message);
                        } finally {
                          setBillLoading(false);
                        }
                      }}
                    >
                      Pay with mobile money
                    </button>}
                  </div>
                )}
            </div>
          )}
        </section>
        <div className="overflow-hidden rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
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
      <section className="space-y-5">
        <SectionHead
          title="Your balances"
          subtitle="A clear picture of what’s paid and what’s still due."
        />
        <DebtTable debts={debts} client payDebt={payDebt} loading={loading} />
      </section>
    );
  if (page === "Returns")
    return (
      <section className="space-y-5">
        <SectionHead
          title="Purchase returns"
          subtitle="Something not quite right? We’ll help put it right."
        />
        <div className="max-w-xl rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Start a return</h3>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Choose a purchased item and tell us a little about it.</p>
          <form
            className="mt-4 grid gap-4"
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
            <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
              Purchased item
              <select
                className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
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
            <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
              Quantity
              <input
                className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
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
            <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
              Reason
              <textarea
                className="min-h-24 rounded border border-stone-300 bg-white p-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                required
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Tell us what happened..."
              />
            </label>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900">
              <ArrowRight size={16} /> Submit request
            </button>
          </form>
        </div>
        <div>
          <h3 className="mb-2 text-base font-semibold text-stone-900 dark:text-stone-100">Previous requests</h3>
          <ReturnList returns={returns} client />
        </div>
      </section>
    );
  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-md border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">A GOOD THING, EVERY DAY</span>
          <h2 className="mb-2 mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Find your <em>favourite.</em>
          </h2>
          <p className="max-w-xl text-sm leading-6 text-stone-600 dark:text-stone-400">
            Useful little things, chosen with care and ready to come home with
            you.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md bg-white dark:bg-stone-900 p-3 text-stone-700 dark:text-stone-300 shadow-sm">
          <span className="grid size-9 place-items-center rounded bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
            <Truck size={18} />
          </span>
          <span>
            <b className="block text-xs font-semibold">Ready when you are</b>
            <small className="mt-1 block text-[10px] text-stone-500 dark:text-stone-400">Create a bill now and pay within 24 hours.</small>
          </span>
          <ArrowRight className="ml-2 text-stone-500 dark:text-stone-400" size={16} />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === item ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-emerald-700 hover:text-emerald-800"}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="inline-flex min-h-9 items-center gap-2 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 lg:hidden"
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
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {visible.map((product) => (
              <article className="min-w-0 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2">
                <div className="relative aspect-square overflow-hidden rounded bg-stone-100 dark:bg-stone-800">
                  <img
                    className="size-full object-cover"
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded bg-white/95 dark:bg-stone-900/95 px-1.5 py-1 text-[9px] font-medium text-stone-700 dark:text-stone-300 sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">{product.category}</span>
                  <button
                    className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-emerald-800 text-white shadow hover:bg-emerald-900 sm:bottom-2 sm:right-2"
                    title={`Add ${product.name} to cart`}
                    onClick={() => addToCart(product)}
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-semibold text-stone-900 dark:text-stone-100 sm:text-sm">{product.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-stone-500 dark:text-stone-400 sm:text-xs">{product.description}</p>
                  </div>
                  <b className="shrink-0 text-[10px] font-semibold text-stone-900 dark:text-stone-100 sm:text-xs">{money(product.price)}</b>
                </div>
                <div className="border-t border-stone-100 dark:border-stone-800 pt-2 text-[10px] text-stone-500 dark:text-stone-400 sm:text-xs">
                  {product.stock_quantity} in stock <span>·</span> Ships in 1–2
                  days
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 xl:sticky xl:top-21" id="checkout-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">YOUR BAG</span>
              <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-100">Ready when you are.</h3>
            </div>
            <span className="grid size-8 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-sm font-semibold text-emerald-900 dark:text-emerald-200">{cartCount}</span>
          </div>
          {cart.length === 0 ? (
            <div className="grid justify-items-center gap-2 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                <ShoppingBag size={21} />
              </span>
              <b className="text-sm font-semibold text-stone-800 dark:text-stone-200">A little room for something good.</b>
              <p className="text-xs text-stone-500 dark:text-stone-400">Your chosen things will show up here.</p>
            </div>
          ) : (
            <div className="my-3 grid divide-y divide-stone-100 dark:divide-stone-800">
              {cart.map((item) => (
                <div className="flex items-start gap-2.5 py-3" key={item.id}>
                  <img className="size-12 rounded object-cover" src={item.image_url} alt="" />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-semibold text-stone-800 dark:text-stone-200">{item.name}</b>
                    <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">{money(item.price)}</span>
                    <div className="mt-2 inline-flex items-center gap-2 rounded border border-stone-200 dark:border-stone-800">
                      <button
                        className="grid size-7 place-items-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="text-xs font-medium">{item.quantity}</span>
                      <button
                        className="grid size-7 place-items-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <b className="pt-1 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    {money(item.price * item.quantity)}
                  </b>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 py-3 text-sm">
            <span className="text-stone-600 dark:text-stone-400">Subtotal</span>
            <b className="font-semibold text-stone-900 dark:text-stone-100">{money(cartTotal)}</b>
          </div>
          <div className="grid gap-2">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">HOW WOULD YOU LIKE TO PAY?</span>
            {[
              ["Mobile money", "Approve securely on your phone"],
              ["Cash", "Pay when you collect"],
              ["Debt", "Choose a payment date"],
            ].map(([method, description]) => (
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded border p-2.5 transition ${paymentMethod === method ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950" : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800"}`}
                key={method}
              >
                <input
                  type="radio"
                  className="size-4 accent-emerald-800"
                  name="payment"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="min-w-0 flex-1">
                  <b className="block text-xs font-semibold text-stone-800 dark:text-stone-200">{method}</b>
                  <small className="mt-0.5 block text-[10px] text-stone-500 dark:text-stone-400">{description}</small>
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
              <label className="grid gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                Pay within
                <select
                  className="min-h-9 rounded border border-stone-300 bg-white px-2 text-sm text-stone-900 outline-none focus:border-emerald-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
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
          </div>
          <button
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            disabled={!cart.length || loading}
            onClick={() =>
              paymentMethod === "Mobile money"
                ? setMobilePaymentOpen(true)
                : checkout()
            }
          >
            {loading ? (
              <Spinner />
            ) : paymentMethod === "Debt" ? (
              <CalendarDays size={16} />
            ) : paymentMethod === "Cash" ? (
              <ShieldCheck size={16} />
            ) : (
              <CreditCard size={16} />
            )}
            {paymentMethod === "Debt"
              ? "Create debt bill"
              : paymentMethod === "Cash"
                ? "Create cash bill"
                : `Pay · ${money(cartTotal)}`}
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
            <ShieldCheck size={13} /> Bill payments are secured by your mobile money provider.
          </div>
        </aside>
      </div>
      {activeReturns(returns) && (
        <div className="mt-4 flex items-center gap-2 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-xs text-emerald-900 dark:text-emerald-200">
          <Check size={15} /> Your recent return request is being reviewed.
        </div>
      )}
      {mobilePaymentOpen && (
        <MobileMoneyDialog
          amount={cartTotal}
          onClose={() => setMobilePaymentOpen(false)}
          onStartPayment={startMobileMoneyCheckout}
          onCheckStatus={checkMobileMoneyStatus}
          onSuccess={completeMobileMoneyPayment}
        />
      )}
    </>
  );
}
