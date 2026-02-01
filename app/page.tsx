import Link from "next/link";
import { ArrowRight, Star, RefreshCw, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-black font-bold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="w-5 h-5"
              >
                <path
                  d="M12 2L2 22h20L12 2z"
                  stroke="none"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-semibold tracking-tight">SaaS_App</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background Gradient Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-blue-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Now available for Beta access
          </div>

          {/* 
             NOTE: Added 'pb-4' here. 
             This adds padding to the bottom of the text container so the 
             gradient doesn't clip the bottom of the 'g' or 'p'.
          */}
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent pb-4">
            Automate your <br /> Google Reviews.
          </h1>

          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            The set-and-forget tool for local businesses. We automatically
            follow up with customers to boost your reputation and retention.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login?mode=signup"
              className="h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Reviews</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                24 hours after a visit, we send a polite email asking for
                feedback. Positive experiences go straight to Google Maps.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Retention</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If a customer hasn't returned in 30 days, we automatically reach
                out to bring them back to your business.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-400">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Track open rates, click-throughs, and actual Google Reviews
                generated from your dedicated dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION (Replaced Pricing) --- */}
      <section className="py-24 px-6 text-center border-t border-white/10 bg-gradient-to-b from-black to-blue-900/10">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to grow your business?
          </h2>
          <p className="text-gray-400">
            Join the local businesses using SaaS_App to improve their online
            presence effortlessly.
          </p>
          <div className="pt-4">
            <Link
              href="/login?mode=signup"
              className="inline-flex h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all items-center gap-2"
            >
              Start for free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} SaaS_App Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
