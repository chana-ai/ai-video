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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="grid h-screen w-full pl-[56px]">
        <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
          <div className="border-b p-2">
            <Link href="/">
              <Button variant="outline" size="icon" aria-label="Home">
                <Clapperboard className="size-5" />
              </Button>
            </Link>
          </div>
          <nav className="grid gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/dashboard">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Playground"
                  >
                    <LayoutDashboard className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                看板
              </TooltipContent>
            </Tooltip>
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/playground">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg bg-muted"
                    aria-label="Playground"
                  >
                    <SquareTerminal className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Playground
              </TooltipContent>
            </Tooltip> */}

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/materials">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Materials"
                  >
                    <Boxes className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                用户素材集合
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/videos">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Video"
                  >
                    <FileVideo2 className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                视频
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/projects">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Settings"
                  >
                    <Settings2 className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
               <TooltipContent side="right" sideOffset={5}>
                projects
              </TooltipContent> 
            </Tooltip> 
          </nav>
          {/* <nav className="mt-auto grid gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/docs">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-auto rounded-lg"
                    aria-label="Help"
                  >
                    <BookOpenText className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Docs
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai/account">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-auto rounded-lg"
                    aria-label="Account"
                  >
                    <SquareUser className="size-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Account
              </TooltipContent>
            </Tooltip>
          </nav> */}
        </aside>
        <div className="flex flex-col">{children}</div>
      </div>
    </>
  );
}
