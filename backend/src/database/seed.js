const { Product } = require("../../models");

const starterProducts = [
  {
    name: "Organic ground coffee",
    category: "Pantry",
    price: 8500,
    stock_quantity: 24,
    image_url:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=720&q=85",
    description: "Freshly roasted, rich and balanced.",
  },
  {
    name: "Everyday ceramic mug",
    category: "Home",
    price: 6200,
    stock_quantity: 18,
    image_url:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=720&q=85",
    description: "A sturdy stoneware cup for slow mornings.",
  },
  {
    name: "Wildflower honey",
    category: "Pantry",
    price: 7400,
    stock_quantity: 31,
    image_url:
      "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=720&q=85",
    description: "Golden, locally sourced and naturally sweet.",
  },
  {
    name: "Woven market tote",
    category: "Accessories",
    price: 12000,
    stock_quantity: 12,
    image_url:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=720&q=85",
    description: "Roomy, reusable and made for everyday errands.",
  },
  {
    name: "Citrus hand soap",
    category: "Home",
    price: 4800,
    stock_quantity: 36,
    image_url:
      "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=720&q=85",
    description: "Gentle plant-based soap with a bright finish.",
  },
  {
    name: "Roasted cashew mix",
    category: "Pantry",
    price: 5600,
    stock_quantity: 20,
    image_url:
      "https://images.unsplash.com/photo-1505576633757-0ac1084af824?auto=format&fit=crop&w=720&q=85",
    description: "A crisp, lightly salted snack to take along.",
  },
];

async function seedProducts() {
  if (await Product.exists()) return;
  await Product.insertMany(starterProducts);
}

module.exports = { seedProducts };
