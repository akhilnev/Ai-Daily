import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Daily Brief",
  description: "Daily AI developments, summarized.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f9fafb", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
