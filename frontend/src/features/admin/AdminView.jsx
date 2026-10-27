import {
  SectionHead,
  PaymentsTable,
  DebtTable,
  LedgerTable,
  ReturnList,
  ProductGrid,
  ReportCard,
  SalesChart,
  DailyReportTable,
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
  "inline-flex min-h-9 items-center justify-center gap-2 rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800";
const textButton =
  "inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline";

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
  onUpdateJobPriority,
}) {
  const reportSales = (reportData?.payments || [])
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  const productProfit = reportData?.product_profit || [];
  const productRevenue = productProfit.reduce((sum, item) => sum + item.revenue, 0);
  const productCost = productProfit.reduce((sum, item) => sum + item.cost, 0);
  const knownProfit = productProfit.reduce(
    (sum, item) => sum + (item.profit ?? 0),
    0,
  );
  const missingCostQuantity = productProfit.reduce(
    (sum, item) => sum + (item.missing_cost_quantity || 0),
    0,
  );
  const profitByProduct = new Map(
    productProfit.map((item) => [String(item.product_id), item]),
  );
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const reportJobs = [...(reportData?.jobs || jobs)].sort(
    (left, right) =>
      (priorityRank[left.priority] ?? 1) - (priorityRank[right.priority] ?? 1) ||
      left.job_name.localeCompare(right.job_name),
  );
  const highPriorityJobs = jobs.filter((job) => job.priority === "high");
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
        <div className="overflow-hidden rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
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
          subtitle="Sales, debt payments, and returns are recorded automatically."
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <span className="text-sm text-stone-600 dark:text-stone-400">Total income</span><b className="font-semibold text-stone-900 dark:text-stone-100">
              {money(
                ledger
                  .filter((entry) => entry.type === "Income")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div className="flex items-center justify-between rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <span className="text-sm text-stone-600 dark:text-stone-400">Total outcome</span><b className="font-semibold text-stone-900 dark:text-stone-100">
              {money(
                ledger
                  .filter((entry) => entry.type === "Outcome")
                  .reduce((sum, item) => sum + item.amount, 0),
              )}
            </b>
          </div>
          <div className="flex items-center justify-between rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <span className="text-sm text-stone-600 dark:text-stone-400">Net position</span><b className="font-semibold text-stone-900 dark:text-stone-100">
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
        <ProductGrid
          products={products}
          admin
          profitByProduct={profitByProduct}
        />
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
              className="min-h-10 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 text-sm text-stone-700 dark:text-stone-300 outline-none focus:border-emerald-700"
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
          <ReportCard
            icon={ArrowDownLeft}
            label="Product revenue"
            value={money(productRevenue)}
            detail="From paid and approved sales"
            tint="mint"
          />
          <ReportCard
            icon={Wallet}
            label="Product cost"
            value={money(productCost)}
            detail={`${missingCostQuantity} units missing cost data`}
            tint="peach"
          />
          <ReportCard
            icon={Activity}
            label="Known product profit"
            value={money(knownProfit)}
            detail="Revenue less recorded product cost"
            tint={knownProfit < 0 ? "peach" : "yellow"}
          />
        </div>
        <div className="overflow-hidden rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="border-b border-stone-200 dark:border-stone-800 px-4 py-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Product profit and loss</h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Product costs are captured when a bill is created. Legacy sales without cost data are excluded from profit.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800 text-[10px] uppercase text-stone-500 dark:text-stone-400">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Units</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Profit / loss</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {productProfit.map((item) => (
                  <tr className="border-t border-stone-100 dark:border-stone-800" key={item.product_id}>
                    <td className="p-3">
                      <b className="block font-medium text-stone-800 dark:text-stone-200">{item.name}</b>
                      <small className="text-stone-500 dark:text-stone-400">{item.category}</small>
                    </td>
                    <td className="p-3 text-stone-700 dark:text-stone-300">{item.quantity}</td>
                    <td className="p-3 font-medium text-stone-800 dark:text-stone-200">{money(item.revenue)}</td>
                    <td className="p-3 text-stone-700 dark:text-stone-300">{money(item.cost)}</td>
                    <td className={`p-3 font-semibold ${item.profit < 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-800 dark:text-emerald-300"}`}>
                      {item.profit === null ? "—" : money(item.profit)}
                    </td>
                    <td className="p-3">
                      {item.missing_cost_quantity > 0 ? (
                        <span className="rounded bg-amber-100 dark:bg-amber-900 px-2 py-1 text-[10px] font-medium text-amber-900 dark:text-amber-200">
                          Cost missing ({item.missing_cost_quantity})
                        </span>
                      ) : (
                        <span className={`rounded px-2 py-1 text-[10px] font-medium ${item.profit < 0 ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"}`}>
                          {item.profit < 0 ? "Loss" : "Profit"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productProfit.length === 0 && (
              <p className="p-5 text-sm text-stone-500 dark:text-stone-400">No product sales in this period.</p>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="border-b border-stone-200 dark:border-stone-800 px-4 py-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Background job priorities</h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Set how urgently administrators should respond to each job.</p>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {reportJobs.map((job) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" key={job.job_name}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{job.job_name.replaceAll("_", " ")}</b>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        job.priority === "high"
                          ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                          : job.priority === "low"
                            ? "bg-sky-100 dark:bg-sky-900 text-sky-900 dark:text-sky-200"
                            : "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {(job.priority || "medium").toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Status: {job.status}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                  Priority
                  <select
                    className="min-h-9 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 text-xs text-stone-700 dark:text-stone-300"
                    value={job.priority || "medium"}
                    onChange={(event) => onUpdateJobPriority?.(job.job_name, event.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
              </div>
            ))}
            {reportJobs.length === 0 && (
              <p className="p-5 text-sm text-stone-500 dark:text-stone-400">No monitored jobs registered.</p>
            )}
          </div>
        </div>
        <div className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">Sales activity</h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Daily income and outcome recorded in the selected period</p>
            </div>
            <button
              className={softButton}
              onClick={() => window.print()}
            >
              <Download size={15} /> Download report
            </button>
          </div>
          <SalesChart reportData={reportData} />
          <div className="mt-3 flex gap-4 text-xs text-stone-600 dark:text-stone-400">
            <span><i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-600" />Income</span>
            <span><i className="mr-1.5 inline-block size-2 rounded-full bg-orange-300" />Outcome</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div className="border-b border-stone-200 dark:border-stone-800 px-4 py-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Daily reports</h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Only days with recorded income or outcome are listed.
            </p>
          </div>
          <DailyReportTable reportData={reportData} />
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
        <section className="min-w-0 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
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
        <aside className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">SALES SNAPSHOT</span>
              <h3 className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-100">Looking good.</h3>
            </div>
            <span className="grid size-8 place-items-center rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="my-4 text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {money(incomeToday)} <span className="text-xs font-normal text-stone-500 dark:text-stone-400">today</span>
          </div>
          <SalesChart reportData={reportData} />
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
            <span>
              <i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" />{" "}
              {reportData?.payments?.length ||
                payments.filter((payment) => payment.status === "Paid").length}{" "}
              transactions
            </span>
            <button className={textButton} onClick={() => setPage("Reports")}>
              Full report <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
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
        <section className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
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
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 text-xs text-stone-600 dark:text-stone-400">
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
        <span>
          <i className={`mr-1.5 inline-block size-2 rounded-full ${highPriorityJobs.length ? "bg-rose-500" : "bg-emerald-500"}`} />
          {highPriorityJobs.length
            ? `${highPriorityJobs.length} high priority job${highPriorityJobs.length === 1 ? "" : "s"}`
            : "Job priorities normal"}
        </span>
        <button title="Settings">
          <Settings2 size={16} className="ml-auto text-stone-500 dark:text-stone-400" />
        </button>
      </div>
    </>
  );
}
