"use client";

import styles from "./template.module.scss";
import Image from "next/image";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className={`flex-grow ${styles["flex-grow"]}`}>
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
          <div className="flex items-center justify-center py-12">
            {children}
          </div>
          <div className="hidden bg-muted lg:block">
            <Image
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Image"
              width="1920"
              height="1080"
              className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </div>
      </div>
      <footer className="bg-gray-100 py-4 text-center">
        <p className="text-sm text-gray-500">
          © 2023 Your Company. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
