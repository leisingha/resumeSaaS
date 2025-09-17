import React, { useState } from "react";
import toast from "react-hot-toast";
import Footer from "../landing-page/components/Footer";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactUsPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class names consistent with the app's styling
  const newStandardInputClass =
    "w-full rounded-lg border-[1.5px] border-stroke bg-transparent mobile-break:py-3 mobile-break:px-5 py-2 px-3 mobile-break:text-base text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";

  const labelClassName =
    "mb-2.5 block mobile-break:text-base text-sm font-medium text-black dark:text-white";

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      errors.message = "Message is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual form submission logic
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Thank you for contacting us! We'll get back to you soon.");

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-boxdark-2 py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Form */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg">
            <form onSubmit={handleSubmit} className="p-6.5">
              {/* Name Fields */}
              <div className="mb-4.5 flex flex-col gap-6 mobile-break:flex-row">
                <div className="w-full mobile-break:w-1/2">
                  <label className={labelClassName} htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Enter your first name"
                    className={newStandardInputClass}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="w-full mobile-break:w-1/2">
                  <label className={labelClassName} htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Enter your last name"
                    className={newStandardInputClass}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mb-4.5">
                <label className={labelClassName} htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  className={newStandardInputClass}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="mb-4.5">
                <label className={labelClassName} htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  className={`${newStandardInputClass} appearance-none`}
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.subject && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.subject}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className={labelClassName} htmlFor="message">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Please describe your inquiry in detail..."
                  className={newStandardInputClass}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                {formErrors.message && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md text-white py-3 px-6 transition-all duration-150 hover:transform hover:-translate-x-1 hover:-translate-y-1 active:transform active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                style={{
                  background: "#1A222C",
                  fontWeight: 900,
                  fontSize: "18px",
                  border: "3px solid #fbca1f",
                  borderRadius: "0.4em",
                  boxShadow: isSubmitting
                    ? "0.1em 0.1em #fbca1f"
                    : "0.1em 0.1em #fbca1f",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0.1em 0.1em #fbca1f";
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.05em 0.05em #fbca1f";
                  }
                }}
                onMouseUp={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                  }
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
