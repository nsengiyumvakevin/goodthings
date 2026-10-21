import { useState } from "react";
import { money, initials } from "../data/demoData.js";
import {
  Check,
  CircleDollarSign,
  Mail,
  Package,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

const tintClasses = {
  mint: "border-emerald-200 bg-emerald-50 text-emerald-800",
  peach: "border-orange-200 bg-orange-50 text-orange-900",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-900",
};
const buttonPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSoft =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50";

export function SectionHead({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function StatCard({ label, value, change, note, icon: Icon, tint }) {
  return (
    <article className={`relative overflow-hidden rounded-md border p-4 shadow-sm ${tintClasses[tint] || tintClasses.mint}`}>
      <div className="relative z-1 flex items-center justify-between gap-2 text-sm font-medium">
        <span>{label}</span>
        <span className="grid size-8 place-items-center rounded bg-white/80">
          <Icon size={17} />
        </span>
      </div>
      <b className="relative z-1 mt-4 block text-2xl font-semibold">{value}</b>
      <div className="relative z-1 mt-2 flex flex-wrap gap-x-2 text-xs">
        <strong>{change}</strong><span>{note}</span>
      </div>
      <div className="pointer-events-none absolute -bottom-3 -right-2 opacity-[0.08]">
        <Icon size={66} strokeWidth={1} />
      </div>
    </article>
  );
}
export function ReportCard({ icon: Icon, label, value, detail, tint }) {
  return (
    <article className={`grid min-h-36 content-start gap-2 rounded-md border p-4 ${tintClasses[tint] || tintClasses.mint}`}>
      <div className="grid size-9 place-items-center rounded bg-white/80">
        <Icon size={18} />
      </div>
      <span className="text-sm font-medium">{label}</span>
      <b className="text-xl font-semibold">{value}</b>
      <small className="text-xs opacity-80">{detail}</small>
    </article>
  );
}
export function PaymentsTable({ payments, compact, client, confirmCash }) {
  return (
    <div className="overflow-x-auto rounded-md border border-stone-200 bg-white">
      <table className="w-full min-w-190 border-collapse text-left text-xs">
        <thead className="bg-stone-50 text-[11px] uppercase text-stone-500">
          <tr>
            <th>{client ? "Purchase" : "Client"}</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>{client ? "Date" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr className="border-t border-stone-100 hover:bg-stone-50/70" key={payment.id || index}>
              <td className="p-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index % 2 ? "bg-orange-100 text-orange-900" : "bg-emerald-100 text-emerald-900"}`}
                  >
                    {initials(payment.name || "Purchase")}
                  </span>
                  <span>
                    <b className="block font-semibold text-stone-800">{payment.name || "Store purchase"}</b>
                    <small className="mt-0.5 block text-stone-500">
                      {payment.date ||
                        payment.created_at?.slice(0, 10) ||
                        "Recently"}
                    </small>
                  </span>
                </div>
              </td>
              <td className="max-w-52 truncate p-3 font-mono text-stone-600">
                {payment.bill_id || payment.id || payment.reference || "—"}
              </td>
              <td className="p-3 font-semibold text-stone-900">{money(payment.amount)}</td>
              <td className="p-3">
                <span className="rounded bg-stone-100 px-2 py-1 text-[11px] text-stone-700">
                  {payment.method || "Mobile money"}
                </span>
              </td>
              <td className="p-3">
                <StatusPill status={payment.status} />
              </td>
              <td className="p-3">
                {!compact &&
                !client &&
                payment.status === "Pending" &&
                payment.method === "Cash" ? (
                  <button
                    className={buttonSoft}
                    onClick={() => confirmCash?.(payment)}
                  >
                    <Check size={14} /> Confirm cash
                  </button>
                ) : (
                  ""
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payments.length === 0 && (
        <EmptyState text="No payments to show just yet." />
      )}
    </div>
  );
}
export function DebtTable({
  debts,
  sendReminder,
  onPartPayment,
  compact,
  client,
  reviewDebt,
  payDebt,
  loading,
}) {
  return (
    <div className="grid gap-2">
      {debts.map((debt, index) => (
        <article className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-[auto_minmax(110px,.85fr)_minmax(100px,1fr)_auto_auto]" key={debt.id}>
          <span
            className={`grid size-9 place-items-center rounded-full text-[10px] font-bold ${index % 2 ? "bg-orange-100 text-orange-900" : "bg-emerald-100 text-emerald-900"}`}
          >
            {initials(debt.name || "Customer")}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm font-semibold text-stone-800">{debt.name || "Your account"}</b>
            <small className="mt-1 block text-xs text-stone-500">
              {client
                ? debt.review_status === "pending"
                  ? "Awaiting approval"
                  : debt.review_status === "rejected"
                    ? "Request rejected"
                    : debt.review_status === "accepted"
                      ? "Request accepted"
                      : "Payment plan"
                : `Due ${debt.due || debt.due_date?.slice(0, 10) || "soon"}`}
            </small>
          </div>
          <div className="col-span-3 min-w-0 sm:col-span-1">
            <div className="mb-1 flex justify-between gap-2 text-xs text-stone-500">
              <span>{client ? "Remaining" : "Paid"}</span>
              <b className="text-stone-700">
                {money(
                  client
                    ? (debt.balance ?? debt.amount - debt.paid)
                    : debt.paid,
                )}
              </b>
            </div>
            <progress className="h-2 w-full accent-emerald-700" value={Number(debt.paid || debt.amount_paid || 0)} max={Math.max(1, debt.amount || debt.total_amount || 1)} />
          </div>
          <div className="grid justify-items-end gap-1.5">
            <b className="text-sm font-semibold text-stone-800">{money(debt.balance ?? debt.amount - debt.paid)}</b>
            <StatusPill status={debt.status} />
          </div>
          {!compact && !client && debt.review_status === "pending" && (
            <div className="col-span-3 flex flex-wrap gap-2 sm:col-span-1">
              <button
                className={buttonSoft}
                disabled={loading}
                onClick={() => reviewDebt?.(debt, "accept")}
              >
                <Check size={14} /> Accept
              </button>
              <button
                className={buttonSoft}
                disabled={loading}
                onClick={() => reviewDebt?.(debt, "reject")}
              >
                <X size={14} /> Reject
              </button>
            </div>
          )}
          {!compact &&
            !client &&
            debt.balance > 0 &&
            !["pending", "rejected"].includes(debt.review_status) && (
            <div className="col-span-3 flex flex-wrap gap-2 sm:col-span-1">
              <button
                className={buttonSoft}
                onClick={() => onPartPayment?.(debt)}
              >
                <CircleDollarSign size={14} /> Part payment
              </button>
              <button
                className={buttonSoft}
                onClick={() => sendReminder?.(debt)}
              >
                <Mail size={14} /> Remind
              </button>
            </div>
          )}
          {client && ["accepted", "rejected"].includes(debt.review_status) && (
            <p className="col-span-3 text-xs font-medium text-emerald-800 sm:col-span-full" role="status">
              Your debt request was {debt.review_status}.
            </p>
          )}
          {client && debt.review_status === "accepted" && debt.balance > 0 && (
            <button
              className={`${buttonPrimary} col-span-3 w-full sm:col-span-1 sm:w-auto`}
              disabled={loading}
              onClick={() => payDebt?.(debt)}
            >
              <CircleDollarSign size={14} /> Create payment bill
            </button>
          )}
        </article>
      ))}
      {debts.length === 0 && <EmptyState text="No open balances. Lovely." />}
    </div>
  );
}
export function ReturnList({ returns, updateReturn, client }) {
  return (
    <div className="grid gap-2">
      {returns.map((item) => (
        <div className="flex min-w-0 items-center gap-3 border-b border-stone-100 py-3" key={item.id}>
          <span className="grid size-9 shrink-0 place-items-center rounded bg-orange-50 text-orange-800">
            <Package size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm font-semibold text-stone-800">{client ? item.product : `${item.client} · ${item.product}`}</b>
            <small className="mt-1 block text-xs text-stone-500">{item.reason}</small>
          </div>
          <StatusPill status={item.status} />
          {!client && item.status === "Pending" && (
            <div className="flex gap-1">
              <button
                className="grid size-9 place-items-center rounded text-emerald-800 hover:bg-emerald-50"
                title="Approve return"
                onClick={() => updateReturn(item, "Approved")}
              >
                <Check size={15} />
              </button>
              <button
                className="grid size-9 place-items-center rounded text-rose-800 hover:bg-rose-50"
                title="Decline return"
                onClick={() => updateReturn(item, "Rejected")}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      ))}
      {returns.length === 0 && (
        <EmptyState text="No return requests at the moment." />
      )}
    </div>
  );
}
export function LedgerTable({ ledger }) {
  return (
    <div className="overflow-x-auto rounded-md border border-stone-200 bg-white">
      <table className="w-full min-w-162.5 border-collapse text-left text-xs">
          <thead className="bg-stone-50 text-[11px] uppercase text-stone-500">
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Recorded by</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr className="border-t border-stone-100" key={entry.id}>
                <td>
                  <span className={`rounded px-2 py-1 text-[11px] ${entry.type === "Income" ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-900"}`}>
                    {entry.type}
                  </span>
                </td>
                <td>
                  <b className="font-medium text-stone-800">{entry.description}</b>
                </td>
                <td>{entry.date}</td>
                <td className="p-3 font-semibold text-stone-900">{money(entry.amount)}</td>
                <td className="p-3 text-stone-600">Amara Uwase</td>
              </tr>
            ))}
          </tbody>
      </table>
      {ledger.length === 0 && <EmptyState text="Nothing recorded yet." />}
    </div>
  );
}
export function ProductGrid({ products, admin }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {products.map((product) => (
        <article className="min-w-0 rounded-md border border-stone-200 bg-white p-2.5" key={product.id}>
          <div className="relative aspect-square overflow-hidden rounded bg-stone-100">
            <img className="size-full object-cover" src={product.image_url} alt={product.name} />
            <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-medium text-stone-700">{product.category}</span>
          </div>
          <div className="flex min-w-0 items-start justify-between gap-2 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-stone-900">{product.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                {admin
                  ? `${product.stock_quantity} in stock`
                  : product.description}
              </p>
            </div>
            <b className="shrink-0 text-xs font-semibold text-stone-900">{money(product.price)}</b>
          </div>
          <div className="border-t border-stone-100 pt-2 text-xs text-stone-500">
            {admin ? "Available" : `${product.stock_quantity} in stock`}
          </div>
        </article>
      ))}
    </div>
  );
}
export function StatusPill({ status }) {
  const value = String(status || "Pending");
  const normalized = value.toLowerCase();
  const tone = normalized.includes("paid") || normalized.includes("accepted") || normalized.includes("settled") || normalized.includes("approved")
    ? "bg-emerald-100 text-emerald-800"
    : normalized.includes("failed") || normalized.includes("rejected") || normalized.includes("expired") || normalized.includes("overdue")
      ? "bg-rose-100 text-rose-800"
      : normalized.includes("partial")
        ? "bg-amber-100 text-amber-900"
        : "bg-stone-100 text-stone-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${tone}`}>
      {value}
    </span>
  );
}
export function SalesChart() {
  const bars = [
    ["h-10", "h-5"],
    ["h-14", "h-7"],
    ["h-12", "h-6"],
    ["h-20", "h-10"],
    ["h-16", "h-8"],
    ["h-24", "h-12"],
    ["h-18", "h-9"],
  ];
  return (
    <div className="grid h-40 grid-cols-7 items-end gap-2" aria-label="Sales chart for the last seven days">
      {bars.map(([incomeHeight, outcomeHeight], index) => (
        <div className="flex h-full flex-col items-center justify-end gap-2" key={index}>
          <div className="flex h-full items-end gap-1">
            <i className={`w-3 rounded-t bg-emerald-600 ${incomeHeight}`} />
            <i className={`w-3 rounded-t bg-orange-300 ${outcomeHeight}`} />
          </div>
          <small className="text-[10px] text-stone-500">{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
        </div>
      ))}
    </div>
  );
}
export function EmptyState({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-600">
      <span className="grid size-9 place-items-center rounded-full bg-stone-100 text-stone-600">
        <ShoppingBag size={18} />
      </span>
      {text}
    </div>
  );
}
export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-label="Loading" />;
}
export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-stone-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-md border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-800">GOODTHINGS MARKET</span>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">{title}</h2>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function AuthForm({
  authMode,
  setAuthMode,
  authenticate,
  loading,
  onForgot,
  onReset,
}) {
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(
    () => new URLSearchParams(window.location.search).get("reset") || "",
  );
  if (resetToken)
    return (
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const updated = await onReset?.(resetToken, form.get("password"));
          if (updated) {
            setResetToken("");
            window.history.replaceState(null, "", window.location.pathname);
          }
        }}
      >
        <p className="text-sm leading-6 text-stone-600">Choose a new password for your account.</p>
        <label className="grid gap-1.5 text-sm font-medium text-stone-700">
          New password
          <input
            name="password"
            type="password"
            className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            autoComplete="new-password"
            minLength="8"
            required
          />
        </label>
        <button className={buttonPrimary} disabled={loading}>
          {loading ? <Spinner /> : <ShieldCheck size={16} />} Update password
        </button>
      </form>
    );
  if (forgot)
    return (
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await onForgot?.(email);
          if (result?.development_reset_token)
            setResetToken(result.development_reset_token);
          else setForgot(false);
        }}
      >
        <p className="text-sm leading-6 text-stone-600">
          Enter the email address for your account. We’ll send you a password
          reset link.
        </p>
        <label className="grid gap-1.5 text-sm font-medium text-stone-700">
          Email address
          <input
            type="email"
            className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className={buttonPrimary} disabled={loading}>
          {loading ? <Spinner /> : <Mail size={16} />} Send reset link
        </button>
        <button
          type="button"
          className="w-fit text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          onClick={() => setForgot(false)}
        >
          Back to sign in
        </button>
      </form>
    );
  return (
    <form className="grid gap-4" onSubmit={authenticate}>
      {authMode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-stone-700">
            First name
            <input className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" name="first_name" autoComplete="given-name" required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-stone-700">
            Last name
            <input className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" name="last_name" autoComplete="family-name" required />
          </label>
        </div>
      )}
      {authMode === "login" && (
        <label className="grid gap-1.5 text-sm font-medium text-stone-700">
          Username or email
          <input
            name="username"
            autoComplete="username"
            className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            placeholder="First and last name or email"
            required
          />
        </label>
      )}{" "}
      {(authMode === "admin" || authMode === "register") && (
        <label className="grid gap-1.5 text-sm font-medium text-stone-700">
          Email address
          <input className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" name="email" type="email" autoComplete="email" required />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium text-stone-700">
        Password
        <input
          name="password"
          type="password"
          className="min-h-10 rounded border border-stone-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          autoComplete={
            authMode === "register" ? "new-password" : "current-password"
          }
          minLength="8"
          required
        />
      </label>
      <button className={buttonPrimary} disabled={loading}>
        {loading ? <Spinner /> : <UserRound size={16} />}
        {authMode === "register" ? "Create account" : "Sign in"}
      </button>
      {authMode === "login" && (
        <button
          type="button"
          className="w-fit text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          onClick={() => setForgot(true)}
        >
          Forgot your password?
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm text-stone-600">
        {authMode === "register" ? (
          <>
            Already a customer?{" "}
            <button className="font-semibold text-emerald-800" type="button" onClick={() => setAuthMode("login")}>
              Sign in
            </button>
          </>
        ) : authMode === "login" ? (
          <>
            New around here?{" "}
            <button className="font-semibold text-emerald-800" type="button" onClick={() => setAuthMode("register")}>
              Create an account
            </button>
            <button className="font-semibold text-emerald-800" type="button" onClick={() => setAuthMode("admin")}>
              Admin sign in
            </button>
          </>
        ) : (
          <>
            Store customer?{" "}
            <button className="font-semibold text-emerald-800" type="button" onClick={() => setAuthMode("login")}>
              Customer sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
