"use client";

import axios from "axios";
import { ChevronLeftIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/api-base";
import { getAuthErrorMessage } from "../../lib/get-auth-error-message";

export default function Step2({ email, goBack }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordMatch = password && confirm && password === confirm;

  // async function createUser() {
  //   if (!email || !passwordMatch) {
  //     alert("Email or password invalid!");
  //     return;
  //   }

  //   console.log("Sending to backend:", { email, password });

  //   try {
  //     const response = await axios.post(
  //       "http://localhost:999/users",
  //       {
  //         email,
  //         password,
  //       },
  //       {
  //         headers: { "Content-Type": "application/json" },
  //       }
  //     );

  //     console.log("Амжилттай:", response.data);
  //     router.push("/login");
  //   } catch (error) {
  //     console.error("Алдаа:", error.response?.data || error.message);
  //     alert(error.response?.data?.message || "Алдаа гарлаа!");
  //   }
  // }
  async function createUser() {
    setErrorMessage("");
    if (!email || !passwordMatch) {
      setErrorMessage("Email эсвэл password буруу байна.");
      return;
    }

    try {
      setLoading(true);
      const role = email.trim().toLowerCase() === "jurhee@gmail.com" ? "admin" : "customer";
      const response = await axios.post(
        `${API_BASE}/users/signup`,
        { email, password, role },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Амжилттай:", response.data);
      router.push("/login");
    } catch (error) {
      console.error("Signup error:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setErrorMessage(getAuthErrorMessage(error, "Бүртгүүлэх үед алдаа гарлаа."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ChevronLeftIcon
        className="cursor-pointer text-white"
        onClick={goBack}
      />

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold">Create a strong password</p>
        <p className="text-sm text-slate-400">
          Create a strong password with letters, numbers.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <input
          type={show ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-400"
        />

        <input
          type={show ? "text" : "password"}
          placeholder="Confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-10 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-400"
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={show}
            onChange={() => setShow(!show)}
            className="accent-white"
          />
          Show password
        </label>
      </div>

      <button
        disabled={!passwordMatch || loading}
        onClick={createUser}
        className={`flex justify-center items-center rounded-md w-full h-10 text-white font-medium ${
          !passwordMatch || loading
            ? "bg-white/15 text-slate-400 cursor-not-allowed"
            : "bg-[#18181B]"
        }`}
      >
        {loading ? "Creating..." : "Let&apos;s Go"}
      </button>
      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <div className="flex gap-2 text-sm">
        <p className="text-slate-400">Already have an account?</p>
        <p
          className="text-[#2563EB] cursor-pointer"
          onClick={() => router.push("/login")}
        >
          Log in
        </p>
      </div>
    </>
  );
}
