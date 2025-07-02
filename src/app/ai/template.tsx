"use client";

import {
  Boxes,
  FileVideo2,
  LifeBuoy,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  SquareUser,
  Clapperboard,
  BookOpenText,
  Wallet,
  ChevronRight,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "看板",
    icon: LayoutDashboard,
    href: "/ai/dashboard",
  },
  {
    label: "素材",
    icon: Boxes,
    href: "/ai/materials",
  },
  {
    label: "视频",
    icon: FileVideo2,
    href: "/ai/videos",
  },
  {
    label: "项目",
    icon: Settings2,
    href: "/ai/projects",
    subMenus: [
      // Example sub-menu
      // { label: "Sub Project 1", href: "/ai/projects/1", icon: LifeBuoy },
    ],
  },
  {
    label: "设置",
    icon: Wallet,
    subMenus: [
      
      {
        label: "Refill",
        icon: CreditCard,
        href: "/ai/balance-bill",
      },
      {
        label: "Bill Detail",
        icon: Receipt,
        href: "/ai/balance-bill/bill",
      },
      {
        label: "plan",
        icon: LifeBuoy,
        href: "/ai/balance-bill/plan",
      },
    ],
  },
];

export default function Template({ children }: { children: React.ReactNode }) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleMenuClick = (label: string, hasSubMenus: boolean, href?: string) => {
    if (hasSubMenus) {
      setExpandedMenu(expandedMenu === label ? null : label);
    } else if (href) {
      setExpandedMenu(null);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar with adaptive width */}
      <aside
        className="group/sidebar relative z-20 flex h-full flex-col border-r bg-white transition-all duration-200 ease-in-out
          w-[56px] hover:w-[200px] min-w-[56px] hover:min-w-[200px]"
      >
        <div className="border-b p-2">
          <Link href="/">
            <Button variant="outline" size="icon" aria-label="Home">
              <Clapperboard className="size-5" />
            </Button>
          </Link>
        </div>
        <nav className="grid gap-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubMenus = !!item.subMenus && item.subMenus.length > 0;
            const isExpanded = expandedMenu === item.label;
            return (
              <div key={item.label} className="relative">
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg transition-colors cursor-pointer w-full",
                    isExpanded && "bg-muted"
                  )}
                  onClick={() => handleMenuClick(item.label, hasSubMenus, item.href)}
                >
                  {item.href && !hasSubMenus ? (
                    <Link href={item.href} className="flex items-center w-full">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg w-full flex items-center justify-start"
                        aria-label={item.label}
                      >
                        <Icon className="size-5" />
                        <span
                          className="ml-2 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover/sidebar:max-w-full group-hover/sidebar:opacity-100"
                          style={{ minWidth: 0 }}
                        >
                          {item.label}
                        </span>
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg flex items-center w-full justify-start"
                      aria-label={item.label}
                    >
                      <Icon className="size-5" />
                      <span
                        className="ml-2 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover/sidebar:max-w-full group-hover/sidebar:opacity-100"
                        style={{ minWidth: 0 }}
                      >
                        {item.label}
                      </span>
                      {hasSubMenus && (
                        <ChevronRight
                          className={cn(
                            "ml-1 size-4 transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      )}
                    </Button>
                  )}
                </div>
                {/* Sub-menus as a sub-tree */}
                {hasSubMenus && isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-muted pl-2">
                    {item.subMenus!.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link href={sub.href} key={sub.label} className="flex items-center group w-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg flex items-center w-full justify-start hover:bg-muted/60"
                            aria-label={sub.label}
                          >
                            <SubIcon className="size-4" />
                            <span
                              className="ml-2 max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover/sidebar:max-w-full group-hover/sidebar:opacity-100"
                              style={{ minWidth: 0 }}
                            >
                              {sub.label}
                            </span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      {/* Main content, adaptive margin */}
      <div
        className="flex flex-col flex-1 transition-all duration-200 ease-in-out"
        style={{ marginLeft: 0 }}
      >
        {children}
      </div>
    </div>
  );
}
