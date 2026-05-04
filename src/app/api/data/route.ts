import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get("all") === "1"
  const logPage = parseInt(searchParams.get("logPage") || "1")
  const reminderPage = parseInt(searchParams.get("reminderPage") || "1")

  if (all) {
    const [logs, reminders, tags] = await Promise.all([
      prisma.log.findMany({
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reminder.findMany({
        include: { tags: { include: { tag: true } } },
        orderBy: { dueDate: "desc" },
      }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ])
    return NextResponse.json({ logs, reminders, tags, logHasMore: false, reminderHasMore: false })
  }

  const skip = (logPage - 1) * PAGE_SIZE

  const [logs, logTotal] = await Promise.all([
    prisma.log.findMany({
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.log.count(),
  ])

  const [reminders, reminderTotal] = await Promise.all([
    prisma.reminder.findMany({
      include: { tags: { include: { tag: true } } },
      orderBy: { dueDate: "desc" },
      skip: (reminderPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.reminder.count(),
  ])

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } })

  return NextResponse.json({
    logs,
    reminders,
    tags,
    logHasMore: skip + logs.length < logTotal,
    reminderHasMore: (reminderPage - 1) * PAGE_SIZE + reminders.length < reminderTotal,
  })
}
