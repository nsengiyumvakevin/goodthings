import { useEffect, useRef, useState } from "react";
import { money, initials } from "../data/demoData.js";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Mail,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

const tintClasses = {
  mint: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300",
  peach: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-200",
  yellow: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200",
  blue: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 text-sky-900 dark:text-sky-200",
};
const buttonPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSoft =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50";

export function SectionHead({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">{subtitle}</p>
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
        <span className="grid size-8 place-items-center rounded bg-white/80 dark:bg-stone-800/80">
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
      <div className="grid size-9 place-items-center rounded bg-white/80 dark:bg-stone-800/80">
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
    <div className="overflow-x-auto rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <table className="w-full min-w-210 border-collapse text-left text-xs">
        <thead className="bg-stone-50 dark:bg-stone-800 text-[11px] uppercase text-stone-500 dark:text-stone-400">
          <tr>
            <th>{client ? "Purchase" : "Client"}</th>
            <th>Bill / reference</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Phone</th>
            <th>Status</th>
            <th>{client ? "Date" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr className="border-t border-stone-100 dark:border-stone-800 hover:bg-stone-50/70" key={payment.id || index}>
              <td className="p-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index % 2 ? "bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-200" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"}`}
                  >
                    {initials(payment.name || "Purchase")}
                  </span>
                  <span>
                    <b className="block font-semibold text-stone-800 dark:text-stone-200">{payment.name || "Store purchase"}</b>
                    <small className="mt-0.5 block text-stone-500 dark:text-stone-400">
                      {payment.date ||
                        payment.created_at?.slice(0, 10) ||
                        "Recently"}
                    </small>
                  </span>
                </div>
              </td>
              <td className="max-w-56 p-3">
                <b className="block truncate font-mono text-stone-700 dark:text-stone-300">
                  {payment.bill_id || "—"}
                </b>
                {payment.reference && (
                  <small className="block truncate font-mono text-[10px] text-stone-500 dark:text-stone-400" title={payment.reference}>
                    {payment.reference}
                  </small>
                )}
              </td>
              <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">{money(payment.amount)}</td>
              <td className="p-3">
                <span className="rounded bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px] text-stone-700 dark:text-stone-300">
                  {payment.method || "Mobile money"}
                </span>
              </td>
              <td className="whitespace-nowrap p-3 text-stone-600 dark:text-stone-400">
                {payment.mobile_money_number || "—"}
              </td>
              <td className="p-3">
                <StatusPill status={payment.status} />
                {payment.failure_reason && (
                  <small className="mt-1 block max-w-44 text-[10px] text-rose-700 dark:text-rose-300">
                    {payment.failure_reason}
                  </small>
                )}
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
        <article className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 sm:grid-cols-[auto_minmax(110px,.85fr)_minmax(100px,1fr)_auto_auto]" key={debt.id}>
          <span
            className={`grid size-9 place-items-center rounded-full text-[10px] font-bold ${index % 2 ? "bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-200" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"}`}
          >
            {initials(debt.name || "Customer")}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{debt.name || "Your account"}</b>
            <small className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
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
            <div className="mb-1 flex justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span>{client ? "Remaining" : "Paid"}</span>
              <b className="text-stone-700 dark:text-stone-300">
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
            <b className="text-sm font-semibold text-stone-800 dark:text-stone-200">{money(debt.balance ?? debt.amount - debt.paid)}</b>
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
            <p className="col-span-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 sm:col-span-full" role="status">
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
        <div className="flex min-w-0 items-center gap-3 border-b border-stone-100 dark:border-stone-800 py-3" key={item.id}>
          <span className="grid size-9 shrink-0 place-items-center rounded bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
            <Package size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{client ? item.product : `${item.client} · ${item.product}`}</b>
            <small className="mt-1 block text-xs text-stone-500 dark:text-stone-400">{item.reason}</small>
          </div>
          <StatusPill status={item.status} />
          {!client && item.status === "Pending" && (
            <div className="flex gap-1">
              <button
                className="grid size-9 place-items-center rounded text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                title="Approve return"
                onClick={() => updateReturn(item, "Approved")}
              >
                <Check size={15} />
              </button>
              <button
                className="grid size-9 place-items-center rounded text-rose-800 dark:text-rose-200 hover:bg-rose-50"
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
    <div className="overflow-x-auto rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <table className="w-full min-w-162.5 border-collapse text-left text-xs">
          <thead className="bg-stone-50 dark:bg-stone-800 text-[11px] uppercase text-stone-500 dark:text-stone-400">
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
              <tr className="border-t border-stone-100 dark:border-stone-800" key={entry.id}>
                <td>
                  <span className={`rounded px-2 py-1 text-[11px] ${entry.type === "Income" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-200"}`}>
                    {entry.type}
                  </span>
                </td>
                <td>
                  <b className="font-medium text-stone-800 dark:text-stone-200">{entry.description}</b>
                </td>
                <td>{entry.date}</td>
                <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">{money(entry.amount)}</td>
                <td className="p-3 text-stone-600 dark:text-stone-400">Amara Uwase</td>
              </tr>
            ))}
          </tbody>
      </table>
      {ledger.length === 0 && <EmptyState text="Nothing recorded yet." />}
    </div>
  );
}
export function ProductGrid({ products, admin, profitByProduct }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {products.map((product) => {
        const performance = profitByProduct?.get(String(product.id));
        return (
          <article className="min-w-0 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5" key={product.id}>
            <div className="relative aspect-square overflow-hidden rounded bg-stone-100 dark:bg-stone-800">
              <img className="size-full object-cover" src={product.image_url} alt={product.name} />
              <span className="absolute left-2 top-2 rounded bg-white/95 dark:bg-stone-900/95 px-2 py-1 text-[10px] font-medium text-stone-700 dark:text-stone-300">{product.category}</span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-stone-600 dark:text-stone-400">
                  {admin
                    ? `${product.stock_quantity} in stock`
                    : product.description}
                </p>
              </div>
              <b className="shrink-0 text-xs font-semibold text-stone-900 dark:text-stone-100">{money(product.price)}</b>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-stone-100 dark:border-stone-800 pt-2 text-xs text-stone-500 dark:text-stone-400">
              {admin ? (
                <>
                  <span>
                    {product.cost_price != null
                      ? `Cost ${money(product.cost_price)}`
                      : "Cost not set"}
                  </span>
                  {performance ? (
                    performance.profit === null ? (
                      <span className="rounded bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-200">
                        Cost missing
                      </span>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          performance.profit < 0
                            ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                            : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        {performance.profit < 0
                          ? `Loss ${money(Math.abs(performance.profit))}`
                          : `Profit ${money(performance.profit)}`}
                      </span>
                    )
                  ) : (
                    <span>No sales this period</span>
                  )}
                </>
              ) : (
                `${product.stock_quantity} in stock`
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
export function StatusPill({ status }) {
  const value = String(status || "Pending");
  const normalized = value.toLowerCase();
  const tone = normalized.includes("paid") || normalized.includes("accepted") || normalized.includes("settled") || normalized.includes("approved")
    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"
    : normalized.includes("failed") || normalized.includes("rejected") || normalized.includes("expired") || normalized.includes("overdue")
      ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
      : normalized.includes("partial")
        ? "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${tone}`}>
      {value}
    </span>
  );
}
function dayKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function dailyActivity(reportData) {
  if (Array.isArray(reportData?.daily) && reportData.daily.length) {
    return reportData.daily;
  }
  const days = new Map();
  for (const entry of reportData?.income || []) {
    const key = dayKey(entry.date);
    if (!key) continue;
    const day = days.get(key) || { date: key, income: 0, outcome: 0 };
    day.income += Number(entry.amount) || 0;
    days.set(key, day);
  }
  for (const entry of reportData?.outcome || []) {
    const key = dayKey(entry.date);
    if (!key) continue;
    const day = days.get(key) || { date: key, income: 0, outcome: 0 };
    day.outcome += Number(entry.amount) || 0;
    days.set(key, day);
  }
  return [...days.values()]
    .map((day) => ({ ...day, net: day.income - day.outcome }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function dayLabel(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return value.slice(5);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SalesChart({ reportData }) {
  const days = dailyActivity(reportData).slice(-14);
  if (!days.length) {
    return (
      <div className="grid min-h-40 place-items-center rounded border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
        <span>
          No income or outcome has been recorded in this period yet.
        </span>
      </div>
    );
  }
  const max = Math.max(
    1,
    ...days.flatMap((day) => [Number(day.income) || 0, Number(day.outcome) || 0]),
  );
  return (
    <div className="grid h-40 items-end gap-1.5 overflow-x-auto" aria-label="Daily income and outcome chart">
      {days.map((day) => (
        <div
          className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2"
          key={day.date}
          title={`${day.date} · Income ${money(day.income)} · Outcome ${money(day.outcome)}`}
        >
          <div className="flex h-full w-full items-end justify-center gap-1">
            <i
              className="w-2.5 rounded-t bg-emerald-600 sm:w-3"
              style={{
                height: `${Math.max(day.income ? 3 : 0, (Number(day.income) / max) * 100)}%`,
              }}
            />
            <i
              className="w-2.5 rounded-t bg-orange-300 sm:w-3"
              style={{
                height: `${Math.max(day.outcome ? 3 : 0, (Number(day.outcome) / max) * 100)}%`,
              }}
            />
          </div>
          <small className="whitespace-nowrap text-[9px] text-stone-500 dark:text-stone-400">
            {dayLabel(day.date)}
          </small>
        </div>
      ))}
    </div>
  );
}

export function DailyReportTable({ reportData }) {
  const days = dailyActivity(reportData);
  if (!days.length)
    return (
      <EmptyState text="No daily income or outcome records for this period." />
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-xs">
        <thead className="bg-stone-50 text-[10px] uppercase text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Income</th>
            <th className="p-3">Outcome</th>
            <th className="p-3">Net</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr
              className="border-t border-stone-100 dark:border-stone-800"
              key={day.date}
            >
              <td className="p-3 font-medium text-stone-800 dark:text-stone-200">
                {dayLabel(day.date)}
              </td>
              <td className="p-3 text-emerald-800 dark:text-emerald-300">
                {money(day.income)}
              </td>
              <td className="p-3 text-orange-800 dark:text-orange-300">
                {money(day.outcome)}
              </td>
              <td
                className={`p-3 font-semibold ${day.income - day.outcome < 0 ? "text-rose-700 dark:text-rose-300" : "text-stone-900 dark:text-stone-100"}`}
              >
                {money(day.income - day.outcome)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function EmptyState({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-stone-300 dark:border-stone-700 px-4 py-6 text-sm text-stone-600 dark:text-stone-400">
      <span className="grid size-9 place-items-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
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
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">GOODTHINGS MARKET</span>
            <h2 className="mt-1 text-xl font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900"
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
function normalizeRwandaPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("250")) digits = digits.slice(3);
  if (digits.length === 9 && digits.startsWith("7")) digits = `0${digits}`;
  return digits;
}

export function MobileMoneyDialog({
  amount,
  onClose,
  onStartPayment,
  onCheckStatus,
  onSuccess,
}) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const deadlineRef = useRef(0);
  const checkingRef = useRef(false);
  const checkStatusRef = useRef(onCheckStatus);
  const successRef = useRef(onSuccess);
  const paymentRef = useRef(payment);
  const paymentKey = payment?.bill_id || payment?._id;
  const displayAmount = payment?.amount ?? amount;

  useEffect(() => {
    checkStatusRef.current = onCheckStatus;
    successRef.current = onSuccess;
    paymentRef.current = payment;
  }, [onCheckStatus, onSuccess, payment]);

  useEffect(() => {
    if (step !== "waiting" || !paymentKey) return undefined;
    deadlineRef.current = Date.now() + 120 * 1000;
    let stopped = false;

    async function check() {
      if (checkingRef.current || stopped) return;
      checkingRef.current = true;
      try {
        const updated = await checkStatusRef.current?.(paymentRef.current);
        if (stopped || !updated) return;
        setPayment(updated);
        const status = String(updated.status || "").toLowerCase();
        if (status === "paid") {
          stopped = true;
          setStep("success");
          successRef.current?.(updated);
        } else if (["failed", "expired"].includes(status)) {
          stopped = true;
          setError(
            updated.failure_reason ||
              "Mobile money did not complete this payment.",
          );
          setStep("failed");
        }
      } catch (checkError) {
        setMessage(`Still checking: ${checkError.message}`);
      } finally {
        checkingRef.current = false;
      }
    }

    check();
    const interval = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        stopped = true;
        window.clearInterval(interval);
        setStep("timeout");
        return;
      }
      check();
    }, 4000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [step, paymentKey]);

  async function startPayment(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedPhone = normalizeRwandaPhone(phone);
    if (!/^07[89]\d{7}$/.test(normalizedPhone)) {
      setError(
        "Enter a Rwandan mobile money number such as 0781234567 or 0791234567.",
      );
      return;
    }
    setStarting(true);
    try {
      const started = await onStartPayment?.(normalizedPhone);
      if (!started) throw new Error("The payment request could not be started.");
      setPhone(normalizedPhone);
      setPayment(started);
      setSecondsLeft(120);
      setStep("waiting");
    } catch (startError) {
      setError(startError.message);
      setStep("failed");
    } finally {
      setStarting(false);
    }
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Modal title="Mobile money payment" onClose={onClose}>
      {step === "phone" && (
        <form className="grid gap-4" onSubmit={startPayment}>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              AMOUNT TO PAY
            </span>
            <b className="mt-1 block text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {money(amount)}
            </b>
          </div>
          <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
            Mobile money phone number
            <input
              className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              placeholder="078 123 4567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
            <small className="font-normal text-stone-500 dark:text-stone-400">
              Use a number starting with 078 or 079, followed by 7 digits.
            </small>
          </label>
          <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            A prompt will appear on your phone asking you to approve the
            payment. It can take a few seconds. If it does not appear, check the
            number or open your phone&apos;s MoMo menu to see pending approvals.
          </p>
          {error && (
            <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
              {error}
            </p>
          )}
          <button
            className={buttonPrimary}
            disabled={starting || !phone.trim()}
          >
            {starting ? <Spinner /> : <Phone size={16} />} Pay{" "}
            {money(amount)}
          </button>
        </form>
      )}

      {step === "waiting" && (
        <div className="grid gap-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Spinner />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Waiting for approval
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Approve the prompt on your phone to pay {money(displayAmount)}.
            </p>
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 dark:bg-stone-800 dark:text-stone-200">
            <Clock3 size={16} /> {minutes}:{seconds} remaining
          </div>
          <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            The prompt can take a few seconds to appear. If it does not, check
            that {phone} is correct or open your phone&apos;s MoMo menu to see
            pending approvals.
          </p>
          {message && (
            <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>
          )}
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="grid gap-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle2 size={28} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Payment successful
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {money(displayAmount)} was paid successfully.
            </p>
            {payment && (
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                Bill: <b className="font-mono">{payment.bill_id}</b>
                {payment.reference && (
                  <>
                    <br />Reference:{" "}
                    <b className="font-mono">{payment.reference}</b>
                  </>
                )}
              </p>
            )}
          </div>
          <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            A confirmation email has been sent and your purchase is available in
            My purchases.
          </p>
          <button className={buttonPrimary} type="button" onClick={onClose}>
            <Check size={16} /> Done
          </button>
        </div>
      )}

      {step === "failed" && (
        <div className="grid gap-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
            <XCircle size={28} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Payment not completed
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {error ||
                "The mobile money request was declined or could not be completed."}
            </p>
          </div>
          <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            Your cart has been kept. Check the number, your balance and the
            pending approvals in your MoMo menu, then try again.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className={buttonPrimary}
              type="button"
              onClick={() => {
                setPayment(null);
                setStep("phone");
                setError("");
                setMessage("");
              }}
            >
              <RefreshCw size={16} /> Try again
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {step === "timeout" && (
        <div className="grid gap-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <AlertCircle size={28} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Still waiting for approval
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              We stopped checking after 2 minutes. If you approved the prompt,
              the payment will still complete and appear in My purchases.
            </p>
          </div>
          <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
            If you did not approve it, check your phone&apos;s MoMo menu and try
            again from your cart.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className={buttonPrimary}
              type="button"
              onClick={() => {
                setSecondsLeft(120);
                setStep("waiting");
              }}
            >
              <Clock3 size={16} /> Check again
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
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
  const [forgotStep, setForgotStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  function closeForgot() {
    setForgot(false);
    setForgotStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
  }

  if (forgot) {
    if (forgotStep === "email")
      return (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setFormError("");
            const result = await onForgot?.(email);
            if (result) setForgotStep("code");
            else setFormError("The reset code could not be sent. Please try again.");
          }}
        >
          <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
            Enter the email address for your account. We’ll send you a 6-digit
            code that expires in 10 minutes.
          </p>
          <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
            Email address
            <input
              type="email"
              className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {formError && (
            <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
              {formError}
            </p>
          )}
          <button className={buttonPrimary} disabled={loading}>
            {loading ? <Spinner /> : <Mail size={16} />} Send reset code
          </button>
          <button
            type="button"
            className="w-fit text-sm font-medium text-emerald-800 dark:text-emerald-300 underline-offset-2 hover:underline"
            onClick={closeForgot}
          >
            Back to sign in
          </button>
        </form>
      );
    return (
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError("");
          if (newPassword !== confirmPassword) {
            setFormError("The new passwords do not match.");
            return;
          }
          const updated = await onReset?.(email, code, newPassword);
          if (updated) closeForgot();
          else setFormError("The code could not be verified. Please try again.");
        }}
      >
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
          Enter the 6-digit code sent to <b className="text-stone-800 dark:text-stone-200">{email}</b>{" "}
          and choose a new password.
        </p>
        <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
          Reset code
          <input
            className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm tracking-[0.35em] text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength="6"
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
          New password
          <input
            className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            type="password"
            autoComplete="new-password"
            minLength="8"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
          Confirm new password
          <input
            className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            type="password"
            autoComplete="new-password"
            minLength="8"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {formError && (
          <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
            {formError}
          </p>
        )}
        <button className={buttonPrimary} disabled={loading}>
          {loading ? <Spinner /> : <ShieldCheck size={16} />} Update password
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="text-sm font-medium text-emerald-800 dark:text-emerald-300 underline-offset-2 hover:underline"
            onClick={() => {
              setForgotStep("email");
              setCode("");
              setNewPassword("");
              setConfirmPassword("");
              setFormError("");
            }}
          >
            Use a different email
          </button>
          <button
            type="button"
            className="text-sm font-medium text-stone-600 dark:text-stone-400 underline-offset-2 hover:underline"
            onClick={closeForgot}
          >
            Back to sign in
          </button>
        </div>
      </form>
    );
  }
  return (
    <form className="grid gap-4" onSubmit={authenticate}>
      {authMode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
            First name
            <input className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" name="first_name" autoComplete="given-name" required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
            Last name
            <input className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" name="last_name" autoComplete="family-name" required />
          </label>
        </div>
      )}
      {authMode === "login" && (
        <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
          Username or email
          <input
            name="username"
            autoComplete="username"
            className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            placeholder="First and last name or email"
            required
          />
        </label>
      )}{" "}
      {(authMode === "admin" || authMode === "register") && (
        <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
          Email address
          <input className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100" name="email" type="email" autoComplete="email" required />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
        Password
        <input
          name="password"
          type="password"
          className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
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
          className="w-fit text-sm font-medium text-emerald-800 dark:text-emerald-300 underline-offset-2 hover:underline"
          onClick={() => {
            setForgot(true);
            setForgotStep("email");
            setFormError("");
          }}
        >
          Forgot your password?
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 dark:border-stone-800 pt-3 text-sm text-stone-600 dark:text-stone-400">
        {authMode === "register" ? (
          <>
            Already a customer?{" "}
            <button className="font-semibold text-emerald-800 dark:text-emerald-300" type="button" onClick={() => setAuthMode("login")}>
              Sign in
            </button>
          </>
        ) : authMode === "login" ? (
          <>
            New around here?{" "}
            <button className="font-semibold text-emerald-800 dark:text-emerald-300" type="button" onClick={() => setAuthMode("register")}>
              Create an account
            </button>
            <button className="font-semibold text-emerald-800 dark:text-emerald-300" type="button" onClick={() => setAuthMode("admin")}>
              Admin sign in
            </button>
          </>
        ) : (
          <>
            Store customer?{" "}
            <button className="font-semibold text-emerald-800 dark:text-emerald-300" type="button" onClick={() => setAuthMode("login")}>
              Customer sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
