"use client"

import { useEffect, useState, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Check } from "lucide-react"

interface Log {
  id: string
  content: string
  images: string
  mood: string | null
  createdAt: string
  tags: { tag: { id: string; name: string; color: string } }[]
}

interface Reminder {
  id: string
  title: string
  description: string | null
  dueDate: string
  completed: boolean
  priority: string
  tags: { tag: { id: string; name: string; color: string } }[]
}

const moodEmoji: Record<string, string> = {
  great: "😄", good: "😊", okay: "😐", bad: "😞", terrible: "😢",
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/data?all=1")
    const data = await res.json()
    setLogs(data.logs)
    setReminders(data.reminders)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekday = getDay(monthStart)

  function getDayLogs(date: Date) {
    return logs.filter((l) => isSameDay(new Date(l.createdAt), date))
  }

  function getDayReminders(date: Date) {
    return reminders.filter((r) => isSameDay(new Date(r.dueDate), date))
  }

  const selectedItems = selectedDate ? [
    ...getDayLogs(selectedDate).map((l) => ({ type: "log" as const, data: l, time: new Date(l.createdAt) })),
    ...getDayReminders(selectedDate).map((r) => ({ type: "reminder" as const, data: r, time: new Date(r.dueDate) })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime()) : []

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">日历</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center">
            {format(currentDate, "yyyy年M月", { locale: zhCN })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}>
            今天
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 bg-muted/30">
            {d}
          </div>
        ))}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background min-h-[56px] md:min-h-[80px]" />
        ))}
        {days.map((day) => {
          const dayLogs = getDayLogs(day)
          const dayReminders = getDayReminders(day)
          const hasContent = dayLogs.length > 0 || dayReminders.length > 0
          const isCurrentDay = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "bg-background min-h-[56px] md:min-h-[80px] p-1 md:p-1.5 text-left hover:bg-muted/50 transition-colors",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center text-[10px] md:text-xs w-5 h-5 md:w-6 md:h-6 rounded-full",
                isCurrentDay && "bg-primary text-primary-foreground font-semibold"
              )}>
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayReminders.slice(0, 2).map((r) => (
                  <div key={r.id} className={cn("text-[10px] truncate px-1 py-0.5 rounded", r.completed ? "bg-muted line-through" : "bg-blue-50 text-blue-700")}>
                    ▲ {r.title}
                  </div>
                ))}
                {dayLogs.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayLogs.slice(0, 3).map((l) => (
                      <span key={l.id} className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && selectedItems.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <h3 className="text-sm font-medium">
              {format(selectedDate, "M月d日 EEEE", { locale: zhCN })}
            </h3>
            {selectedItems.map((item) => {
              if (item.type === "log") {
                const log = item.data as Log
                return (
                  <div key={log.id} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/30">
                    <Clock className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground text-xs">{format(new Date(log.createdAt), "HH:mm")}</span>
                      <span className="ml-2">{log.content.length > 60 ? log.content.slice(0, 60) + "..." : log.content}</span>
                      {log.mood && <span className="ml-1">{moodEmoji[log.mood]}</span>}
                    </div>
                  </div>
                )
              }
              if (item.type === "reminder") {
                const r = item.data as Reminder
                const isOverdue = new Date(r.dueDate) < new Date() && !r.completed
                return (
                  <div key={r.id} className={cn("flex items-center gap-2 text-sm p-2 rounded-md", r.completed ? "bg-muted/30 opacity-50" : "bg-blue-50")}>
                    {r.completed ? <Check className="h-3 w-3" /> : isOverdue ? <AlertTriangle className="h-3 w-3 text-red-500" /> : <Clock className="h-3 w-3" />}
                    <div>
                      <span className={r.completed ? "line-through" : ""}>{r.title}</span>
                      <span className="text-muted-foreground text-xs ml-2">{format(new Date(r.dueDate), "HH:mm")}</span>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
