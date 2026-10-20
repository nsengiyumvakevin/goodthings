export function normalizeProduct(product) {
  return { ...product, id: product.id || product._id };
}

function displayStatus(status) {
  return String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayMethod(method) {
  return String(method || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clientName(client) {
  return [client?.first_name, client?.last_name].filter(Boolean).join(" ");
}

export function normalizePayment(payment) {
  return {
    ...payment,
    id: payment.id || payment._id,
    name: clientName(payment.client_id) || payment.name || "Store purchase",
    method: displayMethod(payment.method),
    status: displayStatus(payment.status),
    date: payment.createdAt
      ? new Date(payment.createdAt).toLocaleString()
      : payment.date,
    items: payment.items?.map((item) => ({
      ...item,
      id: item.id || item._id,
      product: item.product_id || item.product,
    })),
  };
}

export function normalizeDebt(debt) {
  return {
    ...debt,
    id: debt.id || debt._id,
    name: clientName(debt.client_id) || debt.name || "Your account",
    amount: debt.total_amount ?? debt.amount,
    total_amount: debt.total_amount ?? debt.amount,
    paid: debt.amount_paid ?? debt.paid ?? 0,
    amount_paid: debt.amount_paid ?? debt.paid ?? 0,
    status: displayStatus(debt.status),
    review_status:
      debt.review_status ||
      (["pending", "rejected"].includes(debt.status) ? undefined : "accepted"),
  };
}

export function normalizeReturn(item) {
  return {
    ...item,
    id: item.id || item._id,
    client: clientName(item.client_id) || item.client || "Customer",
    status: displayStatus(item.status),
  };
}

export function normalizeLedgerEntry(entry, type) {
  return {
    ...entry,
    id: entry.id || entry._id,
    type,
    date: entry.date ? new Date(entry.date).toLocaleDateString() : "",
  };
}
