"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Check, AlertTriangle, Pencil } from "lucide-react"
import { createReminder, toggleReminder, deleteReminder } from "@/actions/actions"

interface Reminder {
  id: string
  title: string
  description: string | null
  dueDate: string
  completed: boolean
  priority: string
  createdAt: string
  tags: { tag: { id: string; name: string; color: string } }[]
}

interface TagType { id: string; name: string; color: string }

const priorityConfig: Record<string, { label: string; color: string; border: string }> = {
  high: { label: "紧急重要", color: "bg-red-100 text-red-700", border: "border-red-400" },
  medium: { label: "重要不紧急", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-400" },
  low: { label: "不急不重要", color: "bg-blue-100 text-blue-700", border: "border-blue-400" },
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("medium")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/data?all=1")
    const data = await res.json()
    setReminders(data.reminders)
    setTags(data.tags)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    const fd = new FormData()
    fd.append("title", title)
    fd.append("description", description)
    fd.append("dueDate", dueDate)
    fd.append("priority", priority)
    selectedTags.forEach((t) => fd.append("tags", t))
    await createReminder(fd)
    setTitle("")
    setDescription("")
    setDueDate("")
    setPriority("medium")
    setSelectedTags([])
    setOpen(false)
    fetchData()
  }

  async function handleToggle(id: string, completed: boolean) {
    await toggleReminder(id, completed)
    fetchData()
  }

  async function handleDelete(id: string) {
    await deleteReminder(id)
    fetchData()
  }

  const filteredReminders = reminders.filter((r) => {
    if (filter === "pending") return !r.completed
    if (filter === "completed") return r.completed
    return true
  })

  const pending = filteredReminders.filter((r) => !r.completed)
  const completed = filteredReminders.filter((r) => r.completed)

  const groupedByPriority = (items: Reminder[]) => {
    const high = items.filter((r) => r.priority === "high")
    const medium = items.filter((r) => r.priority === "medium")
    const low = items.filter((r) => r.priority === "low")
    return { high, medium, low }
  }

  const pendingGroups = groupedByPriority(pending)

  return (
    <div className="max-w-2xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">提醒</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="h-4 w-4 mr-1" /> 新建提醒
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建提醒</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="描述 (可选)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="flex gap-2">
                <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="border rounded-md px-3 text-sm bg-background"
                >
                  <option value="high">🔴 高优先级</option>
                  <option value="medium">🟡 中优先级</option>
                  <option value="low">🔵 低优先级</option>
                </select>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{ borderColor: tag.color }}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag.name) ? prev.filter((t) => t !== tag.name) : [...prev, tag.name]
                        )
                      }
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <Button type="submit" className="w-full">创建</Button>
            </form>
          </DialogContent>
        </Dialog>
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "全部" : f === "pending" ? "未完成" : "已完成"}
            </Button>
          ))}
        </div>
      </div>

      {/* Pending grouped by priority */}
      {(["high", "medium", "low"] as const).map((p) => {
        const items = pendingGroups[p]
        if (items.length === 0) return null
        const pConfig = priorityConfig[p]
        return (
          <div key={p} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{pConfig.label}</h3>
            <div className="space-y-2">
              {items.map((r) => {
                const isOverdue = new Date(r.dueDate) < new Date()
                return (
                  <Card key={r.id} className={`border-l-4 ${isOverdue ? "border-l-red-400" : pConfig.border}`}>
                    <CardContent className="pt-4 pb-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(r.id, true)}
                            className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:bg-primary/20"
                          >
                          </button>
                          <div>
                            <span className="text-sm font-medium">{r.title}</span>
                            {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground ml-7">{r.description}</p>
                      )}
                      <div className="flex items-center gap-2 ml-7 text-xs text-muted-foreground">
                        <span>{format(new Date(r.dueDate), "M月d日 HH:mm", { locale: zhCN })}</span>
                        {r.tags.map((t) => (
                          <Badge key={t.tag.id} variant="secondary" className="text-xs" style={{ borderColor: t.tag.color }}>
                            {t.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">已完成</h3>
          <div className="space-y-2">
            {completed.map((r) => (
              <Card key={r.id} className="opacity-50">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(r.id, false)} className="h-5 w-5 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </button>
                    <span className="text-sm line-through">{r.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(r.dueDate), "M月d日", { locale: zhCN })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && completed.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p>暂无提醒</p>
        </div>
      )}
    </div>
  )
}
