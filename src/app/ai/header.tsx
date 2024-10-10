"use client";

import HeaderAccount from "@/components/header-account";

export default function Header({
  children,
  title,
}: {
  children?: React.ReactNode;
  title: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      {children}
      <div className="ml-auto flex gap-1.5 text-sm text-red-500">
        <h1>Public Alpha第一个版本运行时间: 10月7日-10月14号, 每天12:00--20:00; 每个用户每天最多10个成功的视频；请提前做好准备 </h1>
      </div>
      <div className="ml-auto flex gap-1.5 text-sm">
        <HeaderAccount />
      </div>
    </header>
  );
}
