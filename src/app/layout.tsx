import "./globals.css";

import { Inter as FontSans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { Theme } from "@radix-ui/themes";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: any) {
  return (
    <html lang="cn-zh" suppressHydrationWarning>
      <head />
      <body className={cn(fontSans.variable)}>
        <Theme>
          <TooltipProvider>
            <body className={fontSans.className}>{children}</body>
          </TooltipProvider>
        </Theme>
      </body>
    </html>
  );
}
