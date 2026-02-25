"use client";

import { useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  return (
    <div className="flex h-screen w-full justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1d2332_0%,#0f1118_45%,#0b0d13_100%)] text-white">
      {/* LEFT PANEL */}
      <div className="flex w-[420px] flex-col items-start justify-center gap-6 border-r border-white/10 bg-[#0f1118]/70 px-10 backdrop-blur">
        {step === 1 && (
          <Step1 email={email} setEmail={setEmail} goNext={() => setStep(2)} />
        )}

        {step === 2 && <Step2 email={email} goBack={() => setStep(1)} />}
      </div>

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
