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

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900";
const softButton =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50";
const textButton =
  "inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline";

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
      <section className="space-y-5">
        <SectionHead
          title="Payments"
          subtitle="Every sale, transfer and payment promise."
          action={
            <button
              className={softButton}
              onClick={() =>
                setFilter(filter === "All activity" ? "Paid" : "All activity")
              }
            >
              <ListFilter size={16} /> {filter}
            </button>
          }
        />
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          <PaymentsTable payments={payments} confirmCash={confirmCash} />
        </div>
      </section>
    );
  if (page === "Debts")
    return (
      <section className="space-y-5">
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
      <section className="space-y-5">
        <SectionHead
          title="Income & outcome"
          subtitle="A simple record of what comes in and what goes out."
          action={
            <button
              className={primaryButton}
              onClick={() => setActiveModal("record")}
            >
              <Plus size={16} /> Add record
            </button>
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-4">
            <span className="text-sm text-stone-600">Total income</span><b className="font-semibold text-stone-900">
              {money(
                ledger
                  .filter((entry) => entry.type === "Income")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-4">
            <span className="text-sm text-stone-600">Total outcome</span><b className="font-semibold text-stone-900">
              {money(
                ledger
                  .filter((entry) => entry.type === "Outcome")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-4">
            <span className="text-sm text-stone-600">Net position</span><b className="font-semibold text-stone-900">
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
      <section className="space-y-5">
        <SectionHead
          title="Sales returns"
          subtitle="Review requests and decide what happens next."
        />
        <ReturnList returns={returns} updateReturn={updateReturn} />
      </section>
    );
  if (page === "Products")
    return (
      <section className="space-y-5">
        <SectionHead
          title="Product catalogue"
          subtitle="Your best-loved things, ready for the next order."
          action={
            <button
              className={primaryButton}
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
      <section className="space-y-5">
        <SectionHead
          title="Activity reports"
          subtitle="Choose a time period and export a shareable snapshot."
          action={
            <select
              className="min-h-10 rounded border border-stone-300 bg-white px-3 text-sm text-stone-700 outline-none focus:border-emerald-700"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option>This month</option>
              <option>This week</option>
              <option>Last 90 days</option>
            </select>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className="rounded-md border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-stone-900">Sales activity</h3>
              <p className="mt-1 text-xs text-stone-500">Paid transactions across the selected period</p>
            </div>
            <button
              className={softButton}
              onClick={() => window.print()}
            >
              <Download size={15} /> Download report
            </button>
          </div>
          <SalesChart />
          <div className="mt-3 flex gap-4 text-xs text-stone-600">
            <span><i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-600" />Income</span>
            <span><i className="mr-1.5 inline-block size-2 rounded-full bg-orange-300" />Outcome</span>
          </div>
        </div>
      </section>
    );
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
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
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)]">
        <section className="min-w-0 rounded-md border border-stone-200 bg-white p-4">
          <SectionHead
            title="Recent payments"
            subtitle="The latest movement in your store."
            action={
              <button className={textButton} onClick={() => setPage("Payments")}>
                View all <ArrowRight size={14} />
              </button>
            }
          />
          <PaymentsTable payments={payments.slice(0, 4)} compact />
        </section>
        <aside className="rounded-md border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-500">SALES SNAPSHOT</span>
              <h3 className="mt-1 text-base font-semibold text-stone-900">Looking good.</h3>
            </div>
            <span className="grid size-8 place-items-center rounded bg-emerald-50 text-emerald-800">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="my-4 text-2xl font-semibold text-stone-900">
            {money(incomeToday)} <span className="text-xs font-normal text-stone-500">today</span>
          </div>
          <SalesChart reportData={reportData} />
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-500">
            <span>
              <i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" /> 8 transactions
            </span>
            <button className={textButton} onClick={() => setPage("Reports")}>
              Full report <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-md border border-stone-200 bg-white p-4">
          <SectionHead
            title="Needs a nudge"
            subtitle="Friendly reminders for open balances."
            action={
              <button className={textButton} onClick={() => setPage("Debts")}>
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
        <section className="rounded-md border border-stone-200 bg-white p-4">
          <SectionHead
            title="Returns to review"
            subtitle="A quick look at customer requests."
            action={
              <button
                className={textButton}
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
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">
        <span>
          <Activity size={16} />
          <b>Background jobs</b>
        </span>
        <span>
          <i
            className={`mr-1.5 inline-block size-2 rounded-full ${jobs.some((job) => job.job_name === "mobile_money_callbacks" && job.status === "failed") ? "bg-rose-500" : "bg-emerald-500"}`}
          />
          {jobs.find((job) => job.job_name === "mobile_money_callbacks")
            ?.status === "failed"
            ? "Payment callbacks need attention"
            : "Payment callbacks operational"}
        </span>
        <span>
          <i
            className={`mr-1.5 inline-block size-2 rounded-full ${jobs.some((job) => job.job_name.includes("email") && job.status === "failed") ? "bg-rose-500" : "bg-emerald-500"}`}
          />
          {jobs.some(
            (job) => job.job_name.includes("email") && job.status === "failed",
          )
            ? "An email job failed"
            : "Email notifications operational"}
        </span>
        <button title="Settings">
          <Settings2 size={16} className="ml-auto text-stone-500" />
        </button>
      </div>
    </>
  );
}
