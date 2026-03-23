"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  UserPlus,
  ShoppingBag,
  Store,
  ArrowRight,
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building,
  Shield,
  Truck,
  Upload,
  FileText,
  Car,
  CreditCard,
  Clock,
  X,
} from "lucide-react";

type AccountType = "buyer" | "seller" | "delivery" | null;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "form">("select");
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    businessName: "",
    businessType: "sole_proprietor",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [vehicleDocFile, setVehicleDocFile] = useState<File | null>(null);
  const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const idCardRef = useRef<HTMLInputElement>(null);
  const vehicleDocRef = useRef<HTMLInputElement>(null);
  const vehicleImgRef = useRef<HTMLInputElement>(null);

  const isBuyer = accountType === "buyer";
  const isSeller = accountType === "seller";
  const isDelivery = accountType === "delivery";

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSelect = () => {
    setStep("select");
    setAccountType(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (isBuyer || isDelivery) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
    }
    if (isSeller && !formData.businessName)
      newErrors.businessName = "Business name is required";
    if (isDelivery) {
      if (!formData.phone) newErrors.phone = "Phone number is required";
      if (!idCardFile) newErrors.idCardImage = "ID card image is required";
      if (!vehicleDocFile)
        newErrors.vehicleDocument = "Vehicle document is required";
      if (!vehicleImageFile)
        newErrors.vehicleImage = "Vehicle image is required";
    }
    if (!agreeToTerms) newErrors.terms = "You must agree to the terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Replace with your actual file upload logic (S3, Cloudinary, etc.)
  const uploadFile = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    if (!res.ok) throw new Error("File upload failed");
    const json = await res.json();
    return json.url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      let idCardImage: string | undefined;
      let vehicleDocument: string | undefined;
      let vehicleImage: string | undefined;

      if (isDelivery) {
        [idCardImage, vehicleDocument, vehicleImage] = await Promise.all([
          uploadFile(idCardFile!),
          uploadFile(vehicleDocFile!),
          uploadFile(vehicleImageFile!),
        ]);
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: isSeller
            ? formData.businessName
            : `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          accountType,
          ...(isSeller && {
            businessName: formData.businessName,
            businessType: formData.businessType,
          }),
          ...(isDelivery && { idCardImage, vehicleDocument, vehicleImage }),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      // Delivery: no auto-login — redirect to a pending confirmation page
      if (isDelivery) {
        router.push("/signup/pending");
        return;
      }

      // Buyer / Seller: auto-login
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        accountType,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        router.push(isBuyer ? "/" : "/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("email")) {
        setErrors({ email: error.message });
      } else {
        setErrors({
          general: error.message || "Signup failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Reusable file upload button
  const FileUploadField = ({
    label,
    hint,
    accept,
    file,
    onChange,
    error,
    inputRef,
    icon: Icon,
  }: {
    label: string;
    hint: string;
    accept: string;
    file: File | null;
    onChange: (f: File) => void;
    error?: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    icon: React.ElementType;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} *
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed transition-colors duration-200
          ${
            error
              ? "border-red-400 bg-red-50"
              : file
              ? "border-black bg-gray-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
      >
        <div className={`p-2 rounded-lg ${file ? "bg-black" : "bg-gray-100"}`}>
          <Icon
            className={`w-5 h-5 ${file ? "text-white" : "text-gray-500"}`}
          />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p
            className={`text-sm font-medium truncate ${
              file ? "text-black" : "text-gray-600"
            }`}
          >
            {file ? file.name : `Upload ${label}`}
          </p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
        {file ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center">
          <X className="w-4 h-4 mr-1" /> {error}
        </p>
      )}
    </div>
  );

  // ─── SELECT STEP ─────────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-black rounded-2xl mb-6">
              <UserPlus className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              Join Our Platform
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose how you want to engage with our marketplace. Start your
              journey today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Buyer Card */}
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
                  Sign Up as Buyer
                </h2>
                <p className="text-gray-600 mb-6">
                  Shop millions of products, track orders, and enjoy
                  personalized recommendations.
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
                  <span className="text-sm text-gray-500">
                    Perfect for shoppers
                  </span>
                  <span className="text-xl font-bold text-black">Free</span>
                </div>
              </div>
            </div>

            {/* Seller Card */}
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
                  Sign Up as Seller
                </h2>
                <p className="text-gray-600 mb-6">
                  Launch your online store, reach millions of customers, and
                  grow your business.
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      $29/mo
                    </span>
                    <span className="text-xl font-bold text-black">
                      Free Trial
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Card */}
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
                  Become a Delivery Agent
                </h2>
                <p className="text-gray-600 mb-6">
                  Deliver orders in your area, set your own schedule, and earn
                  competitive pay.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Flexible working hours",
                    "Competitive earnings",
                    "Real-time support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Requires approval
                  </span>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Reviewed in 24h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">Already have an account?</p>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 font-medium"
            >
              Log In Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM STEP ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBackToSelect}
          className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to selection
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-black rounded-xl mb-4">
            {isBuyer && <ShoppingBag className="w-8 h-8 text-white" />}
            {isSeller && <Store className="w-8 h-8 text-white" />}
            {isDelivery && <Truck className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            {isBuyer && "Create Buyer Account"}
            {isSeller && "Create Seller Account"}
            {isDelivery && "Apply as Delivery Agent"}
          </h1>
          <p className="text-gray-600">Fill in your details to get started</p>

          {isDelivery && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Approval Required
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your application will be reviewed by our team. You'll receive
                  an email once approved — usually within 24 hours.
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={formData.email}
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
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                placeholder="Create a strong password"
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
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <X className="w-4 h-4 mr-1" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Buyer & Delivery: first + last name */}
          {(isBuyer || isDelivery) && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.lastName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Seller: business name + type */}
          {isSeller && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      errors.businessName ? "border-red-500" : "border-gray-300"
                    } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                    placeholder="Your Business Inc."
                  />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.businessName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                >
                  <option value="sole_proprietor">Sole Proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
            </>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number{isDelivery ? " *" : ""}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                } bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200`}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <X className="w-4 h-4 mr-1" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Delivery: document uploads */}
          {isDelivery && (
            <div className="space-y-4 pt-2">
              <div className="pb-3 border-b border-gray-200">
                <h3 className="text-base font-semibold text-black">
                  Required Documents
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload clear photos or scans. Kept secure and only used for
                  identity verification.
                </p>
              </div>

              <FileUploadField
                label="ID Card"
                hint="National ID, passport, or driver's license — JPG, PNG or PDF"
                accept="image/*,.pdf"
                file={idCardFile}
                onChange={(f) => {
                  setIdCardFile(f);
                  if (errors.idCardImage)
                    setErrors((p) => ({ ...p, idCardImage: "" }));
                }}
                error={errors.idCardImage}
                inputRef={idCardRef}
                icon={CreditCard}
              />

              <FileUploadField
                label="Vehicle Document"
                hint="Vehicle registration or insurance document — JPG, PNG or PDF"
                accept="image/*,.pdf"
                file={vehicleDocFile}
                onChange={(f) => {
                  setVehicleDocFile(f);
                  if (errors.vehicleDocument)
                    setErrors((p) => ({ ...p, vehicleDocument: "" }));
                }}
                error={errors.vehicleDocument}
                inputRef={vehicleDocRef}
                icon={FileText}
              />

              <FileUploadField
                label="Vehicle Photo"
                hint="Clear photo of your delivery vehicle — JPG or PNG"
                accept="image/*"
                file={vehicleImageFile}
                onChange={(f) => {
                  setVehicleImageFile(f);
                  if (errors.vehicleImage)
                    setErrors((p) => ({ ...p, vehicleImage: "" }));
                }}
                error={errors.vehicleImage}
                inputRef={vehicleImgRef}
                icon={Car}
              />
            </div>
          )}

          {/* Terms */}
          <div className="pt-6 border-t border-gray-200">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.terms) setErrors((p) => ({ ...p, terms: "" }));
                }}
                className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <button
                  type="button"
                  className="text-black hover:underline font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-black hover:underline font-medium"
                >
                  Privacy Policy
                </button>
                *
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <X className="w-4 h-4 mr-1" /> {errors.terms}
              </p>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200 text-lg ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading
              ? isDelivery
                ? "Submitting Application..."
                : "Creating Account..."
              : isBuyer
              ? "Create Buyer Account"
              : isSeller
              ? "Create Seller Account"
              : "Submit Application"}
          </button>

          <div className="text-center pt-2">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-black font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
            <Shield className="w-4 h-4" />
            <span>Your information is secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
