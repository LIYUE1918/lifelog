"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Image, X, Trash2, Check, AlertTriangle, Clock, Loader2 } from "lucide-react"
import { createLog, deleteLog, toggleReminder, deleteReminder } from "@/actions/actions"

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
  createdAt: string
  tags: { tag: { id: string; name: string; color: string } }[]
}

interface TagType {
  id: string
  name: string
  color: string
}

const moodOptions = [
  { value: "great", label: "好极了", emoji: "😄" },
  { value: "good", label: "不错", emoji: "😊" },
  { value: "okay", label: "一般", emoji: "😐" },
  { value: "bad", label: "不好", emoji: "😞" },
  { value: "terrible", label: "糟糕", emoji: "😢" },
]

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  high: { label: "高", color: "bg-red-100 text-red-700", icon: "🔴" },
  medium: { label: "中", color: "bg-yellow-100 text-yellow-700", icon: "🟡" },
  low: { label: "低", color: "bg-blue-100 text-blue-700", icon: "🔵" },
}

function parseImages(images: string): string[] {
  try {
    return JSON.parse(images)
  } catch {
    return []
  }
}

export default function TimelinePage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [content, setContent] = useState("")
  const [mood, setMood] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("")

  const [logPage, setLogPage] = useState(1)
  const [reminderPage, setReminderPage] = useState(1)
  const [logHasMore, setLogHasMore] = useState(false)
  const [reminderHasMore, setReminderHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchData = useCallback(async (lp: number, rp: number, append: boolean) => {
    const res = await fetch(`/api/data?logPage=${lp}&reminderPage=${rp}`)
    const data = await res.json()
    if (append) {
      setLogs((prev) => [...prev, ...data.logs])
      setReminders((prev) => [...prev, ...data.reminders])
    } else {
      setLogs(data.logs)
      setReminders(data.reminders)
    }
    setTags(data.tags)
    setLogHasMore(data.logHasMore)
    setReminderHasMore(data.reminderHasMore)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    fetchData(1, 1, false)
  }, [fetchData])

  function handleLoadMore() {
    setLoadingMore(true)
    const nextLogPage = logHasMore ? logPage + 1 : logPage
    const nextReminderPage = reminderHasMore ? reminderPage + 1 : reminderPage
    setLogPage(nextLogPage)
    setReminderPage(nextReminderPage)
    fetchData(nextLogPage, nextReminderPage, true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.url) setImages((prev) => [...prev, data.url])
    setUploading(false)
  }

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && images.length === 0) return
    const fd = new FormData()
    fd.append("content", content)
    if (mood) fd.append("mood", mood)
    fd.append("images", JSON.stringify(images))
    selectedTags.forEach((t) => fd.append("tags", t))
    await createLog(fd)
    setContent("")
    setMood(null)
    setImages([])
    setSelectedTags([])
    setLogPage(1)
    setReminderPage(1)
    fetchData(1, 1, false)
  }

  async function handleDeleteLog(id: string) {
    await deleteLog(id)
    fetchData(1, 1, false)
  }

  async function handleToggleReminder(id: string, completed: boolean) {
    await toggleReminder(id, completed)
    fetchData(1, 1, false)
  }

  async function handleDeleteReminder(id: string) {
    await deleteReminder(id)
    fetchData(1, 1, false)
  }

  // Merge logs and reminders sorted by time
  const timelineItems: Array<{
    type: "log" | "reminder"
    time: Date
    log?: Log
    reminder?: Reminder
  }> = []

  logs.forEach((log) => {
    if (search && !log.content.toLowerCase().includes(search.toLowerCase())) return
    if (selectedTagFilter && !log.tags.some((t) => t.tag.name === selectedTagFilter)) return
    timelineItems.push({ type: "log", time: new Date(log.createdAt), log })
  })

  reminders.forEach((reminder) => {
    if (search && !reminder.title.toLowerCase().includes(search.toLowerCase())) return
    if (selectedTagFilter && !reminder.tags.some((t) => t.tag.name === selectedTagFilter)) return
    timelineItems.push({ type: "reminder", time: new Date(reminder.dueDate), reminder })
  })

  timelineItems.sort((a, b) => b.time.getTime() - a.time.getTime())

  // Group by date
  const groups: Record<string, typeof timelineItems> = {}
  timelineItems.forEach((item) => {
    const key = format(item.time, "yyyy-MM-dd")
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })

  return (
    <div className="max-w-2xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">时间线</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 sm:w-40 h-8 text-sm"
          />
          {tags.length > 0 && (
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="text-sm border rounded-md px-2 h-8 bg-background"
            >
              <option value="">全部标签</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Compose Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateLog} className="space-y-3">
            <Textarea
              placeholder="记点什么..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[60px]"
            />

            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="h-16 md:h-20 w-16 md:w-20 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Mood */}
              <div className="flex gap-1">
                {moodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(mood === opt.value ? null : opt.value)}
                    className={`text-lg px-1.5 py-0.5 rounded transition-colors ${
                      mood === opt.value ? "bg-accent ring-1 ring-border" : "opacity-50 hover:opacity-100"
                    }`}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>

              <Separator orientation="vertical" className="h-5" />

              {/* Image Upload */}
              <label className="cursor-pointer text-muted-foreground hover:text-foreground">
                <Image className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>

              {/* Tags */}
              <Dialog>
                <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground">
                  <Plus className="h-4 w-4 mr-1" /> 标签
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>选择标签</DialogTitle>
                  </DialogHeader>
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
                </DialogContent>
              </Dialog>

              <div className="flex-1" />
              <Button type="submit" size="sm" disabled={!content.trim() && images.length === 0}>
                发布
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {format(new Date(date), "M月d日 EEEE", { locale: zhCN })}
              </h3>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                if (item.type === "log" && item.log) {
                  const log = item.log
                  const logImages = parseImages(log.images)
                  return (
                    <Card key={log.id} className="group">
                      <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.createdAt), "HH:mm")}
                            {log.mood && (
                              <span>{moodOptions.find((m) => m.value === log.mood)?.emoji}</span>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteLog(log.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{log.content}</p>
                        {logImages.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {logImages.map((img, i) => (
                              <img key={i} src={img} alt="" className="h-20 md:h-24 w-20 md:w-24 object-cover rounded-md" />
                            ))}
                          </div>
                        )}
                        {log.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {log.tags.map((t) => (
                              <Badge key={t.tag.id} variant="secondary" className="text-xs" style={{ borderColor: t.tag.color }}>
                                {t.tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                }

                if (item.type === "reminder" && item.reminder) {
                  const reminder = item.reminder
                  const isOverdue = new Date(reminder.dueDate) < new Date() && !reminder.completed
                  const pConfig = priorityConfig[reminder.priority] || priorityConfig.medium
                  return (
                    <Card
                      key={reminder.id}
                      className={`border-l-4 ${reminder.completed ? "opacity-50 border-l-muted" : isOverdue ? "border-l-red-400" : "border-l-blue-400"}`}
                    >
                      <CardContent className="pt-4 pb-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleReminder(reminder.id, !reminder.completed)}
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                reminder.completed ? "bg-primary border-primary" : "border-muted-foreground"
                              }`}
                            >
                              {reminder.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                            </button>
                            <div>
                              <span className={`text-sm font-medium ${reminder.completed ? "line-through" : ""}`}>
                                {reminder.title}
                              </span>
                              {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-xs ${pConfig.color}`}>{pConfig.icon} {pConfig.label}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteReminder(reminder.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {reminder.description && (
                          <p className="text-xs text-muted-foreground ml-7">{reminder.description}</p>
                        )}
                        <div className="flex items-center gap-2 ml-7 text-xs text-muted-foreground">
                          <span>{format(new Date(reminder.dueDate), "HH:mm")}</span>
                          {reminder.tags.length > 0 && reminder.tags.map((t) => (
                            <Badge key={t.tag.id} variant="secondary" className="text-xs" style={{ borderColor: t.tag.color }}>
                              {t.tag.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                }
                return null
              })}
            </div>
          </div>
        ))}

        {Object.keys(groups).length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">还没有记录</p>
            <p className="text-sm mt-1">开始记录你的生活吧</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        )}

        {(logHasMore || reminderHasMore) && !loading && (
          <div className="text-center pt-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> 加载中...</>
              ) : (
                "加载更多"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
