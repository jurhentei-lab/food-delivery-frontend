"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/api-base";

const ADMIN_EMAIL = "jurhee@gmail.com";

function setAdminCookie() {
  document.cookie = "auth=1; path=/; max-age=604800; samesite=lax";
  document.cookie = "user_role=admin; path=/; max-age=604800; samesite=lax";
}

function clearAuthCookies() {
  document.cookie = "auth=; path=/; max-age=0; samesite=lax";
  document.cookie = "user_role=; path=/; max-age=0; samesite=lax";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("food-menu");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openAddDish, setOpenAddDish] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [newDish, setNewDish] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  const handleDishImageChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDish((prev) => ({ ...prev, image: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/category`);
      const data = await res.json();
      setCategories(data || []);
      if (!selectedCategory && data?.length) {
        setSelectedCategory(data[0]);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  }, [selectedCategory]);

  const fetchDishesByCategory = async (categoryId) => {
    try {
      const res = await fetch(`${API_BASE}/dish?categoryId=${categoryId}`);
      const data = await res.json();
      setDishes(data || []);
    } catch (err) {
      console.error("Fetch dishes error:", err);
      setDishes([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setOrders([]);
    }
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (!rawUser) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(rawUser);
    const normalizedEmail = String(user?.email || "").trim().toLowerCase();
    const isAdminUser =
      user?.role === "admin" || normalizedEmail === ADMIN_EMAIL;

    if (!isAdminUser) {
      router.push("/main");
      return;
    }

    const safeAdminUser = user.role === "admin" ? user : { ...user, role: "admin" };
    localStorage.setItem("currentUser", JSON.stringify(safeAdminUser));
    setAdminCookie();
    setCurrentUser(safeAdminUser);
    fetchCategories();
  }, [fetchCategories, router]);

  useEffect(() => {
    if (selectedCategory?._id) {
      fetchDishesByCategory(selectedCategory._id);
    } else {
      setDishes([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab !== "orders") return;

    fetchOrders();
    const timer = setInterval(fetchOrders, 3000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const addCategory = async () => {
    if (!newCat.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCat.trim() }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        alert(msg.message || "Category нэмэхэд алдаа гарлаа");
        return;
      }

      const data = await res.json();
      setCategories((prev) => [data, ...prev]);
      setNewCat("");
      setOpenAddCategory(false);
      if (!selectedCategory) {
        setSelectedCategory(data);
      }
    } catch (err) {
      console.error(err);
      alert("Category нэмэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!confirm("Энэ категорийг устгах уу? Категорийн бүх хоол устана.")) return;

    try {
      const res = await fetch(`${API_BASE}/category/${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Категори устгахад алдаа гарлаа");
        return;
      }

      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      if (selectedCategory?._id === categoryId) {
        const rest = categories.filter((c) => c._id !== categoryId);
        setSelectedCategory(rest[0] || null);
      }
    } catch (err) {
      console.error(err);
      alert("Категори устгахад алдаа гарлаа");
    }
  };

  const addDish = async () => {
    if (!selectedCategory?._id) return;
    if (!newDish.name || !newDish.price) {
      alert("Name болон price шаардлагатай");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDish.name.trim(),
          description: newDish.description.trim(),
          price: Number(newDish.price),
          image: newDish.image.trim(),
          categoryId: selectedCategory._id,
        }),
      });

      if (!res.ok) {
        alert("Dish нэмэхэд алдаа гарлаа");
        return;
      }

      setOpenAddDish(false);
      setNewDish({ name: "", description: "", price: "", image: "" });
      fetchDishesByCategory(selectedCategory._id);
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const deleteDish = async (dishId) => {
    if (!confirm("Энэ хоолыг устгах уу?")) return;

    try {
      const res = await fetch(`${API_BASE}/dish/${dishId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Хоол устгахад алдаа гарлаа");
        return;
      }

      setDishes((prev) => prev.filter((d) => d._id !== dishId));
    } catch (err) {
      console.error(err);
      alert("Хоол устгахад алдаа гарлаа");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        alert("Захиалгын төлөв шинэчлэхэд алдаа гарлаа");
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error(err);
      alert("Захиалгын төлөв шинэчлэхэд алдаа гарлаа");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm("Энэ захиалгыг устгах уу?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Захиалга устгахад алдаа гарлаа");
        return;
      }

      setOrders((prev) => prev.filter((order) => order._id !== orderId));
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Захиалга устгахад алдаа гарлаа");
    }
  };

  const activeOrders = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled"
  );

  const confirmLogout = () => {
    localStorage.removeItem("currentUser");
    clearAuthCookies();
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d2332_0%,#0f1118_45%,#0b0d13_100%)] text-white p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1280px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f1118]/80 shadow-2xl backdrop-blur">
      <div className="w-64 border-r border-white/10 bg-white/5 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-red-300">NomNom admin</p>
          <p className="text-sm font-semibold truncate text-white">{currentUser?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("food-menu")}
            className={`w-full px-4 py-3 rounded-lg transition-all ${
              activeTab === "food-menu"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Food menu
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full px-4 py-3 rounded-lg transition-all ${
              activeTab === "orders"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-4 py-3 rounded-lg transition-all text-slate-300 hover:bg-white/10"
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8">
        {activeTab === "food-menu" ? (
          <>
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-red-300">Dashboard</p>
              <h1 className="mt-2 text-2xl font-black text-white">Dishes Category</h1>
            </div>

            <div className="flex gap-3 flex-wrap mb-8">
              {categories.map((c) => (
                <div
                  key={c._id}
                  className={`flex h-11 w-[180px] items-center justify-between gap-2 px-4 rounded-full text-sm border ${
                    selectedCategory?._id === c._id
                      ? "bg-red-600 text-white border-red-500"
                      : "bg-white/5 hover:bg-white/10 border-white/15 text-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setSelectedCategory(c)}
                    className="min-w-0 flex-1 truncate text-left"
                    title={c.name}
                  >
                    {c.name}
                  </button>
                  <button
                    onClick={() => deleteCategory(c._id)}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setOpenAddCategory(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-red-400/70 bg-red-600/80 text-white text-xl hover:bg-red-500"
              >
                +
              </button>
            </div>

            {selectedCategory ? (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-white">
                  {selectedCategory.name} ({dishes.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div
                    onClick={() => setOpenAddDish(true)}
                    className="border-2 border-dashed border-white/20 rounded-xl h-60 flex flex-col items-center justify-center text-slate-300 hover:border-red-400 hover:text-red-300 cursor-pointer transition-all bg-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl mb-3">
                      +
                    </div>
                    <p className="text-xs font-medium">Add new Dish to</p>
                    <p className="text-xs font-semibold text-white">{selectedCategory.name}</p>
                  </div>

                  {dishes.map((dish) => (
                    <div
                      key={dish._id}
                      className="rounded-xl overflow-hidden bg-white/95 border border-white/10 shadow-sm hover:shadow-2xl transition-all duration-200 relative group"
                    >
                      <div className="h-44 bg-gray-50 relative flex items-center justify-center overflow-hidden">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No image</span>
                        )}

                        <button
                          onClick={() => deleteDish(dish._id)}
                          className="absolute top-2 right-2 w-9 h-9 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-md"
                        >
                          ×
                        </button>
                      </div>

                      <div className="p-4">
                        <p className="font-semibold text-lg text-gray-900">{dish.name}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {dish.description || "No description"}
                        </p>
                        <p className="font-bold text-red-500 mt-3 text-xl">
                          ${Number(dish.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 py-10 text-center">Категори сонгоно уу</p>
            )}

            {openAddCategory && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171b26] p-6 shadow-2xl">
                  <h2 className="text-xl font-semibold mb-4 text-white">Add Category</h2>
                  <input
                    className="w-full mb-4 rounded-lg border border-white/15 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-red-400"
                    placeholder="Category name"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setOpenAddCategory(false)}
                      className="px-5 py-2 border border-white/20 rounded-lg text-slate-200 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addCategory}
                      disabled={loading}
                      className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-500 disabled:bg-red-300"
                    >
                      {loading ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {openAddDish && selectedCategory && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-[#171b26] p-4 rounded-xl w-full max-w-[520px] shadow-2xl border border-white/10 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">Add new Dish to {selectedCategory.name}</h2>
                    <button
                      onClick={() => {
                        setOpenAddDish(false);
                        setNewDish({ name: "", description: "", price: "", image: "" });
                      }}
                      className="w-6 h-6 rounded-full text-slate-300 hover:bg-white/10 text-sm"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <div>
                      <label className="text-[11px] text-slate-300 mb-1 block">Food name</label>
                      <input
                        className="border border-white/15 bg-white/10 p-2 w-full rounded-md text-xs text-white placeholder:text-slate-400"
                        placeholder="Type food name"
                        value={newDish.name}
                        onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 mb-1 block">Food price</label>
                      <input
                        className="border border-white/15 bg-white/10 p-2 w-full rounded-md text-xs text-white placeholder:text-slate-400"
                        placeholder="Enter price..."
                        type="number"
                        step="0.01"
                        value={newDish.price}
                        onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-2.5">
                    <label className="text-[11px] text-slate-300 mb-1 block">Ingredients</label>
                    <textarea
                      className="border border-white/15 bg-white/10 p-2 w-full rounded-md text-xs min-h-16 text-white placeholder:text-slate-400"
                      placeholder="List ingredients..."
                      value={newDish.description}
                      onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] text-slate-300 mb-1 block">Food image</label>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDishImageChange(e.target.files?.[0])}
                      />
                      {!newDish.image ? (
                        <div className="border border-dashed border-white/20 rounded-md h-24 flex flex-col items-center justify-center text-[11px] text-slate-300 bg-white/5 hover:border-red-400">
                          <span className="mb-1 text-base">🖼</span>
                          Choose a file or drag & drop it here
                        </div>
                      ) : (
                        <div className="relative rounded-md overflow-hidden border border-white/15">
                          <img
                            src={newDish.image}
                            alt="Dish preview"
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setNewDish((prev) => ({ ...prev, image: "" }));
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-gray-700 hover:bg-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={addDish}
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-500 disabled:bg-red-300 text-xs"
                    >
                      {loading ? "Adding..." : "Add Dish"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-red-300">Live Queue</p>
              <h1 className="mt-2 text-2xl font-black text-white">Orders</h1>
            </div>
            {activeOrders.length === 0 ? (
              <p className="text-center py-20 text-slate-400">Захиалга байхгүй байна</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order._id} className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Order #{order._id?.slice(-6)}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString("mn-MN")}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Customer:</span> {order.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {order.address}
                        </p>
                        {order.mapUrl ? (
                          <p className="text-sm text-blue-600">
                            <a
                              href={order.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2"
                            >
                              Open shared map
                            </a>
                          </p>
                        ) : null}
                        {order.phone ? (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Phone:</span> {order.phone}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="delivering">Delivering</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium mb-2 text-gray-900">Items:</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.dishName}
                            </span>
                            <span className="font-medium">
                              ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold text-lg">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-red-500">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171b26] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Logout?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Та admin хэсгээс гарахдаа итгэлтэй байна уу?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-slate-200 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
