import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AdminView } from "./features/admin/AdminView.jsx";
import { ClientView } from "./features/client/ClientView.jsx";
import LandingPage from "./features/landing/LandingPage.jsx";

import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Boxes,
  Check,
  CircleDollarSign,
  CreditCard,
  Download,
  FileChartColumnIncreasing,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { AuthForm, Modal, Spinner } from "./components/shared.jsx";
import {
  initialProducts,
  initialPayments,
  initialDebts,
  initialReturns,
  initialLedger,
  initials,
  money,
} from "./data/demoData.js";
import {
  normalizeDebt,
  normalizeLedgerEntry,
  normalizePayment,
  normalizeProduct,
  normalizeReturn,
} from "./lib/normalize.js";
import request from "./lib/api.js";

function encodeProductImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Choose a product image smaller than 10 MB."));
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The selected image could not be processed."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("The selected image could not be read."));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.78,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Choose a valid image file."));
    };
    image.src = objectUrl;
  });
}

const adminRoutes = {
  Overview: "/admin",
  Payments: "/admin/payments",
  Debts: "/admin/debts",
  "Income & outcome": "/admin/ledger",
  "Sales returns": "/admin/returns",
  Products: "/admin/products",
  Reports: "/admin/reports",
};
const clientRoutes = {
  Shop: "/client/shop",
  "My purchases": "/client/purchases",
  "My debts": "/client/debts",
  Returns: "/client/returns",
};
const routePages = Object.fromEntries(
  Object.entries({ ...adminRoutes, ...clientRoutes }).map(([page, path]) => [
    path,
    page,
  ]),
);
const formLayout = "grid gap-4";
const formLabel =
  "grid gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300";
const formControl =
  "min-h-10 w-full rounded border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";
const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(
    () =>
      JSON.parse(localStorage.getItem("transaction-user") || "null")?.role ||
      "admin",
  );
  const page = routePages[location.pathname];
  const [auth, setAuth] = useState(() =>
    JSON.parse(localStorage.getItem("transaction-user") || "null"),
  );
  const [authChecking, setAuthChecking] = useState(() =>
    Boolean(localStorage.getItem("transaction-token")),
  );
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All activity");
  const [payments, setPayments] = useState(initialPayments);
  const [debts, setDebts] = useState(initialDebts);
  const [returns, setReturns] = useState(initialReturns);
  const [ledger, setLedger] = useState(initialLedger);
  const [products, setProducts] = useState(initialProducts);
  const [adminStats, setAdminStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Mobile money");
  const [mobileNumber, setMobileNumber] = useState("");
  const [debtDays, setDebtDays] = useState("30");
  const [activeModal, setActiveModal] = useState("");
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [period, setPeriod] = useState("This month");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("transaction-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("transaction-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const adminPages = [
    ["Overview", LayoutDashboard],
    ["Payments", CreditCard],
    ["Debts", CircleDollarSign],
    ["Income & outcome", ArrowDownLeft],
    ["Sales returns", ArrowDownRight],
    ["Products", Boxes],
    ["Reports", FileChartColumnIncreasing],
  ];
  const clientPages = [
    ["Shop", ShoppingBag],
    ["My purchases", CreditCard],
    ["My debts", CircleDollarSign],
    ["Returns", ArrowDownRight],
  ];
  const navigation = role === "admin" ? adminPages : clientPages;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const visibleProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [products, query],
  );
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = `${payment.name} ${payment.method} ${payment.status} ${payment.reference || ""} ${payment.items?.map((item) => item.product?.name || item.name).join(" ") || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesFilter =
      filter === "All activity" ||
      payment.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });
  const filteredDebts = debts.filter((debt) =>
    `${debt.name} ${debt.status} ${debt.balance} ${debt.review_status || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const filteredReturns = returns.filter((item) =>
    `${item.client} ${item.product} ${item.reason} ${item.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const filteredLedger = ledger.filter((entry) =>
    `${entry.type} ${entry.description} ${entry.date}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const paidToday = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const debtBalance = debts
    .filter((debt) => ["unpaid", "partial", "overdue"].includes(debt.status.toLowerCase()))
    .reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.paid), 0);

  useEffect(() => {
    const token = localStorage.getItem("transaction-token");
    if (!token) return;
    request("/auth/me")
      .then((session) => {
        const verifiedUser = { ...session, token };
        localStorage.setItem("transaction-user", JSON.stringify(verifiedUser));
        setAuth(verifiedUser);
        setRole(session.role);
        const routes = session.role === "admin" ? adminRoutes : clientRoutes;
        const requestedPage = routePages[location.pathname];
        navigate(
          routes[requestedPage] ||
            (session.role === "admin" ? adminRoutes.Overview : clientRoutes.Shop),
          { replace: true },
        );
      })
      .catch(() => {
        localStorage.removeItem("transaction-token");
        localStorage.removeItem("transaction-user");
        setAuth(null);
      })
      .finally(() => setAuthChecking(false));
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!auth?.token || authChecking || !page) return;
    const load = async () => {
      try {
        if (auth.role === "admin") {
          const [
            paymentData,
            debtData,
            returnData,
            incomeData,
            outcomeData,
            productData,
            overview,
            jobData,
            notificationData,
          ] = await Promise.all([
            request("/admin/payments"),
            request("/admin/debts"),
            request("/admin/returns"),
            request("/admin/ledger/income"),
            request("/admin/ledger/outcome"),
            request("/admin/products"),
            request("/admin/overview"),
            request("/admin/jobs"),
            request("/admin/notifications"),
          ]);
          setPayments(paymentData.map(normalizePayment));
          setDebts(debtData.map(normalizeDebt));
          setReturns(returnData.map(normalizeReturn));
          setLedger(
            [
              ...incomeData.map((entry) =>
                normalizeLedgerEntry(entry, "Income"),
              ),
              ...outcomeData.map((entry) =>
                normalizeLedgerEntry(entry, "Outcome"),
              ),
            ].sort((left, right) => new Date(right.date) - new Date(left.date)),
          );
          setProducts(productData.map(normalizeProduct));
          setAdminStats(overview);
          setJobs(jobData);
          setAdminNotifications(notificationData);
        } else {
          const [productData, debtData, returnData, purchaseData, cartData] =
            await Promise.all([
              request("/products"),
              request("/client/debts"),
              request("/client/returns"),
              request("/client/purchases"),
              request("/client/cart"),
            ]);
          setProducts(productData.map(normalizeProduct));
          setDebts(debtData.map(normalizeDebt));
          setReturns(returnData.map(normalizeReturn));
          setPayments(purchaseData.map(normalizePayment));
          setCart(
            cartData.map((item) => {
              const product = normalizeProduct(item.product_id);
              return {
                ...product,
                id: product.id,
                cartItemId: item._id,
                quantity: item.quantity,
                price: item.unit_price,
              };
            }),
          );
        }
      } catch (error) {
        setNotice(error.message);
      }
    };
    load();
  }, [auth, authChecking, page]);

  useEffect(() => {
    if (
      auth?.role !== "admin" ||
      !["Overview", "Products", "Reports"].includes(page)
    )
      return;
    const end = new Date();
    const start = new Date(end);
    if (period === "This week") start.setDate(start.getDate() - 7);
    else if (period === "Last 90 days") start.setDate(start.getDate() - 90);
    else start.setDate(1);
    request(
      `/admin/reports?start=${start.toISOString()}&end=${end.toISOString()}`,
    )
      .then(setReportData)
      .catch((error) => setNotice(error.message));
  }, [auth, page, period]);

  function changeRole(nextRole) {
    setRole(nextRole);
    navigate(nextRole === "admin" ? adminRoutes.Overview : clientRoutes.Shop);
    setMobileNav(false);
  }

  function setPage(nextPage) {
    const route = (role === "admin" ? adminRoutes : clientRoutes)[nextPage];
    if (route) navigate(route);
    setMobileNav(false);
  }

  async function addToCart(product) {
    if (auth?.token && auth.role === "client") {
      try {
        const item = await request("/client/cart", {
          method: "POST",
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        });
        const normalizedProduct = normalizeProduct(item.product_id);
        const cartItem = {
          ...normalizedProduct,
          id: normalizedProduct.id,
          cartItemId: item._id,
          quantity: item.quantity,
          price: item.unit_price,
        };
        setCart((items) =>
          items.some((current) => current.id === cartItem.id)
            ? items.map((current) =>
                current.id === cartItem.id ? cartItem : current,
              )
            : [...items, cartItem],
        );
        setNotice(`${product.name} added to your bag`);
      } catch (error) {
        setNotice(error.message);
      }
      return;
    }
    setCart((items) => {
      const current = items.find((item) => item.id === product.id);
      return current
        ? items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your bag`);
  }

  async function updateQuantity(productId, delta) {
    const current = cart.find((item) => item.id === productId);
    if (auth?.token && current?.cartItemId) {
      try {
        if (current.quantity + delta < 1) {
          await request(`/client/cart/${current.cartItemId}`, {
            method: "DELETE",
          });
          setCart((items) => items.filter((item) => item.id !== productId));
        } else {
          const item = await request(`/client/cart/${current.cartItemId}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity: current.quantity + delta }),
          });
          setCart((items) =>
            items.map((entry) =>
              entry.id === productId
                ? { ...entry, quantity: item.quantity }
                : entry,
            ),
          );
        }
      } catch (error) {
        setNotice(error.message);
      }
      return;
    }
    setCart((items) =>
      items
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function checkout() {
    if (!cart.length) return;
    if (paymentMethod === "Mobile money") return;
    setLoading(true);
    try {
      if (auth?.token) {
        const result = await request("/client/checkout", {
          method: "POST",
          body: JSON.stringify({
            method: paymentMethod.toLowerCase().replaceAll(" ", "_"),
            period_days: Number(debtDays),
          }),
        });
        if (result.payment)
          setPayments((items) => [normalizePayment(result.payment), ...items]);
        setCart([]);
        setNotice(result.message || "Your bill has been created.");
        navigate(clientRoutes["My purchases"]);
      } else {
        setNotice("Sign in as a client to place an order.");
        setAuthMode("login");
        setShowAuth(true);
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function startMobileMoneyCheckout(phoneNumber) {
    setLoading(true);
    try {
      const result = await request("/client/checkout", {
        method: "POST",
        body: JSON.stringify({
          method: "mobile_money",
          mobile_money_number: phoneNumber,
        }),
      });
      if (result.payment)
        setPayments((items) => [normalizePayment(result.payment), ...items]);
      setNotice(result.message || "Approve the payment on your phone.");
      return result.payment;
    } catch (error) {
      setNotice(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function checkMobileMoneyStatus(payment) {
    if (!payment?.bill_id)
      throw new Error("A bill reference is required to check payment status.");
    const result = await request(
      `/client/bills/${encodeURIComponent(payment.bill_id)}/status`,
    );
    if (result.verification_error) throw new Error(result.verification_error);
    const checked = normalizePayment(result);
    setPayments((items) => [
      checked,
      ...items.filter((item) => item.id !== checked.id),
    ]);
    return checked;
  }

  function completeMobileMoneyPayment(payment) {
    setCart([]);
    setNotice(
      `Payment successful${payment?.bill_id ? ` for ${payment.bill_id}` : ""}.`,
    );
  }

  async function findBill(billId) {
    const payment = normalizePayment(
      await request(`/client/bills/${encodeURIComponent(billId)}`),
    );
    setPayments((items) => [
      payment,
      ...items.filter((item) => item.id !== payment.id),
    ]);
    return payment;
  }

  async function payBill(billId, phoneNumber) {
    const result = await request(
      `/client/bills/${encodeURIComponent(billId)}/pay`,
      {
        method: "POST",
        body: JSON.stringify({ mobile_money_number: phoneNumber }),
      },
    );
    if (result.payment) {
      const payment = normalizePayment(result.payment);
      setPayments((items) => [
        payment,
        ...items.filter((item) => item.id !== payment.id),
      ]);
    }
    setNotice(result.message);
    return result;
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      name: form.get("name"),
      category: form.get("category"),
      description: form.get("description"),
      price: Number(form.get("price")),
      cost_price:
        form.get("cost_price") === "" ? null : Number(form.get("cost_price")),
      stock_quantity: Number(form.get("stock_quantity")),
      image_url: form.get("image_url"),
    };
    setLoading(true);
    try {
      const imageFile = form.get("image");
      if (imageFile?.size) product.image_url = await encodeProductImage(imageFile);
      const created = await request("/admin/products", {
        method: "POST",
        body: JSON.stringify(product),
      });
      setProducts((items) => [normalizeProduct(created), ...items]);
      setActiveModal("");
      setNotice(`${created.name} added to the catalogue`);
      event.currentTarget.reset();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCash(payment) {
    setLoading(true);
    try {
      const confirmed = await request(
        `/admin/payments/${payment.id}/confirm-cash`,
        { method: "POST" },
      );
      setPayments((items) =>
        items.map((item) =>
          item.id === payment.id
            ? { ...item, ...normalizePayment(confirmed) }
            : item,
        ),
      );
      setNotice(`Cash payment for ${payment.name} confirmed`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openAdminNotifications() {
    try {
      setAdminNotifications(await request("/admin/notifications"));
      setActiveModal("notifications");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function markNotificationRead(notification) {
    try {
      const updated = await request(
        `/admin/notifications/${notification._id}/read`,
        { method: "PATCH" },
      );
      setAdminNotifications((items) =>
        items.map((item) =>
          item._id === notification._id ? updated : item,
        ),
      );
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateReturn(item, status) {
    try {
      if (auth?.token)
        await request(`/admin/returns/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: status.toLowerCase() }),
        });
      setReturns((items) =>
        items.map((entry) =>
          entry.id === item.id ? { ...entry, status } : entry,
        ),
      );
      setNotice(`Return ${status.toLowerCase()}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function createReturn(cartItemId, quantity, reason) {
    if (!auth?.token) {
      setNotice("Sign in as a client to request a return.");
      setAuthMode("login");
      setShowAuth(true);
      return false;
    }
    try {
      const result = await request("/client/returns", {
        method: "POST",
        body: JSON.stringify({ cart_item_id: cartItemId, quantity, reason }),
      });
      setReturns((items) => [normalizeReturn(result), ...items]);
      setNotice("Your return request was submitted.");
      return true;
    } catch (error) {
      setNotice(error.message);
      return false;
    }
  }

  async function sendReminder(debt) {
    setLoading(true);
    try {
      if (auth?.token)
        await request(`/admin/debts/${debt.id}/reminder`, { method: "POST" });
      setNotice(`Payment reminder sent to ${debt.name}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateJobPriority(jobName, priority) {
    try {
      const updated = await request(
        `/admin/jobs/${encodeURIComponent(jobName)}/priority`,
        { method: "PATCH", body: JSON.stringify({ priority }) },
      );
      setJobs((items) =>
        items.map((job) => (job.job_name === jobName ? updated : job)),
      );
      setReportData((data) =>
        data
          ? {
              ...data,
              jobs: (data.jobs || []).map((job) =>
                job.job_name === jobName ? updated : job,
              ),
            }
          : data,
      );
      setNotice(`${jobName} priority set to ${priority}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function savePartPayment(event) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    if (!selectedDebt || !Number.isFinite(amount) || amount <= 0) return;
    setLoading(true);
    try {
      const result = await request(
        `/admin/debts/${selectedDebt.id}/part-payment`,
        {
          method: "POST",
          body: JSON.stringify({ amount }),
        },
      );
      setDebts((items) =>
        items.map((debt) =>
          debt.id === selectedDebt.id ? normalizeDebt(result) : debt,
        ),
      );
      setActiveModal("");
      setSelectedDebt(null);
      setNotice("Debt payment recorded");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function reviewDebt(debt, decision) {
    setLoading(true);
    try {
      const updated = await request(`/admin/debts/${debt.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      setDebts((items) =>
        items.map((item) =>
          item.id === debt.id ? normalizeDebt(updated) : item,
        ),
      );
      setPayments((items) =>
        items.map((item) =>
          item.id === String(updated.payment_id)
            ? {
                ...item,
                status: decision === "accept" ? "Unpaid" : "Failed",
              }
            : item,
        ),
      );
      setNotice(`Debt request ${decision === "accept" ? "accepted" : "rejected"}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function payDebt(debt) {
    setLoading(true);
    try {
      const result = await request(`/client/debts/${debt.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ mobile_money_number: mobileNumber }),
      });
      setNotice(result.message);
      if (result.payment)
        setPayments((items) => [normalizePayment(result.payment), ...items]);
      navigate(clientRoutes["My purchases"]);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    const activityRows = reportData
      ? [
          ...(reportData.payments || []).map((payment) => [
            payment.reference,
            `${payment.client_id?.first_name || ""} ${payment.client_id?.last_name || ""}`.trim(),
            payment.amount,
            payment.method,
            payment.status,
            payment.createdAt,
          ]),
          ...(reportData.income || []).map((entry) => [
            entry._id,
            entry.description,
            entry.amount,
            "Income",
            "Recorded",
            entry.date,
          ]),
          ...(reportData.outcome || []).map((entry) => [
            entry._id,
            entry.description,
            entry.amount,
            "Outcome",
            "Recorded",
            entry.date,
          ]),
          ...(reportData.returns || []).map((entry) => [
            entry._id,
            `${entry.client_id?.first_name || ""} ${entry.client_id?.last_name || ""}`.trim(),
            entry.product,
            "",
            entry.status,
            entry.createdAt,
          ]),
          ...(reportData.debts || []).map((entry) => [
            entry.payment_id,
            `${entry.client_id?.first_name || ""} ${entry.client_id?.last_name || ""}`.trim(),
            entry.balance,
            "Debt",
            entry.status,
            entry.created_at,
          ]),
        ]
      : payments.map(({ id, name, amount, method, status, date }) => [
          id,
          name,
          amount,
          method,
          status,
          date,
        ]);
    const rows = [
      ["Reference", "Activity", "Amount or item", "Type", "Status", "Date"],
      ...activityRows,
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "transaction-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function authenticate(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const register = authMode === "register";
      const path =
        authMode === "admin"
          ? "/auth/admin/login"
          : register
            ? "/auth/register"
            : "/auth/login";
      const payload =
        authMode === "admin"
          ? { email: form.get("email"), password: form.get("password") }
          : register
            ? {
                first_name: form.get("first_name"),
                last_name: form.get("last_name"),
                email: form.get("email"),
                password: form.get("password"),
              }
            : {
                username: form.get("username"),
                password: form.get("password"),
              };
      const result = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const user = {
        ...result.user,
        token: result.token,
        role: result.role || (authMode === "admin" ? "admin" : "client"),
      };
      localStorage.setItem("transaction-token", result.token);
      localStorage.setItem("transaction-user", JSON.stringify(user));
      setAuth(user);
      changeRole(user.role);
      setShowAuth(false);
      setNotice(`Welcome${user.first_name ? `, ${user.first_name}` : ""}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("transaction-token");
    localStorage.removeItem("transaction-user");
    setAuth(null);
    navigate("/");
    setNotice("You have been signed out");
  }

  const pageTitle = page === "Overview" ? "Good morning" : page;

  const authDialog = showAuth ? (
    <Modal
      title={
        authMode === "admin"
          ? "Administrator sign in"
          : authMode === "register"
            ? "Create your account"
            : "Client sign in"
      }
      onClose={() => setShowAuth(false)}
    >
      <AuthForm
        authMode={authMode}
        setAuthMode={setAuthMode}
        authenticate={authenticate}
        loading={loading}
        onForgot={async (email) => {
          setLoading(true);
          try {
            const result = await request("/auth/forgot-password", {
              method: "POST",
              body: JSON.stringify({ email }),
            });
            setNotice(
              result.development_reset_code
                ? `Development reset code: ${result.development_reset_code}`
                : result.message || "Check your email for a reset code",
            );
            return result;
          } catch (error) {
            setNotice(error.message);
            return null;
          } finally {
            setLoading(false);
          }
        }}
        onReset={async (email, code, password) => {
          setLoading(true);
          try {
            const result = await request("/auth/reset-password", {
              method: "POST",
              body: JSON.stringify({ email, code, password }),
            });
            setNotice(result.message);
            return true;
          } catch (error) {
            setNotice(error.message);
            return false;
          } finally {
            setLoading(false);
          }
        }}
      />
    </Modal>
  ) : null;

  const renderAdminPage = (routePage) => (
    <AdminView
      page={routePage}
      payments={filteredPayments}
      debts={filteredDebts}
      returns={filteredReturns}
      ledger={filteredLedger}
      debtBalance={debtBalance}
      filter={filter}
      setFilter={setFilter}
      setActiveModal={setActiveModal}
      sendReminder={sendReminder}
      updateReturn={updateReturn}
      setPage={setPage}
      period={period}
      setPeriod={setPeriod}
      products={visibleProducts}
      incomeToday={adminStats?.income_today ?? paidToday}
      outcomeToday={adminStats?.outcome_today ?? 0}
      clientCount={adminStats?.clients ?? 0}
      confirmCash={confirmCash}
      reportData={reportData}
      jobs={jobs}
      onPartPayment={(debt) => {
        setSelectedDebt(debt);
        setActiveModal("part-payment");
      }}
      reviewDebt={reviewDebt}
      onUpdateJobPriority={updateJobPriority}
    />
  );

  const renderClientPage = (routePage) => (
    <ClientView
      page={routePage}
      products={visibleProducts}
      cart={cart}
      cartCount={cartCount}
      cartTotal={cartTotal}
      addToCart={addToCart}
      updateQuantity={updateQuantity}
      paymentMethod={paymentMethod}
      setPaymentMethod={setPaymentMethod}
      mobileNumber={mobileNumber}
      setMobileNumber={setMobileNumber}
      createReturn={createReturn}
      debtDays={debtDays}
      setDebtDays={setDebtDays}
      checkout={checkout}
      startMobileMoneyCheckout={startMobileMoneyCheckout}
      checkMobileMoneyStatus={checkMobileMoneyStatus}
      completeMobileMoneyPayment={completeMobileMoneyPayment}
      loading={loading}
      debts={filteredDebts}
      returns={filteredReturns}
      payments={filteredPayments}
      setActiveModal={setActiveModal}
      payDebt={payDebt}
      findBill={findBill}
      payBill={payBill}
    />
  );

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100 dark:bg-stone-950" aria-label="Checking account permissions">
        <Spinner />
      </main>
    );
  }

  if (!auth?.token) {
    if (location.pathname !== "/") return <Navigate to="/" replace />;
    return (
      <>
        <LandingPage
          theme={theme}
          onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")}
          onClientSignIn={() => {
            setRole("client");
            setAuthMode("login");
            setShowAuth(true);
          }}
          onClientRegister={() => {
            setRole("client");
            setAuthMode("register");
            setShowAuth(true);
          }}
          onAdminSignIn={() => {
            setRole("admin");
            setAuthMode("admin");
            setShowAuth(true);
          }}
        />
        {authDialog}
        {notice && (
          <button className="fixed right-4 top-4 z-50 flex max-w-[min(440px,calc(100vw-2rem))] items-center gap-2.5 rounded-md bg-emerald-900 px-4 py-3 text-left text-sm text-white shadow-xl" role="status" aria-live="polite" onClick={() => setNotice("")}>
            <Check size={16} />
            {notice}
            <X size={15} />
          </button>
        )}
      </>
    );
  }

  const roleRoutes = role === "admin" ? adminRoutes : clientRoutes;
  if (location.pathname === "/")
    return <Navigate to={roleRoutes[role === "admin" ? "Overview" : "Shop"]} replace />;
  if (!roleRoutes[page])
    return <Navigate to={roleRoutes[role === "admin" ? "Overview" : "Shop"]} replace />;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex h-screen w-65 flex-col bg-emerald-950 p-5 text-emerald-50 shadow-2xl transition-transform lg:sticky lg:top-0 lg:z-20 lg:w-auto lg:shadow-none ${mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <NavLink
          className="flex items-center gap-3 text-lg font-bold leading-tight text-white no-underline"
          to="/"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-lime-200 text-emerald-950">
            <Sparkles size={18} strokeWidth={2.3} />
          </span>
          <span>
            good<span className="font-medium text-emerald-200">things</span>
            <small className="mt-1 block text-[9px] font-semibold text-emerald-200/75">MARKET & LEDGER</small>
          </span>
        </NavLink>
        <div className="mb-3 mt-10 px-2 text-[10px] font-bold text-emerald-200/70">WORKSPACE</div>
        <nav className="grid gap-1" aria-label={`${role} navigation`}>
          {navigation.map(([label, Icon]) => (
            <NavLink
              to={(role === "admin" ? adminRoutes : clientRoutes)[label]}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition ${isActive ? "bg-lime-100 font-semibold text-emerald-950" : "text-emerald-100/80 hover:bg-white/10 hover:text-white"}`}
              key={label}
              end
              onClick={() => setMobileNav(false)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Sales returns" &&
                returns.filter((item) => item.status === "Pending").length >
                  0 && (
                  <i className="ml-auto min-w-5 rounded-full bg-lime-200 px-1.5 py-0.5 text-center text-[10px] not-italic text-emerald-950">
                    {returns.filter((item) => item.status === "Pending").length}
                  </i>
                )}
              {label === "Shop" && cartCount > 0 && (
                <i className="ml-auto min-w-5 rounded-full bg-lime-200 px-1.5 py-0.5 text-center text-[10px] not-italic text-emerald-950">{cartCount}</i>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-emerald-100">
            <span className="grid size-8 place-items-center rounded bg-white/10 text-lime-100">
              <Headphones size={17} />
            </span>
            <div>
              <b className="block text-xs">Need a hand?</b>
              <small className="mt-0.5 block text-[10px] text-emerald-100/70">We’re right here.</small>
            </div>
            <ArrowRight className="ml-auto" size={15} />
          </div>
          <div className="flex items-center gap-2.5 border-t border-white/15 pt-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-100 text-xs font-bold text-emerald-950">
              {initials(
                auth?.full_name ||
                  `${auth?.first_name || "Amara"} ${auth?.last_name || "Uwase"}`,
              )}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-xs text-white">
                {auth?.full_name ||
                  `${auth?.first_name || "Amara"} ${auth?.last_name || "Uwase"}`}
              </b>
              <small className="mt-0.5 block text-[10px] text-emerald-100/70">
                {role === "admin" ? "Store administrator" : "Customer account"}
              </small>
            </div>
            <button
              className="grid size-9 place-items-center rounded text-emerald-100 hover:bg-white/10"
              title="Sign out"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="fixed inset-0 z-20 bg-stone-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <main className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex min-h-17 items-center gap-3 border-b border-stone-200 bg-white/95 px-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 sm:justify-between sm:px-6 lg:px-9">
          <button
            className="grid size-9 shrink-0 place-items-center rounded text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 lg:hidden"
            title="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span className="hidden sm:inline">Workspace</span>
            <span className="hidden text-stone-300 dark:text-stone-600 sm:inline">/</span>
            <b className="text-stone-900 dark:text-stone-100">{page}</b>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-2.5 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 sm:w-64 sm:flex-none">
              <Search className="shrink-0" size={16} />
              <input
                className="w-full min-w-0 bg-transparent text-xs text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
                aria-label="Search"
                placeholder={
                  role === "admin"
                    ? "Search anything..."
                    : "Find something lovely"
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd className="hidden whitespace-nowrap rounded border border-stone-200 bg-white px-1 text-[10px] text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 md:inline">⌘ K</kbd>
            </label>
            <button
              className="grid size-9 shrink-0 place-items-center rounded text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="relative grid size-9 shrink-0 place-items-center rounded text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              title="Notifications"
              onClick={async () => {
                if (role === "admin") {
                  await openAdminNotifications();
                  return;
                }
                try {
                  const [debtData, cartData] = await Promise.all([
                    request("/client/debts"),
                    request("/client/cart"),
                  ]);
                  setDebts(debtData.map(normalizeDebt));
                  setCart(
                    cartData.map((item) => {
                      const product = normalizeProduct(item.product_id);
                      return {
                        ...product,
                        id: product.id,
                        cartItemId: item._id,
                        quantity: item.quantity,
                        price: item.unit_price,
                      };
                    }),
                  );
                  const decision = debtData.find((debt) =>
                    ["accepted", "rejected"].includes(debt.review_status),
                  );
                  setNotice(
                    decision
                      ? `Your debt request was ${decision.review_status}.`
                      : "No new order updates.",
                  );
                } catch (error) {
                  setNotice(error.message);
                }
              }}
            >
              <Bell size={18} />
              {adminNotifications.some((notification) => !notification.read_at) && <i className="absolute right-1.5 top-1.5 size-2 rounded-full border border-white bg-orange-500" />}
            </button>
          </div>
        </header>

        {notice && (
          <button className="fixed right-4 top-19 z-40 flex max-w-[min(440px,calc(100vw-2rem))] items-center gap-2.5 rounded-md bg-emerald-900 px-4 py-3 text-left text-sm text-white shadow-xl" role="status" aria-live="polite" onClick={() => setNotice("")}>
            <Check size={16} />
            {notice}
            <X size={15} />
          </button>
        )}

        <div className="mx-auto w-full max-w-375 flex-1 px-3 py-6 sm:px-5 lg:px-9 lg:py-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} <span className="px-1 text-stone-300 dark:text-stone-600">·</span>{" "}
                {role === "admin" ? "STORE OVERVIEW" : "YOUR LITTLE CORNER"}
              </div>
              <h1 className="mb-2 text-3xl font-semibold leading-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
                {page === "Overview" ? (
                  <>
                    A lovely day to
                    <br className="hidden sm:block" /> make things <em className="font-serif font-medium text-emerald-800 dark:text-lime-300">happen.</em>
                  </>
                ) : page === "Shop" ? (
                  <>
                    A little something
                    <br className="hidden sm:block" /> for <em className="font-serif font-medium text-emerald-800 dark:text-lime-300">every day.</em>
                  </>
                ) : (
                  pageTitle
                )}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">
                {page === "Overview"
                  ? "Here’s what’s happening with your shop today."
                  : page === "Shop"
                    ? "Thoughtful goods, ready when you are."
                    : role === "admin"
                      ? "A clear view of what matters, all in one place."
                      : "Everything you need, all in one place."}
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 sm:flex-none" onClick={exportReport}>
                <Download size={16} /> Export
              </button>
              <button
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 sm:flex-none"
                onClick={() =>
                  role === "admin" ? setPage("Reports") : setPage("Shop")
                }
              >
                {role === "admin" ? (
                  <FileChartColumnIncreasing size={17} />
                ) : (
                  <Plus size={17} />
                )}
                {role === "admin" ? "View reports" : "Browse shop"}
              </button>
            </div>
          </div>

          <Routes>
            {Object.entries(adminRoutes).map(([routePage, path]) => (
              <Route
                key={path}
                path={path}
                element={
                  role === "admin" ? (
                    renderAdminPage(routePage)
                  ) : (
                    <Navigate to={clientRoutes.Shop} replace />
                  )
                }
              />
            ))}
            {Object.entries(clientRoutes).map(([routePage, path]) => (
              <Route
                key={path}
                path={path}
                element={
                  role === "client" ? (
                    renderClientPage(routePage)
                  ) : (
                    <Navigate to={adminRoutes.Overview} replace />
                  )
                }
              />
            ))}
            <Route
              path="*"
              element={
                <Navigate
                  to={role === "admin" ? adminRoutes.Overview : clientRoutes.Shop}
                  replace
                />
              }
            />
          </Routes>
        </div>
      </main>

      {activeModal === "product" && (
        <Modal title="Add a product" onClose={() => setActiveModal("")}>
          <form className={formLayout} onSubmit={saveProduct}>
            <label className={formLabel}>
              Product name
              <input className={formControl} name="name" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={formLabel}>
                Category
                <input className={formControl} name="category" required />
              </label>
              <label className={formLabel}>
                Price (RWF)
                <input className={formControl} name="price" type="number" min="0" required />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={formLabel}>
                Stock quantity
                <input className={formControl} name="stock_quantity" type="number" min="0" required />
              </label>
              <label className={formLabel}>
                Cost price (RWF)
                <input
                  className={formControl}
                  name="cost_price"
                  type="number"
                  min="0"
                  placeholder="Used for profit reports"
                />
              </label>
            </div>
            <label className={formLabel}>
              Product photo
              <input className="block w-full text-sm text-stone-600 file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100 dark:text-stone-400 dark:file:bg-emerald-950 dark:file:text-emerald-200" name="image" type="file" accept="image/*" />
            </label>
            <label className={formLabel}>
              Or image URL
              <input className={formControl} name="image_url" type="url" />
            </label>
            <label className={formLabel}>
              Description
              <textarea className={`${formControl} min-h-24 py-2`} name="description" />
            </label>
            <button className={primaryButton} disabled={loading}>
              {loading ? <Spinner /> : <Boxes size={16} />} Add product
            </button>
          </form>
        </Modal>
      )}
      {activeModal === "part-payment" && selectedDebt && (
        <Modal
          title={`Record payment · ${selectedDebt.name}`}
          onClose={() => setActiveModal("")}
        >
          <form className={formLayout} onSubmit={savePartPayment}>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Remaining balance: {money(selectedDebt.balance)}
            </p>
            <label className={formLabel}>
              Amount received (RWF)
              <input
                name="amount"
                className={formControl}
                type="number"
                min="1"
                max={selectedDebt.balance}
                required
              />
            </label>
            <button className={primaryButton} disabled={loading}>
              {loading ? <Spinner /> : <CircleDollarSign size={16} />} Record
              payment
            </button>
          </form>
        </Modal>
      )}
      {activeModal === "notifications" && (
        <Modal
          title="Payment notifications"
          onClose={() => setActiveModal("")}
        >
          <div className="grid gap-2">
            {adminNotifications.map((notification) => (
              <article className={`rounded border p-3 ${notification.read_at ? "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"}`} key={notification._id}>
                <p className="mb-2 text-sm text-stone-800 dark:text-stone-200">{notification.message}</p>
                <small className="block text-xs text-stone-500 dark:text-stone-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
                {!notification.read_at && (
                  <button
                    className="mt-2 text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-300"
                    onClick={() => markNotificationRead(notification)}
                  >
                    Mark read
                  </button>
                )}
              </article>
            ))}
            {adminNotifications.length === 0 && (
              <p className="text-sm text-stone-600 dark:text-stone-400">No payment notifications yet.</p>
            )}
          </div>
        </Modal>
      )}
      {authDialog}

      <footer className="flex flex-col gap-2 border-t border-stone-200 px-3 py-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-9">
        <span>
          goodthings market <b>·</b> A little better, every day.
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" /> All systems operational
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
