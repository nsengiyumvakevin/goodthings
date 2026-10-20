import {
  SectionHead,
  PaymentsTable,
  DebtTable,
  LedgerTable,
  ReturnList,
  ProductGrid,
  ReportCard,
  SalesChart,
  StatCard,
} from "../../components/shared.jsx";
import { money } from "../../data/demoData.js";
import {
  Activity,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  Download,
  ListFilter,
  Plus,
  Settings2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export function AdminView({
  page,
  payments,
  debts,
  returns,
  ledger,
  debtBalance,
  filter,
  setFilter,
  setActiveModal,
  sendReminder,
  updateReturn,
  setPage,
  period,
  setPeriod,
  products,
  incomeToday,
  outcomeToday,
  clientCount,
  confirmCash,
  reportData,
  onPartPayment,
  reviewDebt,
  jobs,
}) {
  const reportSales = (reportData?.payments || [])
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  if (page === "Payments")
    return (
      <section className="content-section">
        <SectionHead
          title="Payments"
          subtitle="Every sale, transfer and payment promise."
          action={
            <button
              className="button button-soft"
              onClick={() =>
                setFilter(filter === "All activity" ? "Paid" : "All activity")
              }
            >
              <ListFilter size={16} /> {filter}
            </button>
          }
        />
        <div className="table-shell">
          <PaymentsTable payments={payments} confirmCash={confirmCash} />
        </div>
      </section>
    );
  if (page === "Debts")
    return (
      <section className="content-section">
        <SectionHead
          title="Outstanding balances"
          subtitle="Keep every promise and due date in view."
        />
        <DebtTable
          debts={debts}
          sendReminder={sendReminder}
          onPartPayment={onPartPayment}
          reviewDebt={reviewDebt}
        />
      </section>
    );
  if (page === "Income & outcome")
    return (
      <section className="content-section">
        <SectionHead
          title="Income & outcome"
          subtitle="A simple record of what comes in and what goes out."
          action={
            <button
              className="button button-primary"
              onClick={() => setActiveModal("record")}
            >
              <Plus size={16} /> Add record
            </button>
          }
        />
        <div className="ledger-summary">
          <div>
            <span>Total income</span>
            <b>
              {money(
                ledger
                  .filter((entry) => entry.type === "Income")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div>
            <span>Total outcome</span>
            <b>
              {money(
                ledger
                  .filter((entry) => entry.type === "Outcome")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div>
            <span>Net position</span>
            <b>
              {money(
                ledger.reduce(
                  (sum, item) =>
                    sum + (item.type === "Income" ? item.amount : -item.amount),
                  0,
                ),
              )}
            </b>
          </div>
        </div>
        <LedgerTable ledger={ledger} />
      </section>
    );
  if (page === "Sales returns")
    return (
      <section className="content-section">
        <SectionHead
          title="Sales returns"
          subtitle="Review requests and decide what happens next."
        />
        <ReturnList returns={returns} updateReturn={updateReturn} />
      </section>
    );
  if (page === "Products")
    return (
      <section className="content-section">
        <SectionHead
          title="Product catalogue"
          subtitle="Your best-loved things, ready for the next order."
          action={
            <button
              className="button button-primary"
              onClick={() => setActiveModal("product")}
            >
              <Plus size={16} /> Add product
            </button>
          }
        />
        <ProductGrid products={products} admin />
      </section>
    );
  if (page === "Reports")
    return (
      <section className="content-section">
        <SectionHead
          title="Activity reports"
          subtitle="Choose a time period and export a shareable snapshot."
          action={
            <select
              className="select-inline"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>This month</option>
              <option>This week</option>
              <option>Last 90 days</option>
            </select>
          }
        />
        <div className="report-grid">
          <ReportCard
            icon={CircleDollarSign}
            label="Paid sales"
            value={money(reportSales)}
            detail="Across all payment methods"
            tint="mint"
          />
          <ReportCard
            icon={Users}
            label="Active clients"
            value={String(clientCount)}
            detail="Registered customer accounts"
            tint="peach"
          />
          <ReportCard
            icon={Clock3}
            label="Open balances"
            value={money(debtBalance)}
            detail={`${debts.filter((item) => item.status === "Overdue").length} need a reminder`}
            tint="blue"
          />
        </div>
        <div className="chart-panel">
          <div className="chart-title">
            <div>
              <h3>Sales activity</h3>
              <p>Paid transactions across the selected period</p>
            </div>
            <button
              className="button button-soft"
              onClick={() => window.print()}
            >
              <Download size={15} /> Download report
            </button>
          </div>
          <SalesChart />
          <div className="chart-legend">
            <span>
              <i className="legend-income" /> Income
            </span>
            <span>
              <i className="legend-debt" /> Outcome
            </span>
          </div>
        </div>
      </section>
    );
  return (
    <>
      <div className="stats-grid">
        <StatCard
          label="Income today"
          value={money(incomeToday)}
          change="Recorded today"
          note="All payment methods"
          icon={ArrowDownLeft}
          tint="mint"
        />
        <StatCard
          label="Outcome today"
          value={money(outcomeToday)}
          change="Recorded today"
          note="Business expenses"
          icon={ArrowUpRight}
          tint="peach"
        />
        <StatCard
          label="Open balances"
          value={money(debtBalance)}
          change={`${debts.filter((item) => item.status === "Overdue").length} overdue`}
          note={`across ${debts.filter((item) => item.balance > 0).length} clients`}
          icon={Wallet}
          tint="yellow"
        />
        <StatCard
          label="Returns to review"
          value={String(
            returns.filter((item) => item.status === "Pending").length,
          ).padStart(2, "0")}
          change="Needs attention"
          note="awaiting your decision"
          icon={ArrowDownRight}
          tint="blue"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel payments-panel">
          <SectionHead
            title="Recent payments"
            subtitle="The latest movement in your store."
            action={
              <button className="text-link" onClick={() => setPage("Payments")}>
                View all <ArrowRight size={14} />
              </button>
            }
          />
          <PaymentsTable payments={payments.slice(0, 4)} compact />
        </section>
        <aside className="panel snapshot-panel">
          <div className="snapshot-heading">
            <div>
              <span className="eyebrow">SALES SNAPSHOT</span>
              <h3>Looking good.</h3>
            </div>
            <span className="snapshot-spark">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="snapshot-total">
            {money(incomeToday)}
            <span>today</span>
          </div>
          <SalesChart reportData={reportData} />
          <div className="snapshot-foot">
            <span>
              <i className="online-dot" /> 8 transactions
            </span>
            <button className="text-link" onClick={() => setPage("Reports")}>
              Full report <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      <div className="dashboard-lower">
        <section className="panel mini-panel">
          <SectionHead
            title="Needs a nudge"
            subtitle="Friendly reminders for open balances."
            action={
              <button className="text-link" onClick={() => setPage("Debts")}>
                All debts <ArrowRight size={14} />
              </button>
            }
          />
          <DebtTable
            debts={debts.slice(0, 2)}
            sendReminder={sendReminder}
            compact
          />
        </section>
        <section className="panel mini-panel returns-panel">
          <SectionHead
            title="Returns to review"
            subtitle="A quick look at customer requests."
            action={
              <button
                className="text-link"
                onClick={() => setPage("Sales returns")}
              >
                Review <ArrowRight size={14} />
              </button>
            }
          />
          <ReturnList
            returns={returns.slice(0, 2)}
            updateReturn={updateReturn}
            compact
          />
        </section>
      </div>
      <div className="job-status">
        <span>
          <Activity size={16} />
          <b>Background jobs</b>
        </span>
        <span>
          <i
            className={`online-dot ${jobs.some((job) => job.job_name === "mobile_money_callbacks" && job.status === "failed") ? "job-failed" : ""}`}
          />
          {jobs.find((job) => job.job_name === "mobile_money_callbacks")
            ?.status === "failed"
            ? "Payment callbacks need attention"
            : "Payment callbacks operational"}
        </span>
        <span>
          <i
            className={`online-dot ${jobs.some((job) => job.job_name.includes("email") && job.status === "failed") ? "job-failed" : ""}`}
          />
          {jobs.some(
            (job) => job.job_name.includes("email") && job.status === "failed",
          )
            ? "An email job failed"
            : "Email notifications operational"}
        </span>
        <button title="Settings">
          <Settings2 size={16} />
        </button>
      </div>
    </>
  );
}
