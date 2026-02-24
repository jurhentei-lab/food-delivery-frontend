"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = "http://localhost:999";
const ADMIN_EMAIL = "jurhee@gmail.com";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setAuthCookies(user) {
  const role = user?.role === "admin" ? "admin" : "user";
  document.cookie = `auth=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  document.cookie = `user_role=${role}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/users/login`, {
        email,
        password,
      });
      if (response.data.loggedIn) {
        const user = response.data.user;
        const normalizedEmail = String(user?.email || "").trim().toLowerCase();
        const isAdminUser =
          user?.role === "admin" || normalizedEmail === ADMIN_EMAIL;
        const safeUser = isAdminUser ? { ...user, role: "admin" } : user;

        localStorage.setItem("currentUser", JSON.stringify(safeUser));
        setAuthCookies(safeUser);
        if (isAdminUser) {
          router.push("/admin");
        } else {
          router.push("/main");
        }
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Алдаа гарлаа!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1d2332_0%,#0f1118_45%,#0b0d13_100%)] text-white">
      {/* Left Side */}
      <div className="flex w-[420px] flex-col items-start justify-center gap-6 border-r border-white/10 bg-[#0f1118]/70 px-10 backdrop-blur">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold">Log in</p>
          <p className="text-sm text-slate-400">
            Welcome back. Enter your credentials.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <input
            type="email"
            placeholder="Email"
            className="h-10 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="h-10 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 🔹 Алдааны текст */}
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

        <button
          disabled={!email || !password || loading}
          onClick={handleLogin}
          className={`flex justify-center items-center rounded-md w-full h-10 text-white font-medium ${
            !email || !password
              ? "bg-white/15 text-slate-400 cursor-not-allowed"
              : "bg-[#18181B]"
          }`}
        >
          {loading ? "Loading..." : "Log in"}
        </button>

        <div className="flex gap-2 text-sm">
          <p className="text-slate-400">Don&apos;t have an account?</p>
          <p
            className="text-[#2563EB] cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Sign up
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Admin demo email: <span className="font-medium">jurhee@gmail.com</span>
        </p>
      </div>

      {/* Right Image */}
      <div className="flex justify-center items-center">
        <div
          className="h-[90%] bg-cover bg-center rounded-xl"
          style={{
            width: "856px",
            backgroundImage: "url('/LoginPageImage.png')",
          }}
        ></div>
      </div>
    </div>
  );
}
