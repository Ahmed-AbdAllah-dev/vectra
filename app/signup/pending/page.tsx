"use client";

import { useRouter } from "next/navigation";
import { Clock, CheckCircle, Mail, ArrowRight, Truck } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center">
              <Truck className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-black mb-4">
          Application Submitted!
        </h1>
        <p className="text-gray-600 text-lg mb-10">
          Thank you for applying to become a delivery agent. Our team will
          review your documents and get back to you.
        </p>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 text-left space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            What happens next
          </h2>

          {[
            {
              icon: CheckCircle,
              color: "text-green-500",
              title: "Application received",
              desc: "We've got your documents and account details.",
              done: true,
            },
            {
              icon: Clock,
              color: "text-amber-500",
              title: "Under review",
              desc: "Our team verifies your ID and vehicle documents — usually within 24 hours.",
              done: false,
            },
            {
              icon: Mail,
              color: "text-blue-500",
              title: "Email notification",
              desc: "You'll receive an email with the result. If approved, you can log in immediately.",
              done: false,
            },
          ].map(({ icon: Icon, color, title, desc, done }, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className={`mt-0.5 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    done ? "text-black" : "text-gray-600"
                  }`}
                >
                  {title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Questions? Contact us at{" "}
          <span className="text-black font-medium">
            support@yourplatform.com
          </span>
        </p>
      </div>
    </div>
  );
}
