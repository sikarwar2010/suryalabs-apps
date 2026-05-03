"use client";

import { Bell, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth/client";
import { ModeToggle } from "./ModeToggle";

export function TopBar({
  onMenuClick,
  user,
}: {
  onMenuClick?: () => void;
  user: { name: string; email: string; role?: string | null };
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    router.prefetch("/sign-in");
  }, [router]);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully");
          router.replace("/sign-in");
        },
        onError: () => {
          toast.error("Sign out failed. Please try again.");
          setIsSigningOut(false);
        },
      },
    });
  }

  const displayName = user.name?.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const shortName = displayName.split(/\s+/)[0];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-orange-100/80 bg-white/90 px-3 backdrop-blur sm:h-16 sm:gap-4 sm:px-5 lg:px-6 dark:border-white/10 dark:bg-slate-950/90">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-xl text-slate-600 hover:bg-orange-50 hover:text-orange-700 lg:hidden dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 sm:block sm:max-w-sm xl:max-w-md">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search leads, orders, items..."
            className="w-full rounded-xl border border-orange-100 bg-orange-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400/60 dark:focus:bg-white/10 dark:focus:ring-orange-500/15"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-950" />
        </Button>
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-2 rounded-xl border border-orange-100 bg-white px-1.5 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-orange-50 sm:px-2 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-amber-500 text-xs font-semibold text-white">
                {initial}
              </div>
              <span className="hidden max-w-28 truncate md:inline lg:max-w-40">
                {shortName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl border-orange-100 p-0 shadow-xl dark:border-white/10"
          >
            <DropdownMenuLabel className="border-b border-orange-100 p-0 font-normal dark:border-white/10">
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
                {user.role != null && user.role !== "" ? (
                  <p className="mt-1 text-xs font-medium capitalize text-orange-600">
                    {user.role}
                  </p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <div className="p-1">
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => router.push("/dashboard/settings/profile")}
              >
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => router.push("/dashboard/settings")}
              >
                <Settings />
                Settings
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0 bg-orange-100 dark:bg-white/10" />
            <div className="p-1">
              <DropdownMenuItem
                variant="destructive"
                className="rounded-lg"
                disabled={isSigningOut}
                onSelect={() => {
                  void handleSignOut();
                }}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
