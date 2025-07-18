import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

interface EmailVerificationProps {
  email: string;
  password: string;
  onBack: () => void;
}

export default function EmailVerification({ email, password, onBack }: EmailVerificationProps) {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const { confirmSignUp, resendConfirmationCode, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    
    const success = await confirmSignUp(email, confirmationCode, password);
    if (success) {
      // After successful verification and auto-login, go to dashboard
      navigate('/');
    }
    setIsSubmitting(false);
  };

  const handleResendCode = async () => {
    setIsResending(true);
    clearError();
    
    await resendConfirmationCode(email);
    setIsResending(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to signup
        </button>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Verify Your Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We've sent a verification code to <strong>{email}</strong>
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <Label>
                  Verification Code <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Enter 6-digit code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                />
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  size="sm" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 