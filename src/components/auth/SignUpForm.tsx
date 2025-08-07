import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";
import EmailVerification from "./EmailVerification";
import { showToast } from "../../utils/toast";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator" as "creator" // Only creator role allowed
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  const { signup, error, clearError } = useAuth();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      const success = await signup(formData);
      if (success) {
        showToast.success('Account created successfully! Please check your email for verification.');
        setShowVerification(true);
      }
    } catch (error: any) {
      showToast.error(error.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showVerification) {
    return (
      <EmailVerification 
        email={formData.email}
        password={formData.password}
        onBack={() => setShowVerification(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500">
              Create a new creator account and verify your email to get started!
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">

              {/* Full Name */}
              <div>
                <Label>
                  Full Name<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {/* Email */}
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {/* Password */}
              <div>
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </span>
                </div>
              </div>
              {/* Role Selection - Only Creator Available */}
              <div>
                <Label>
                  Role<span className="text-error-500">*</span>
                </Label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 disabled"
                >
                  <option value="creator">Creator</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Admin accounts can only be created by system administrators
                </p>
              </div>
              {/* Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 sm:text-start">
              Already have an account? {""}
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}