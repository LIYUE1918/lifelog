"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  ListTodo,
  Clock,
  Tags,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const links = [
  { href: "/timeline", label: "时间线", icon: Clock },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/reminders", label: "提醒", icon: ListTodo },
  { href: "/tags", label: "标签", icon: Tags },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-2 space-y-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === link.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-48 md:flex-col md:h-screen md:sticky md:top-0 border-r bg-muted/30">
      <div className="p-4 border-b">
        <Link href="/timeline" className="text-lg font-semibold tracking-tight">
          LifeLog
        </Link>
      </div>
      <NavLinks />
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出
        </Button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="md:hidden flex items-center h-12 px-3 border-b bg-background shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8">
          <Menu className="h-4 w-4" />
        </SheetTrigger>
        <SheetContent side="left" className="w-48 p-0">
          <div className="flex flex-col h-full bg-muted/30">
            <div className="p-4 border-b">
              <Link
                href="/timeline"
                className="text-lg font-semibold tracking-tight"
                onClick={() => setOpen(false)}
              >
                LifeLog
              </Link>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => { signOut({ callbackUrl: "/login" }); setOpen(false) }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-2 font-semibold text-sm">LifeLog</span>
    </header>
  )
}
