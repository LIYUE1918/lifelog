"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { createTag, deleteTag } from "@/actions/actions"

interface TagType {
  id: string
  name: string
  color: string
}

const presetColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"]

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([])
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366f1")

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/data?all=1")
    const data = await res.json()
    setTags(data.tags)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const fd = new FormData()
    fd.append("name", name.trim())
    fd.append("color", color)
    await createTag(fd)
    setName("")
    setColor("#6366f1")
    fetchData()
  }

  async function handleDelete(id: string) {
    await deleteTag(id)
    fetchData()
  }

  return (
    <div className="max-w-2xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">标签管理</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="标签名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex gap-1">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-1" /> 添加
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="text-sm font-medium">{tag.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(tag.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-center text-muted-foreground py-8">还没有标签</p>
        )}
      </div>
    </div>
  )
}
