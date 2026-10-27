const { reconcilePendingMobileMoneyPayments } = require("./payment.service");
const { updateJob } = require("./email.service");

function startPaymentReconciliationJob() {
  let running = false;

  async function run() {
    if (running) return;
    running = true;
    try {
      await updateJob("payment_reconciliation", "running");
      const { checked, completed } =
        await reconcilePendingMobileMoneyPayments();
      await updateJob(
        "payment_reconciliation",
        "ok",
        checked
          ? `Checked ${checked} pending payment${checked === 1 ? "" : "s"}; ${completed} completed.`
          : "",
      );
    } catch (error) {
      await updateJob("payment_reconciliation", "failed", error.message);
    } finally {
      running = false;
    }
  }

  void run();
  const timer = setInterval(run, 60 * 1000);
  timer.unref();
  return timer;
}

module.exports = { startPaymentReconciliationJob };
