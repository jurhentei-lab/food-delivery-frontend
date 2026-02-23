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
      <ChevronLeftIcon className="opacity-0" />

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold">Create your account</p>
        <p className="text-[#71717A] text-sm">
          Sign up to explore your favorite dishes.
        </p>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => handleEmail(e.target.value)}
          className={`border rounded-md w-full h-10 px-3 text-sm ${
            error ? "border-red-500" : "border-[#c9c9d3]"
          }`}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <button
        disabled={!email || error}
        onClick={goNext}
        className={`flex justify-center items-center rounded-md w-full h-10 text-white font-medium ${
          !email || error ? "bg-gray-200 cursor-not-allowed" : "bg-[#18181B]"
        }`}
      >
        Let&apos;s Go
      </button>

      <div className="flex gap-2 text-sm justify-center w-[]">
        <p className="text-[#71717A]">Already have an account?</p>
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
