"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step1({ email, setEmail, goNext }) {
  const router = useRouter();
  const [error, setError] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleEmail = (value) => {
    setEmail(value);

    if (!value) {
      setError("");
      return;
    }

    if (!emailRegex.test(value)) setError("Invalid email.");
    else setError("");
  };

  return (
    <>
      <ChevronLeftIcon className="opacity-0 text-white" />

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold">Create your account</p>
        <p className="text-sm text-slate-400">
          Sign up to explore your favorite dishes.
        </p>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => handleEmail(e.target.value)}
          className={`h-10 w-full rounded-md border bg-white/5 px-3 text-sm text-white placeholder:text-slate-400 ${
            error ? "border-red-500" : "border-white/15"
          }`}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <button
        disabled={!email || error}
        onClick={goNext}
        className={`flex justify-center items-center rounded-md w-full h-10 text-white font-medium ${
          !email || error
            ? "bg-white/15 text-slate-400 cursor-not-allowed"
            : "bg-[#18181B]"
        }`}
      >
        Let&apos;s Go
      </button>

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
