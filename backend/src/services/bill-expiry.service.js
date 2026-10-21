const { expirePendingBills } = require("./payment.service");
const { updateJob } = require("./email.service");

function startBillExpiryJob() {
  let running = false;

  async function run() {
    if (running) return;
    running = true;
    try {
      await updateJob("bill_expiration", "running");
      const expiredCount = await expirePendingBills();
      await updateJob(
        "bill_expiration",
        "ok",
        expiredCount ? `Expired ${expiredCount} bills.` : "",
      );
    } catch (error) {
      await updateJob("bill_expiration", "failed", error.message);
    } finally {
      running = false;
    }
  }

  void run();
  const timer = setInterval(run, 60 * 1000);
  timer.unref();
  return timer;
}

module.exports = { startBillExpiryJob };
