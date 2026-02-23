"use client";

import { useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  return (
    <div className="flex w-full h-screen overflow-hidden justify-center">
      {/* LEFT PANEL */}
      <div className="flex flex-col justify-center items-start w-[420px] px-12 gap-6">
        {step === 1 && (
          <Step1 email={email} setEmail={setEmail} goNext={() => setStep(2)} />
        )}

        {step === 2 && <Step2 email={email} goBack={() => setStep(1)} />}
      </div>

      <div className="flex justify-center items-center">
        <div
          className="h-[90%] bg-cover bg-center rounded-xl shadow-sm"
          style={{
            width: "856px",
            backgroundImage: "url('/LoginPageImage.png')",
          }}
        ></div>
      </div>
    </div>
  );
}
