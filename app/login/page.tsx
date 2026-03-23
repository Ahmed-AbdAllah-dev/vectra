"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  ArrowRight,
  X,
  Shield,
  Key,
  CheckCircle,
  Truck,
  Clock,
} from "lucide-react";
import { signIn } from "next-auth/react";

type AccountType = "buyer" | "seller" | "delivery" | null;
type LoginMode = "select" | "login" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("select");
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setMode("login");
  };

  const handleBackToSelect = () => {
    setMode("select");
    setAccountType(null);
    setErrors({});
  };

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!loginData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(loginData.email))
      newErrors.email = "Email is invalid";
    if (!loginData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgot = () => {
    const newErrors: Record<string, string> = {};
    if (!forgotEmail) newErrors.forgotEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(forgotEmail))
      newErrors.forgotEmail = "Email is invalid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin() || !accountType) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        accountType,
        redirect: false,
      });
      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        if (accountType === "buyer") router.push("/");
        else if (accountType === "delivery") router.push("/delivery/orders");
        else router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      setErrors({
        general: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForgot()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Password reset link has been sent to your email!");
      setMode("login");
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const accountIcon = {
    buyer: <ShoppingBag className="w-8 h-8 text-white" />,
    seller: <Store className="w-8 h-8 text-white" />,
    delivery: <Truck className="w-8 h-8 text-white" />,
  };

  const accountLabel = {
    buyer: "Buyer Login",
    seller: "Seller Login",
    delivery: "Delivery Login",
  };

  // ─── Select Mode ────────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-black rounded-2xl mb-6">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">Welcome Back</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select your account type to log in to your dashboard
            </p>
          </div>

          {/* Cards — 3 columns on large screens */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Buyer */}
            <div
              onClick={() => handleTypeSelect("buyer")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 h-full hover:border-black transition-colors duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gray-100 rounded-xl group-hover:bg-black transition-colors duration-300">
                    <ShoppingBag className="w-8 h-8 text-gray-800 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black transform group-hover:translate-x-2 transition-all duration-300" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-4">
                  Buyer Login
                </h2>
                <p className="text-gray-600 mb-6">
                  Access your shopping dashboard, track orders, and manage your
                  wishlist.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Secure shopping experience",
                    "Personalized recommendations",
                    "Order tracking",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">For shoppers</span>
                  <span className="text-sm font-medium text-black">
                    → Log In
                  </span>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div
              onClick={() => handleTypeSelect("seller")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 h-full hover:border-black transition-colors duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gray-100 rounded-xl group-hover:bg-black transition-colors duration-300">
                    <Store className="w-8 h-8 text-gray-800 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black transform group-hover:translate-x-2 transition-all duration-300" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-4">
                  Seller Login
                </h2>
                <p className="text-gray-600 mb-6">
                  Access your seller dashboard to manage products, analytics,
                  and orders.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Store management dashboard",
                    "Sales analytics",
                    "Inventory tracking",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">For businesses</span>
                  <span className="text-sm font-medium text-black">
                    → Log In
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div
              onClick={() => handleTypeSelect("delivery")}
              className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 h-full hover:border-black transition-colors duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gray-100 rounded-xl group-hover:bg-black transition-colors duration-300">
                    <Truck className="w-8 h-8 text-gray-800 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-black transform group-hover:translate-x-2 transition-all duration-300" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-4">
                  Delivery Login
                </h2>
                <p className="text-gray-600 mb-6">
                  Access your delivery dashboard to manage assigned orders and
                  routes.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "View assigned deliveries",
                    "Real-time order updates",
                    "Earnings overview",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    For delivery agents
                  </span>
                  <span className="text-sm font-medium text-black">
                    → Log In
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Don't have an account yet?</p>
              <button
                onClick={() => router.push("/signup")}
                className="w-full py-3 rounded-lg border-2 border-black text-black hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Create New Account
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-black transition-colors duration-200"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Forgot Password Mode ────────────────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setMode("login")}
            className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to login
          </button>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-black rounded-xl mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600">
              Enter your email to receive a password reset link
            </p>
          </div>
          <form onSubmit={handleForgotSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (errors.forgotEmail)
                      setErrors((p) => ({ ...p, forgotEmail: "" }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.forgotEmail ? "border-red-500" : "border-gray-300"
                  } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.forgotEmail && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <X className="w-4 h-4 mr-1" /> {errors.forgotEmail}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200 ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-black font-medium hover:underline"
              >
                Log in instead
              </button>
            </p>
          </form>
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              <Shield className="w-4 h-4" />
              <span>We'll email you a secure password reset link</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login Form Mode ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md w-full">
        <button
          onClick={handleBackToSelect}
          className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to account selection
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-black rounded-xl mb-4">
            {accountType && accountIcon[accountType]}
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            {accountType && accountLabel[accountType]}
          </h1>
          <p className="text-gray-600">Log in to your {accountType} account</p>

          {/* Delivery pending notice */}
          {accountType === "delivery" && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Delivery accounts require admin approval before you can log in.
                If you've applied, please wait for approval.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                placeholder="your.email@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <X className="w-4 h-4 mr-1" /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <X className="w-4 h-4 mr-1" /> {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={loginData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">
                {errors.general}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200 ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          {/* Links */}
          <div className="space-y-3 text-center pt-2">
            {accountType !== "delivery" && (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="text-black font-medium hover:underline"
                >
                  Sign up as {accountType}
                </button>
              </p>
            )}
            {accountType === "delivery" && (
              <p className="text-gray-600">
                Want to deliver with us?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="text-black font-medium hover:underline"
                >
                  Apply as delivery agent
                </button>
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-black transition-colors duration-200 text-sm"
            >
              ← Continue shopping as guest
            </button>
          </div>
        </form>

        {/* Security badges */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              ["Secure", "256-bit SSL"],
              ["Protected", "2FA Ready"],
              ["Privacy", "GDPR Compliant"],
            ].map(([label, val]) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {label}
                </div>
                <div className="text-sm font-bold text-black">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
