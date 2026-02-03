import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the GerpaTech platform ("Service"), you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Description of Service
            </h2>
            <p>
              GerpaTech provides a software-as-a-service (SaaS) platform that
              automates customer follow-ups, Google Review requests, and
              retention email campaigns for local businesses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Account Registration
            </h2>
            <p>
              To use the Service, you must be provisioned an account by
              GerpaTech administrators. You agree to provide accurate, current,
              and complete information during the onboarding process and to
              update such information to keep it accurate, current, and
              complete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. User Responsibilities
            </h2>
            <p className="mb-2">You acknowledge and agree that:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You have the necessary rights and consent to upload customer
                data (email addresses, names) to the platform.
              </li>
              <li>
                You will not use the Service to send spam, unsolicited
                commercial email, or content that violates any applicable laws.
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Google Data Usage
            </h2>
            <p>
              Our Service integrates with Google APIs to send emails on your
              behalf. By using this integration, you agree to Google's Terms of
              Service and our Privacy Policy regarding the limited use of your
              data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Payment and Subscription
            </h2>
            <p>
              Services are provided on a subscription basis. Payment terms are
              agreed upon manually prior to account provisioning. Failure to pay
              agreed-upon fees may result in the suspension or termination of
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, GerpaTech shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from
              your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these terms at any time. We will
              provide notice of any significant changes by posting the new Terms
              of Service on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Contact Us
            </h2>
            <p>
              For any questions regarding these Terms, please contact us at
              support@gerpatech.com.
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
