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

export function SectionHead({ title, subtitle, action }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
export function StatCard({ label, value, change, note, icon: Icon, tint }) {
  return (
    <article className={`stat-card tint-${tint}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={17} />
        </span>
      </div>
      <b className="stat-value">{value}</b>
      <div className="stat-change">
        <strong>{change}</strong>
        <span>{note}</span>
      </div>
      <div className="stat-watermark">
        <Icon size={66} strokeWidth={1} />
      </div>
    </article>
  );
}
export function ReportCard({ icon: Icon, label, value, detail, tint }) {
  return (
    <article className={`report-card tint-${tint}`}>
      <div className="report-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <b>{value}</b>
      <small>{detail}</small>
    </article>
  );
}
export function PaymentsTable({ payments, compact, client, confirmCash }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
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
            <tr key={payment.id || index}>
              <td>
                <div className="table-person">
                  <span
                    className={`avatar ${index % 2 ? "avatar-peach" : "avatar-green"}`}
                  >
                    {initials(payment.name || "Purchase")}
                  </span>
                  <span>
                    <b>{payment.name || "Store purchase"}</b>
                    <small>
                      {payment.date ||
                        payment.created_at?.slice(0, 10) ||
                        "Recently"}
                    </small>
                  </span>
                </div>
              </td>
              <td className="reference-cell">
                {payment.id || payment.reference || "—"}
              </td>
              <td className="amount-cell">{money(payment.amount)}</td>
              <td>
                <span className="method-tag">
                  {payment.method || "Mobile money"}
                </span>
              </td>
              <td>
                <StatusPill status={payment.status} />
              </td>
              <td>
                {!compact &&
                !client &&
                payment.status === "Pending" &&
                payment.method === "Cash" ? (
                  <button
                    className="remind-button"
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
    <div className="debt-list">
      {debts.map((debt, index) => (
        <article className="debt-row" key={debt.id}>
          <span
            className={`avatar ${index % 2 ? "avatar-peach" : "avatar-green"}`}
          >
            {initials(debt.name || "Customer")}
          </span>
          <div className="debt-client">
            <b>{debt.name || "Your account"}</b>
            <small>
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
          <div className="debt-progress">
            <div className="progress-label">
              <span>{client ? "Remaining" : "Paid"}</span>
              <b>
                {money(
                  client
                    ? (debt.balance ?? debt.amount - debt.paid)
                    : debt.paid,
                )}
              </b>
            </div>
            <div className="progress-track">
              <i
                style={{
                  width: `${Math.min(100, (Number(debt.paid || debt.amount_paid || 0) / Math.max(1, debt.amount || debt.total_amount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="debt-balance">
            <b>{money(debt.balance ?? debt.amount - debt.paid)}</b>
            <StatusPill status={debt.status} />
          </div>
          {!compact && !client && debt.review_status === "pending" && (
            <div className="debt-actions">
              <button
                className="remind-button"
                disabled={loading}
                onClick={() => reviewDebt?.(debt, "accept")}
              >
                <Check size={14} /> Accept
              </button>
              <button
                className="remind-button"
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
            <div className="debt-actions">
              <button
                className="remind-button"
                onClick={() => onPartPayment?.(debt)}
              >
                <CircleDollarSign size={14} /> Part payment
              </button>
              <button
                className="remind-button"
                onClick={() => sendReminder?.(debt)}
              >
                <Mail size={14} /> Remind
              </button>
            </div>
          )}
          {client && ["accepted", "rejected"].includes(debt.review_status) && (
            <p className="debt-review-notice" role="status">
              Your debt request was {debt.review_status}.
            </p>
          )}
          {client && debt.review_status === "accepted" && debt.balance > 0 && (
            <button
              className="remind-button debt-pay-button"
              disabled={loading}
              onClick={() => payDebt?.(debt)}
            >
              <CircleDollarSign size={14} /> Pay balance
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
    <div className="return-list">
      {returns.map((item) => (
        <div className="return-row" key={item.id}>
          <span className="return-product-icon">
            <Package size={18} />
          </span>
          <div className="return-copy">
            <b>{client ? item.product : `${item.client} · ${item.product}`}</b>
            <small>{item.reason}</small>
          </div>
          <StatusPill status={item.status} />
          {!client && item.status === "Pending" && (
            <div className="return-actions">
              <button
                title="Approve return"
                onClick={() => updateReturn(item, "Approved")}
              >
                <Check size={15} />
              </button>
              <button
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
    <div className="table-shell">
      <div className="table-scroll">
        <table>
          <thead>
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
              <tr key={entry.id}>
                <td>
                  <span className={`ledger-type ${entry.type.toLowerCase()}`}>
                    {entry.type}
                  </span>
                </td>
                <td>
                  <b>{entry.description}</b>
                </td>
                <td>{entry.date}</td>
                <td className="amount-cell">{money(entry.amount)}</td>
                <td>Amara Uwase</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ledger.length === 0 && <EmptyState text="Nothing recorded yet." />}
      </div>
    </div>
  );
}
export function ProductGrid({ products, admin }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <div className="product-image">
            <img src={product.image_url} alt={product.name} />
            <span className="product-category">{product.category}</span>
          </div>
          <div className="product-meta">
            <div>
              <h3>{product.name}</h3>
              <p>
                {admin
                  ? `${product.stock_quantity} in stock`
                  : product.description}
              </p>
            </div>
            <b>{money(product.price)}</b>
          </div>
          <div className="product-stock">
            {admin ? "Available" : `${product.stock_quantity} in stock`}
          </div>
        </article>
      ))}
    </div>
  );
}
export function StatusPill({ status }) {
  const value = String(status || "Pending");
  return (
    <span
      className={`status-pill status-${value.toLowerCase().replaceAll(" ", "-")}`}
    >
      {value}
    </span>
  );
}
export function SalesChart() {
  return (
    <div
      className="chart-bars"
      aria-label="Sales chart for the last seven days"
    >
      {[34, 52, 43, 74, 58, 88, 66].map((height, index) => (
        <div className="chart-day" key={index}>
          <div className="bar-pair">
            <i style={{ height: `${height}%` }} />
            <i style={{ height: `${Math.max(12, height * 0.47)}%` }} />
          </div>
          <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
        </div>
      ))}
    </div>
  );
}
export function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <span>
        <ShoppingBag size={18} />
      </span>
      {text}
    </div>
  );
}
export function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}
export function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">GOODTHINGS MARKET</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
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
        className="stack-form"
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
        <p className="form-intro">Choose a new password for your account.</p>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength="8"
            required
          />
        </label>
        <button className="button button-primary" disabled={loading}>
          {loading ? <Spinner /> : <ShieldCheck size={16} />} Update password
        </button>
      </form>
    );
  if (forgot)
    return (
      <form
        className="stack-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await onForgot?.(email);
          if (result?.development_reset_token)
            setResetToken(result.development_reset_token);
          else setForgot(false);
        }}
      >
        <p className="form-intro">
          Enter the email address for your account. We’ll send you a password
          reset link.
        </p>
        <label>
          Email address
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className="button button-primary" disabled={loading}>
          {loading ? <Spinner /> : <Mail size={16} />} Send reset link
        </button>
        <button
          type="button"
          className="text-link form-back"
          onClick={() => setForgot(false)}
        >
          Back to sign in
        </button>
      </form>
    );
  return (
    <form className="stack-form" onSubmit={authenticate}>
      {authMode === "register" && (
        <div className="two-fields">
          <label>
            First name
            <input name="first_name" autoComplete="given-name" required />
          </label>
          <label>
            Last name
            <input name="last_name" autoComplete="family-name" required />
          </label>
        </div>
      )}
      {authMode === "login" && (
        <label>
          Username or email
          <input
            name="username"
            autoComplete="username"
            placeholder="First and last name or email"
            required
          />
        </label>
      )}{" "}
      {(authMode === "admin" || authMode === "register") && (
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required />
        </label>
      )}
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={
            authMode === "register" ? "new-password" : "current-password"
          }
          minLength="8"
          required
        />
      </label>
      <button className="button button-primary" disabled={loading}>
        {loading ? <Spinner /> : <UserRound size={16} />}
        {authMode === "register" ? "Create account" : "Sign in"}
      </button>
      {authMode === "login" && (
        <button
          type="button"
          className="text-link form-back"
          onClick={() => setForgot(true)}
        >
          Forgot your password?
        </button>
      )}
      <div className="auth-foot">
        {authMode === "register" ? (
          <>
            Already a customer?{" "}
            <button type="button" onClick={() => setAuthMode("login")}>
              Sign in
            </button>
          </>
        ) : authMode === "login" ? (
          <>
            New around here?{" "}
            <button type="button" onClick={() => setAuthMode("register")}>
              Create an account
            </button>
            <button type="button" onClick={() => setAuthMode("admin")}>
              Admin sign in
            </button>
          </>
        ) : (
          <>
            Store customer?{" "}
            <button type="button" onClick={() => setAuthMode("login")}>
              Customer sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}
