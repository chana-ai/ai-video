import "./globals.css";

import { Inter as FontSans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: any) {
  return (
    <html lang="cn-zh" suppressHydrationWarning>
      <head />
      <body className={cn(fontSans.variable)}>
        <TooltipProvider>
          <body className={fontSans.className}>
            <Toast />
            {children}
          </body>
        </TooltipProvider>
      </body>
    </html>
  );
}
