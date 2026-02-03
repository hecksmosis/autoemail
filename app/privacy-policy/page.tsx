import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Introduction
            </h2>
            <p>
              GerpaTech ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, and
              share your personal information when you use our automated review
              and retention platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> We collect your business
                name and email address when you are provisioned an account.
              </li>
              <li>
                <strong>Customer Data:</strong> To provide our services, we
                process data you upload regarding your customers (Name, Email,
                Visit Date, Service Type). This data is used solely for the
                purpose of sending automated emails on your behalf.
              </li>
              <li>
                <strong>Google User Data:</strong> If you choose to connect your
                Google account, we access your email address to identify you and
                use the Gmail API to send emails on your behalf.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. How We Use Google User Data
            </h2>
            <p className="mb-2">
              Our application accesses Google user data for the specific purpose
              of automating your customer communication. We strictly adhere to
              the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-blue-400 hover:underline"
                target="_blank"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p className="mb-2">Specifically:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                We use the{" "}
                <code>https://www.googleapis.com/auth/gmail.send</code> scope to
                send emails to your customers that you have configured in your
                dashboard.
              </li>
              <li>
                We use the{" "}
                <code>https://www.googleapis.com/auth/userinfo.email</code>{" "}
                scope to display which account is currently connected.
              </li>
              <li>
                We <strong>do not</strong> read, delete, or organize your
                existing emails.
              </li>
              <li>
                We <strong>do not</strong> share your Google user data with
                third-party AI tools or external advertising platforms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Data Security
            </h2>
            <p>
              We implement industry-standard encryption to protect your data.
              Your Google Access and Refresh tokens are encrypted at rest in our
              database using AES-256 encryption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at support@gerpatech.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
          Last Updated: February 2026
        </div>
      </main>
    </div>
  );
}
