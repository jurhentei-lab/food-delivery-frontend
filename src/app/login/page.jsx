"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = "http://localhost:999";
const ADMIN_EMAIL = "jurhee@gmail.com";

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
    <div className="flex w-full h-screen overflow-hidden justify-center">
      {/* Left Side */}
      <div className="flex flex-col justify-center items-start w-[420px] px-10 gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold">Log in</p>
          <p className="text-[#71717A] text-sm">
            Welcome back. Enter your credentials.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <input
            type="email"
            placeholder="Email"
            className="border border-[#c9c9d3] rounded-md h-10 px-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-[#c9c9d3] rounded-md h-10 px-3 text-sm"
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
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-[#18181B]"
          }`}
        >
          {loading ? "Loading..." : "Log in"}
        </button>

        <div className="flex gap-2 text-sm">
          <p className="text-[#71717A]">Don&apos;t have an account?</p>
          <p
            className="text-[#2563EB] cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Sign up
          </p>
        </div>
        <p className="text-xs text-gray-400">
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
