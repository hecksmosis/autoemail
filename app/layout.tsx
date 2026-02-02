import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GerpaTech Dashboard",
  description: "Review & Retention Automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              border: "1px solid #1f1f1f",
              color: "#fff",
            },
            className: "toast-custom",
            duration: 4000,
          }}
          className="toaster-custom"
        />
        <style>{`
          /* Custom Toast Styles */
          .toaster-custom [data-sonner-toast] {
            background: #0A0A0A !important;
            border: 1px solid #1f1f1f !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
          }
          
          .toaster-custom [data-sonner-toast][data-type="success"] {
            border-color: #16a34a !important;
            background: #0A0A0A !important;
          }
          
          .toaster-custom [data-sonner-toast][data-type="success"] [data-icon] {
            color: #16a34a !important;
          }
          
          .toaster-custom [data-sonner-toast][data-type="error"] {
            border-color: #dc2626 !important;
            background: #0A0A0A !important;
          }
          
          .toaster-custom [data-sonner-toast][data-type="error"] [data-icon] {
            color: #dc2626 !important;
          }
          
          .toaster-custom [data-sonner-toast][data-type="loading"] {
            border-color: #6b7280 !important;
          }
          
          .toaster-custom [data-sonner-toast] [data-title] {
            color: #fff !important;
            font-weight: 500 !important;
          }
          
          .toaster-custom [data-sonner-toast] [data-description] {
            color: #9ca3af !important;
          }
          
          .toaster-custom [data-sonner-toast] [data-close-button] {
            background: transparent !important;
            border-color: #1f1f1f !important;
            color: #9ca3af !important;
          }
          
          .toaster-custom [data-sonner-toast] [data-close-button]:hover {
            background: #1f1f1f !important;
            color: #fff !important;
          }
        `}</style>
      </body>
    </html>
  );
}
