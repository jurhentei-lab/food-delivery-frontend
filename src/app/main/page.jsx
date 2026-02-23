"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:999";

export default function RestaurantPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foodsByCategory, setFoodsByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [tempLocation, setTempLocation] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [notification, setNotification] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const fetchHomeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/category`);
      const categoryData = await res.json();
      const safeCategories = Array.isArray(categoryData) ? categoryData : [];
      setCategories(safeCategories);

      const categoryEntries = await Promise.all(
        safeCategories.map(async (cat) => {
          const foodsRes = await fetch(`${API_BASE}/dish?categoryId=${cat._id}`);
          const foods = await foodsRes.json();
          return [cat._id, Array.isArray(foods) ? foods : []];
        })
      );

      setFoodsByCategory(Object.fromEntries(categoryEntries));
    } catch (err) {
      console.error("Fetch home data error:", err);
      setCategories([]);
      setFoodsByCategory({});
      showNotification("Menu ачаалахад алдаа гарлаа", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (!rawUser) {
      const guestUser = {
        id: "dev-admin",
        email: "jurhee@gmail.com",
        role: "admin",
      };
      localStorage.setItem("currentUser", JSON.stringify(guestUser));
      setCurrentUser(guestUser);
    } else {
      const user = JSON.parse(rawUser);
      setCurrentUser(user);
    }

    const savedLocation = localStorage.getItem("deliveryLocation") || "";
    setDeliveryLocation(savedLocation);

    fetchHomeData();
  }, [fetchHomeData, router]);

  const openLocationModal = () => {
    setTempLocation(deliveryLocation);
    setShowLocationModal(true);
  };

  const saveLocation = () => {
    const trimmed = tempLocation.trim();
    if (!trimmed) {
      showNotification("Хүргэлтийн хаяг хоосон байна", "error");
      return;
    }

    setDeliveryLocation(trimmed);
    localStorage.setItem("deliveryLocation", trimmed);
    setShowLocationModal(false);
    showNotification("Хаяг хадгалагдлаа", "success");
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification("Таны browser location дэмжихгүй байна", "error");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const coordsLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setDeliveryLocation((prev) => prev || coordsLabel);
        localStorage.setItem("deliveryLocation", coordsLabel);
        showNotification("Таны байршлыг авлаа", "success");
        setLocating(false);
      },
      () => {
        showNotification("Location permission зөвшөөрөөгүй байна", "error");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const mapQuery = (deliveryLocation || "Ulaanbaatar").trim();
  const orderMapUrl = userCoords
    ? `https://www.google.com/maps/search/?api=1&query=${userCoords.lat},${userCoords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        mapQuery
      )}`;
  const mapEmbedUrl = userCoords
    ? `https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}&z=16&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const addToCart = (item, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((p) => p._id === item._id);

      if (existing) {
        return prev.map((p) =>
          p._id === item._id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }

      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          description: item.description,
          image: item.image,
          price: Number(item.price),
          quantity,
        },
      ];
    });

    showNotification("Сагсанд нэмэгдлээ");
    setSelectedFood(null);
    setFoodQuantity(1);
  };

  const updateQuantity = (itemId, change) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item._id === itemId) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item._id !== itemId));
  };

  const confirmLogout = () => {
    localStorage.removeItem("currentUser");
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  const totals = useMemo(() => {
    const itemsTotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const delivery = cart.length > 0 ? 5 : 0;
    const service = cart.length > 0 ? 0.99 : 0;

    return {
      itemsTotal,
      delivery,
      service,
      total: itemsTotal + delivery + service,
    };
  }, [cart]);

  const cartItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleOrder = async () => {
    if (cart.length === 0) {
      showNotification("Сагс хоосон байна", "error");
      return;
    }

    if (!deliveryLocation.trim() && !userCoords) {
      showNotification("Хүргэлтийн хаяг оруулна уу", "error");
      openLocationModal();
      return;
    }

    try {
      setOrdering(true);
      const isMongoObjectId =
        typeof currentUser?.id === "string" && /^[a-f\d]{24}$/i.test(currentUser.id);

      const payload = {
        userId: isMongoObjectId ? currentUser.id : undefined,
        customerName: currentUser?.email || "Guest",
        address: deliveryLocation.trim() || `${userCoords?.lat}, ${userCoords?.lng}`,
        phone: "",
        latitude: userCoords?.lat,
        longitude: userCoords?.lng,
        mapUrl: orderMapUrl,
        items: cart.map((item) => ({
          dishId: item._id,
          dishName: item.name,
          price: Number(item.price),
          quantity: item.quantity,
        })),
        total: totals.total,
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Order failed");
      }

      showNotification("Захиалга амжилттай үүслээ", "success");
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error("Create order error:", err);
      showNotification("Захиалга үүсгэхэд алдаа гарлаа", "error");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d2332_0%,#0f1118_45%,#0b0d13_100%)] text-white flex flex-col">
      {notification && (
        <div className="fixed right-5 top-5 z-[100] animate-in slide-in-from-top duration-300">
          <div
            className={`flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl ${
              notification.type === "success"
                ? "border-emerald-400 bg-emerald-500/95"
                : "border-rose-500 bg-rose-600/95"
            }`}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
            <span className="font-semibold text-white">{notification.message}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1118]/95 backdrop-blur">
        <div className="mx-auto max-w-[980px] px-4 py-4 md:px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">NomNom</h1>
              <div className="text-xs text-slate-400">Fresh food, fast delivery</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowMapPanel((prev) => !prev)}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                {showMapPanel ? "Hide Map" : "Google Map"}
              </button>

              <button
                onClick={openLocationModal}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-red-400 hover:text-red-300"
              >
                {deliveryLocation ? "Update location" : "Enter location"}
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Account Logout
              </button>

              <button
                onClick={() => setShowCart(true)}
                className="relative rounded-full border border-red-500/60 bg-red-600/20 p-2 transition-all hover:bg-red-600/30"
              >
                <svg
                  className="h-6 w-6 text-red-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 md:p-5">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1800&q=90"
            alt="Hero food"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,12,18,0.92)_15%,rgba(10,12,18,0.64)_55%,rgba(239,68,68,0.35)_100%)]" />
          <div className="relative p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-red-300">Steak Society</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">
                TODAY&apos;S
                <br />
                <span className="text-red-400">DELIVERY OFFER!</span>
              </h2>
              <p className="mt-3 text-sm text-slate-300 md:text-base">
                Choose your favorite dishes and checkout in seconds.
              </p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-500"
            >
              Order now
            </button>
          </div>
          </div>
        </section>

        {showMapPanel && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-white/15 bg-[#141a27] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-200">
                  Delivery Map
                </h3>
                <p className="text-xs text-slate-400">
                  {userCoords
                    ? `Current location: ${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}`
                    : mapQuery}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={requestCurrentLocation}
                  disabled={locating}
                  className="rounded-lg border border-emerald-400/50 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60"
                >
                  {locating ? "Locating..." : "Use my location"}
                </button>
                <button
                  onClick={() => setShowMapPanel(false)}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                title="Google map preview"
                src={mapEmbedUrl}
                className="h-[300px] w-full md:h-[360px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-300">
            Loading menu...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-300">
            Категори олдсонгүй.
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const items = foodsByCategory[category._id] || [];

              return (
                <section key={category._id}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
                    {category.name}
                  </h3>

                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-400">
                      Энэ категорид хоол алга байна.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((item) => (
                        <article
                          key={item._id}
                          className="group overflow-hidden rounded-xl border border-white/10 bg-white text-[#111827] shadow-md transition hover:translate-y-[-2px] hover:shadow-xl"
                        >
                          <div className="relative h-28 overflow-hidden bg-slate-100">
                            <img
                              src={
                                item.image ||
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                              }
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <button
                              onClick={() => addToCart(item)}
                              className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xl text-white hover:bg-red-500"
                              aria-label="Add to cart"
                            >
                              +
                            </button>
                          </div>

                          <div className="cursor-pointer p-3" onClick={() => setSelectedFood(item)}>
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-red-600">{item.name}</h4>
                              <span className="text-xs font-bold text-slate-900">
                                ${Number(item.price).toFixed(2)}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-[11px] text-slate-500">
                              {item.description || "No description"}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
        </div>
      </main>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181c27] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Logout?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Та системээс гарахдаа итгэлтэй байна уу?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181c27] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Enter delivery address</h3>
            <p className="mt-1 text-sm text-slate-300">
              Please write your exact delivery location.
            </p>
            <input
              type="text"
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              placeholder="Apartment, street, district..."
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-red-400"
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFood && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 bg-gray-100">
              <img
                src={
                  selectedFood.image ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                }
                alt={selectedFood.name}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setSelectedFood(null)}
                className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white text-2xl text-black"
              >
                ×
              </button>
            </div>

            <div className="p-6 text-gray-900">
              <div className="mb-3 flex items-start justify-between">
                <h4 className="text-2xl font-bold text-red-600">{selectedFood.name}</h4>
                <span className="text-2xl font-bold">
                  ${Number(selectedFood.price).toFixed(2)}
                </span>
              </div>
              <p className="mb-6 text-sm text-gray-600">
                {selectedFood.description || "No description"}
              </p>

              <div className="mb-6 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))}
                      className="h-10 w-10 rounded-xl border border-gray-200 bg-white"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-2xl font-bold">
                      {foodQuantity}
                    </span>
                    <button
                      onClick={() => setFoodQuantity(foodQuantity + 1)}
                      className="h-10 w-10 rounded-xl border border-gray-200 bg-white"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 text-xs text-gray-500">Total price</div>
                    <span className="text-2xl font-bold">
                      ${(Number(selectedFood.price) * foodQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => addToCart(selectedFood, foodQuantity)}
                className="w-full rounded-2xl bg-red-600 py-4 text-lg font-bold text-white hover:bg-red-700"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCart(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Order Information</h3>
                <button onClick={() => setShowCart(false)} className="h-10 w-10 text-3xl text-white">
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6 text-gray-900">
              <div className="mb-6">
                <h4 className="mb-4 text-lg font-bold text-gray-900">
                  My cart ({cart.length})
                </h4>

                {cart.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-lg text-gray-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item._id}
                        className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                          }
                          alt={item.name}
                          className="h-24 w-24 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between">
                            <h5 className="font-bold text-red-600">{item.name}</h5>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                          <p className="mb-3 line-clamp-2 text-xs text-gray-500">
                            {item.description || "No description"}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
                              <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                              <span className="w-6 text-center font-bold text-gray-900">
                                {item.quantity}
                              </span>
                              <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <div className="mb-6">
                    <h4 className="mb-3 text-lg font-bold text-gray-900">Delivery Location</h4>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDeliveryLocation(value);
                        localStorage.setItem("deliveryLocation", value);
                      }}
                      placeholder="Insert your exact delivery location"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none placeholder-gray-400 focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-4 text-lg font-bold text-gray-900">Payment Summary</h4>
                    <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                      <div className="flex justify-between text-gray-600">
                        <span>Items</span>
                        <span className="font-semibold text-gray-900">
                          ${totals.itemsTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery</span>
                        <span className="font-semibold text-gray-900">
                          ${totals.delivery.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Service</span>
                        <span className="font-semibold text-gray-900">
                          ${totals.service.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                          <span>Total</span>
                          <span className="text-red-600">${totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-3 text-lg font-bold text-gray-900">Pay with QR</h4>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col items-center">
                      <img
                        src="/monpay-qr.png"
                        alt="Monpay QR"
                        className="w-44 h-44 object-contain rounded-md border border-gray-100"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Scan this QR with Monpay to pay
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOrder}
                    disabled={ordering}
                    className="w-full rounded-2xl bg-red-600 py-4 text-lg font-bold text-white disabled:bg-red-300 hover:bg-red-700"
                  >
                    {ordering ? "Placing order..." : "Checkout"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 bg-[#0a0c12]">
        <div className="overflow-hidden bg-gradient-to-r from-red-600 to-red-700 py-4">
          <div className="text-center text-base font-bold text-white">
            Fresh fast delivered • Fresh fast delivered • Fresh fast delivered
          </div>
        </div>
        <div className="mx-auto grid max-w-[980px] grid-cols-2 gap-6 px-6 py-8 text-xs text-gray-400 md:grid-cols-4">
          <div>
            <p className="mb-2 font-semibold text-gray-200">NomNom</p>
            <p>Swift delivery</p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-200">Menu</p>
            <p>Appetizers</p>
            <p>Salads</p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-200">Info</p>
            <p>Terms</p>
            <p>Privacy</p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-200">Contact</p>
            <p>+976 0000 0000</p>
            <p>hello@nomnom.mn</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
          © 2026 NomNom. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
