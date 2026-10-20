import { useEffect, useMemo, useState } from "react";
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
import "./App.css";

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

function App() {
  const [role, setRole] = useState(
    () =>
      JSON.parse(localStorage.getItem("transaction-user") || "null")?.role ||
      "admin",
  );
  const [page, setPage] = useState("Overview");
  const [auth, setAuth] = useState(() =>
    JSON.parse(localStorage.getItem("transaction-user") || "null"),
  );
  const [authChecking, setAuthChecking] = useState(() =>
    Boolean(localStorage.getItem("transaction-token")),
  );
  const [showAuth, setShowAuth] = useState(() =>
    Boolean(new URLSearchParams(window.location.search).get("reset")),
  );
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
  const [reportData, setReportData] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Mobile money");
  const [mobileNumber, setMobileNumber] = useState("");
  const [debtDays, setDebtDays] = useState("30");
  const [activeModal, setActiveModal] = useState("");
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [incomeType, setIncomeType] = useState("Income");
  const [period, setPeriod] = useState("This month");

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
        setPage(session.role === "admin" ? "Overview" : "Shop");
      })
      .catch(() => {
        localStorage.removeItem("transaction-token");
        localStorage.removeItem("transaction-user");
        setAuth(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!auth?.token || authChecking) return;
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
          ] = await Promise.all([
            request("/admin/payments"),
            request("/admin/debts"),
            request("/admin/returns"),
            request("/admin/ledger/income"),
            request("/admin/ledger/outcome"),
            request("/admin/products"),
            request("/admin/overview"),
            request("/admin/jobs"),
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
  }, [auth, authChecking]);

  useEffect(() => {
    if (auth?.role !== "admin" || page !== "Reports") return;
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
    setPage(nextRole === "admin" ? "Overview" : "Shop");
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
    setLoading(true);
    try {
      if (auth?.token) {
        const result = await request("/client/checkout", {
          method: "POST",
          body: JSON.stringify({
            method: paymentMethod.toLowerCase().replaceAll(" ", "_"),
            period_days: Number(debtDays),
            mobile_money_number: mobileNumber,
          }),
        });
        setNotice(result.message || "Your order has been submitted.");
        if (result.payment)
          setPayments((items) => [normalizePayment(result.payment), ...items]);
        setCart([]);
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

  async function saveLedger(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = {
      id: `LG-${Date.now().toString().slice(-3)}`,
      type: incomeType,
      description: form.get("description"),
      amount: Number(form.get("amount")),
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
    setLoading(true);
    try {
      if (auth?.token)
        await request(`/admin/ledger/${incomeType.toLowerCase()}`, {
          method: "POST",
          body: JSON.stringify({
            amount: entry.amount,
            description: entry.description,
          }),
        });
      setLedger((items) => [entry, ...items]);
      setNotice(`${incomeType} recorded`);
      event.currentTarget.reset();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      name: form.get("name"),
      category: form.get("category"),
      description: form.get("description"),
      price: Number(form.get("price")),
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
          try {
            const result = await request("/auth/forgot-password", {
              method: "POST",
              body: JSON.stringify({ email }),
            });
            setNotice(
              result.development_reset_token
                ? `Development reset token: ${result.development_reset_token}`
                : result.message || "Check your email for a reset link",
            );
            return result;
          } catch (error) {
            setNotice(error.message);
            return null;
          }
        }}
        onReset={async (token, password) => {
          try {
            const result = await request("/auth/reset-password", {
              method: "POST",
              body: JSON.stringify({ token, password }),
            });
            setNotice(result.message);
            return true;
          } catch (error) {
            setNotice(error.message);
            return false;
          }
        }}
      />
    </Modal>
  ) : null;

  if (authChecking) {
    return (
      <main className="auth-checking" aria-label="Checking account permissions">
        <Spinner />
      </main>
    );
  }

  if (!auth?.token) {
    return (
      <>
        <LandingPage
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
          <button className="toast" role="status" aria-live="polite" onClick={() => setNotice("")}>
            <Check size={16} />
            {notice}
            <X size={15} />
          </button>
        )}
      </>
    );
  }

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="#home"
          onClick={(event) => event.preventDefault()}
        >
          <span className="brand-mark">
            <Sparkles size={18} strokeWidth={2.3} />
          </span>
          <span>
            good<span className="brand-light">things</span>
            <small>MARKET & LEDGER</small>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label={`${role} navigation`}>
          {navigation.map(([label, Icon]) => (
            <button
              className={`nav-item ${page === label ? "nav-active" : ""}`}
              key={label}
              onClick={() => {
                setPage(label);
                setMobileNav(false);
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Sales returns" &&
                returns.filter((item) => item.status === "Pending").length >
                  0 && (
                  <i className="nav-count">
                    {returns.filter((item) => item.status === "Pending").length}
                  </i>
                )}
              {label === "Shop" && cartCount > 0 && (
                <i className="nav-count">{cartCount}</i>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <Headphones size={17} />
            </span>
            <div>
              <b>Need a hand?</b>
              <small>We’re right here.</small>
            </div>
            <ArrowRight size={15} />
          </div>
          <div className="user-row">
            <div className="avatar avatar-dark">
              {initials(
                auth?.full_name ||
                  `${auth?.first_name || "Amara"} ${auth?.last_name || "Uwase"}`,
              )}
            </div>
            <div className="user-copy">
              <b>
                {auth?.full_name ||
                  `${auth?.first_name || "Amara"} ${auth?.last_name || "Uwase"}`}
              </b>
              <small>
                {role === "admin" ? "Store administrator" : "Customer account"}
              </small>
            </div>
            <button
              className="icon-button user-more"
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
          className="nav-scrim"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            title="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <b>{page}</b>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label="Search"
                placeholder={
                  role === "admin"
                    ? "Search anything..."
                    : "Find something lovely"
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button notification-button"
              title="Notifications"
              onClick={async () => {
                const latest = payments[0];
                if (role === "admin") {
                  setNotice(
                    latest
                      ? `${latest.name} · ${money(latest.amount)} · ${latest.method} · ${latest.status}`
                      : "No recent payment updates.",
                  );
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
              <i />
            </button>
          </div>
        </header>

        {notice && (
          <button className="toast" role="status" aria-live="polite" onClick={() => setNotice("")}>
            <Check size={16} />
            {notice}
            <X size={15} />
          </button>
        )}

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                SUNDAY, OCTOBER 18, 2026 <span>·</span>{" "}
                {role === "admin" ? "STORE OVERVIEW" : "YOUR LITTLE CORNER"}
              </div>
              <h1>
                {page === "Overview" ? (
                  <>
                    A lovely day to
                    <br className="mobile-break" /> make things <em>happen.</em>
                  </>
                ) : page === "Shop" ? (
                  <>
                    A little something
                    <br className="mobile-break" /> for <em>every day.</em>
                  </>
                ) : (
                  pageTitle
                )}
              </h1>
              <p>
                {page === "Overview"
                  ? "Here’s what’s happening with your shop today."
                  : page === "Shop"
                    ? "Thoughtful goods, ready when you are."
                    : role === "admin"
                      ? "A clear view of what matters, all in one place."
                      : "Everything you need, all in one place."}
              </p>
            </div>
            <div className="heading-actions">
              <button className="button button-soft" onClick={exportReport}>
                <Download size={16} /> Export
              </button>
              <button
                className="button button-primary"
                onClick={() =>
                  role === "admin" ? setActiveModal("record") : setPage("Shop")
                }
              >
                <Plus size={17} />{" "}
                {role === "admin" ? "New record" : "Browse shop"}
              </button>
            </div>
          </div>

          {role === "admin" && (
            <AdminView
              page={page}
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
            />
          )}
          {role === "client" && (
            <ClientView
              page={page}
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
              loading={loading}
              debts={filteredDebts}
              returns={filteredReturns}
              payments={filteredPayments}
              setActiveModal={setActiveModal}
              payDebt={payDebt}
            />
          )}
        </div>
      </main>

      {activeModal === "record" && (
        <Modal title="Record a transaction" onClose={() => setActiveModal("")}>
          <form
            className="stack-form"
            onSubmit={(event) => {
              saveLedger(event);
              setActiveModal("");
            }}
          >
            <label>
              Type
              <select
                value={incomeType}
                onChange={(event) => setIncomeType(event.target.value)}
              >
                <option>Income</option>
                <option>Outcome</option>
              </select>
            </label>
            <label>
              Amount
              <input
                name="amount"
                type="number"
                min="1"
                placeholder="0"
                required
              />
            </label>
            <label>
              Description
              <input
                name="description"
                placeholder="What was this for?"
                required
              />
            </label>
            <button className="button button-primary" disabled={loading}>
              {loading ? <Spinner /> : <Plus size={16} />} Save{" "}
              {incomeType.toLowerCase()}
            </button>
          </form>
        </Modal>
      )}
      {activeModal === "product" && (
        <Modal title="Add a product" onClose={() => setActiveModal("")}>
          <form className="stack-form" onSubmit={saveProduct}>
            <label>
              Product name
              <input name="name" required />
            </label>
            <div className="two-fields">
              <label>
                Category
                <input name="category" required />
              </label>
              <label>
                Price (RWF)
                <input name="price" type="number" min="0" required />
              </label>
            </div>
            <div className="two-fields">
              <label>
                Stock quantity
                <input name="stock_quantity" type="number" min="0" required />
              </label>
              <label>
                Product photo
                <input name="image" type="file" accept="image/*" />
              </label>
            </div>
            <label>
              Or image URL
              <input name="image_url" type="url" />
            </label>
            <label>
              Description
              <textarea name="description" />
            </label>
            <button className="button button-primary" disabled={loading}>
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
          <form className="stack-form" onSubmit={savePartPayment}>
            <p className="form-intro">
              Remaining balance: {money(selectedDebt.balance)}
            </p>
            <label>
              Amount received (RWF)
              <input
                name="amount"
                type="number"
                min="1"
                max={selectedDebt.balance}
                required
              />
            </label>
            <button className="button button-primary" disabled={loading}>
              {loading ? <Spinner /> : <CircleDollarSign size={16} />} Record
              payment
            </button>
          </form>
        </Modal>
      )}
      {authDialog}

      <footer className="app-footer">
        <span>
          goodthings market <b>·</b> A little better, every day.
        </span>
        <span>
          <i className="online-dot" /> All systems operational
        </span>
      </footer>
    </div>
  );
}

export default App;
