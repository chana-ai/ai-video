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
      <div className="ml-auto flex gap-1.5 text-sm">
        <HeaderAccount />
      </div>
    </header>
  );
}
