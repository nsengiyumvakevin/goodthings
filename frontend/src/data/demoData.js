const initialProducts = [
  {
    id: "p1",
    name: "Organic ground coffee",
    category: "Pantry",
    price: 8500,
    stock_quantity: 24,
    image_url:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=720&q=85",
    description: "Freshly roasted, rich and balanced.",
  },
  {
    id: "p2",
    name: "Everyday ceramic mug",
    category: "Home",
    price: 6200,
    stock_quantity: 18,
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=720&q=85",
    description: "A sturdy stoneware cup for slow mornings.",
  },
  {
    id: "p3",
    name: "Wildflower honey",
    category: "Pantry",
    price: 7400,
    stock_quantity: 31,
    image_url:
      "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=720&q=85",
    description: "Golden, locally sourced and naturally sweet.",
  },
  {
    id: "p4",
    name: "Woven market tote",
    category: "Accessories",
    price: 12000,
    stock_quantity: 12,
    image_url:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=720&q=85",
    description: "Roomy, reusable and made for everyday errands.",
  },
  {
    id: "p5",
    name: "Citrus hand soap",
    category: "Home",
    price: 4800,
    stock_quantity: 36,
    image_url:
      "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=720&q=85",
    description: "Gentle plant-based soap with a bright finish.",
  },
  {
    id: "p6",
    name: "Roasted cashew mix",
    category: "Pantry",
    price: 5600,
    stock_quantity: 20,
    image_url:
      "https://images.unsplash.com/photo-1505576633757-0ac1084af824?auto=format&fit=crop&w=720&q=85",
    description: "A crisp, lightly salted snack to take along.",
  },
];
const initialPayments = [
  {
    id: "TX-2048",
    name: "Aline Uwimana",
    amount: 42500,
    method: "Mobile money",
    status: "Paid",
    date: "Today, 10:42",
  },
  {
    id: "TX-2047",
    name: "Eric Niyonzima",
    amount: 18400,
    method: "Cash",
    status: "Paid",
    date: "Today, 09:18",
  },
  {
    id: "TX-2046",
    name: "Claudine Mutesi",
    amount: 32000,
    method: "Debt",
    status: "Overdue",
    date: "Yesterday",
  },
  {
    id: "TX-2045",
    name: "Jean Bosco",
    amount: 12600,
    method: "Mobile money",
    status: "Pending",
    date: "Yesterday",
  },
];
const initialDebts = [
  {
    id: "DB-084",
    name: "Claudine Mutesi",
    amount: 32000,
    paid: 12000,
    due: "18 Oct 2026",
    status: "Overdue",
  },
  {
    id: "DB-083",
    name: "Patrick Habimana",
    amount: 24600,
    paid: 6000,
    due: "26 Oct 2026",
    status: "Partial",
  },
  {
    id: "DB-082",
    name: "Beatrice Mukamana",
    amount: 15800,
    paid: 0,
    due: "04 Nov 2026",
    status: "Unpaid",
  },
];
const initialReturns = [
  {
    id: "RT-019",
    client: "Aline Uwimana",
    product: "Wildflower honey",
    reason: "Jar arrived damaged",
    status: "Pending",
  },
  {
    id: "RT-018",
    client: "Eric Niyonzima",
    product: "Everyday ceramic mug",
    reason: "Wrong colour received",
    status: "Pending",
  },
];
const initialLedger = [
  {
    id: "LG-089",
    type: "Income",
    description: "Daily sales settlement",
    amount: 126400,
    date: "18 Oct 2026",
  },
  {
    id: "LG-088",
    type: "Outcome",
    description: "Packaging supplies",
    amount: 28400,
    date: "18 Oct 2026",
  },
  {
    id: "LG-087",
    type: "Income",
    description: "Mobile money payments",
    amount: 85300,
    date: "17 Oct 2026",
  },
];
const money = (value) => `RWF ${Number(value || 0).toLocaleString("en-US")}`;
const initials = (name) =>
  (name || "Guest")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export {
  initialProducts,
  initialPayments,
  initialDebts,
  initialReturns,
  initialLedger,
  money,
  initials,
};
