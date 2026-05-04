"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function createLog(formData: FormData) {
  const content = formData.get("content") as string
  const mood = (formData.get("mood") as string) || null
  const images = (formData.get("images") as string) || "[]"
  const tagNames = formData.getAll("tags") as string[]

  const log = await prisma.log.create({
    data: {
      content,
      mood,
      images,
    },
  })

  if (tagNames.length > 0 && tagNames[0]) {
    for (const name of tagNames) {
      let tag = await prisma.tag.findUnique({ where: { name } })
      if (!tag) tag = await prisma.tag.create({ data: { name } })
      await prisma.logTag.create({ data: { logId: log.id, tagId: tag.id } })
    }
  }

  revalidatePath("/timeline")
  revalidatePath("/calendar")
}

export async function updateLog(id: string, formData: FormData) {
  const content = formData.get("content") as string
  const mood = (formData.get("mood") as string) || null

  await prisma.log.update({ where: { id }, data: { content, mood } })
  revalidatePath("/timeline")
  revalidatePath("/calendar")
}

export async function deleteLog(id: string) {
  await prisma.log.delete({ where: { id } })
  revalidatePath("/timeline")
  revalidatePath("/calendar")
}

export async function createReminder(formData: FormData) {
  const title = formData.get("title") as string
  const description = (formData.get("description") as string) || null
  const dueDate = new Date(formData.get("dueDate") as string)
  const priority = (formData.get("priority") as string) || "medium"
  const tagNames = formData.getAll("tags") as string[]

  const reminder = await prisma.reminder.create({
    data: { title, description, dueDate, priority },
  })

  if (tagNames.length > 0 && tagNames[0]) {
    for (const name of tagNames) {
      let tag = await prisma.tag.findUnique({ where: { name } })
      if (!tag) tag = await prisma.tag.create({ data: { name } })
      await prisma.reminderTag.create({ data: { reminderId: reminder.id, tagId: tag.id } })
    }
  }

  revalidatePath("/reminders")
  revalidatePath("/calendar")
  revalidatePath("/timeline")
}

export async function updateReminder(id: string, formData: FormData) {
  const title = formData.get("title") as string
  const description = (formData.get("description") as string) || null
  const dueDate = new Date(formData.get("dueDate") as string)
  const priority = (formData.get("priority") as string) || "medium"

  await prisma.reminder.update({
    where: { id },
    data: { title, description, dueDate, priority },
  })
  revalidatePath("/reminders")
  revalidatePath("/calendar")
  revalidatePath("/timeline")
}

export async function toggleReminder(id: string, completed: boolean) {
  await prisma.reminder.update({ where: { id }, data: { completed } })
  revalidatePath("/reminders")
  revalidatePath("/calendar")
  revalidatePath("/timeline")
}

export async function deleteReminder(id: string) {
  await prisma.reminder.delete({ where: { id } })
  revalidatePath("/reminders")
  revalidatePath("/calendar")
  revalidatePath("/timeline")
}

export async function createTag(formData: FormData) {
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || "#6366f1"
  await prisma.tag.create({ data: { name, color } })
  revalidatePath("/tags")
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } })
  revalidatePath("/tags")
}
