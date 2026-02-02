"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // UI State
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsLogin(false);
    }
  }, [searchParams]);

  // Initialize Theme on Mount
  useEffect(() => {
    // Check local storage or system preference
    if (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle Theme
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Use toast.promise if it's a single awaitable action,
    // but here we have logic branches, so manual toasts might be better or a promise wrapper.

    // SIMPLE APPROACH:
    try {
      if (isLogin) {
        const promise = supabase.auth.signInWithPassword({ email, password });

        toast.promise(promise, {
          loading: "Signing in...",
          success: (data) => {
            if (data.error) throw data.error;
            router.push("/dashboard");
            return "Welcome back!";
          },
          error: (err) => err.message,
        });
      } else {
        // Sign Up Logic
        const promise = supabase.auth.signUp({
          email,
          password,
          options: { data: { business_name: businessName } },
        });

        toast.promise(promise, {
          loading: "Creating account...",
          success: (data) => {
            if (data.error) throw data.error;
            return "Account created! Check your email.";
          },
          error: (err) => err.message,
        });
      }
    } catch (err: any) {
      // Catch sync errors
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-300">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-all bg-white dark:bg-black"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* --- AURA CONTAINER START --- */}
      {/* 
          1. overflow-hidden: Cuts off the spinning giant so it doesn't cover the page
          2. p-[1px]: This gap reveals the spinner underneath, creating the border
          3. rounded-2xl: Curves the container
      */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl p-[1px]">
        {/* The Spinning Gradients (Background) */}
        {/* We use inset-[-100%] to make it big enough to cover corners while rotating */}
        <div
          className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] 
          bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]
          opacity-0 dark:opacity-100 transition-opacity duration-500"
        />
        <div
          className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] 
          bg-[conic-gradient(from_90deg_at_50%_50%,#f3f4f6_0%,#9ca3af_50%,#f3f4f6_100%)]
          opacity-100 dark:opacity-0 transition-opacity duration-500"
        />

        {/* The Content Card (Foreground) */}
        <div className="relative h-full w-full rounded-2xl bg-white dark:bg-black px-8 py-12 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto h-10 w-10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-black dark:text-white"
              >
                <path
                  d="M12 2L2 22h20L12 2z"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isLogin ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? "Login to your account" : "Create a new account"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Business Name
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all dark:bg-[#111] dark:border-gray-800 dark:text-white dark:focus:ring-white"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all dark:bg-[#111] dark:border-gray-800 dark:text-white dark:focus:ring-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all dark:bg-[#111] dark:border-gray-800 dark:text-white dark:focus:ring-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-4 flex items-center justify-center rounded-md bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
