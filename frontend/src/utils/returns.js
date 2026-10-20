export function activeReturns(returns) {
  return returns.some((item) => item.status === "Pending");
}
