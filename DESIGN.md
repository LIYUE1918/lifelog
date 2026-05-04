# LifeLog - 设计文档

> 一个注重时间管理的轻量级生活日志 + 提醒应用

---

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 前后端一体，Server Actions + API Routes |
| 数据库 | SQLite + Prisma ORM | 零配置，单文件数据库 |
| 认证 | next-auth Credentials | 单用户密码，环境变量存储 |
| UI | Tailwind CSS + shadcn/ui | 极简白风格，大量预置组件 |
| 图片 | 本地 public/uploads | 无需云服务 |
| 部署 | Vercel | 免费一键部署，长期在线 |

---

## 数据库设计 (ER 图)

```
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│         Log             │    │       Reminder          │    │          Tag            │
├─────────────────────────┤    ├─────────────────────────┤    ├─────────────────────────┤
│ PK id          String   │    │ PK id          String   │    │ PK id          String   │
│    content     String   │    │    title       String   │    │    name        String   │
│    images      String[] │    │    description String?  │    │    color       String   │
│    mood        String?  │    │    dueDate     DateTime │    │    createdAt   DateTime │
│    createdAt   DateTime │    │    completed   Boolean  │    └─────────────────────────┘
│    updatedAt   DateTime │    │    priority    String   │              │
└─────────────────────────┘    │    createdAt   DateTime │              │
         │    │                │    updatedAt   DateTime │              │
         │    │                └─────────────────────────┘              │
         │    │                     │    │                              │
         │    └─────────────────────┼────┼──────────────────────────────┘
         │                          │    │
    ┌────▼─────────┐          ┌─────▼────▼─────┐
    │  LogTag      │          │  ReminderTag   │    多对多关联表
    │  logId       │          │  reminderId    │
    │  tagId       │          │  tagId         │
    └──────────────┘          └────────────────┘
```

### 字段说明

| 字段 | 说明 |
|---|---|
| `mood` | 日志心情 (great/good/okay/bad/terrible) |
| `priority` | 提醒优先级 (high/medium/low)，对应时间管理四象限 |
| `color` | 标签颜色 (hex)，视觉区分 |
| `images` | 图片相对路径数组 |

---

## 页面架构

```
     ┌──────────┐
     │  /login  │  密码验证
     └────┬─────┘
          │
    ┌─────▼──────────────────────┐
    │  /timeline (首页)           │
    │  ├─ 快速发布日志输入框       │
    │  ├─ 日志 + 提醒混排时间线    │
    │  └─ 侧边栏导航              │
    └──┬──────┬──────┬───────────┘
       │      │      │
  ┌────┘      │      └────┐
  ▼           ▼           ▼
/calendar  /reminders   /tags
月/周视图   提醒列表     标签管理
```

### 页面清单

| 路由 | 功能 |
|---|---|
| `/login` | 密码登录页 |
| `/timeline` | 首页，日志+提醒时间线，快速发布 |
| `/calendar` | 月历视图，展示日志(●)和提醒(▲) |
| `/reminders` | 提醒列表，按优先级分组，增删改查 |
| `/tags` | 标签管理 |

---

## 时间管理四象限

```
                    重 要
                      │
         II           │          I
      计划做          │       马上做
    (低优先级)       │     (高优先级)
                      │
    ──────────────────┼──────────────────→ 紧 急
                      │
        IV           │         III
      少做           │       授权做
   (可选/删除)      │     (有时间就做)
```

- `priority: high` → 象限 I (紧急重要)
- `priority: medium` → 象限 II (重要不紧急)
- `priority: low` → 象限 III/IV

---

## 系统架构

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Browser   │────▶│  Next.js 14  │────▶│  SQLite   │
│             │     │  App Router  │     │  (Prisma) │
└─────────────┘     │              │     └───────────┘
                    │  Server      │
                    │  Actions     │     ┌───────────┐
                    │  API Routes  │────▶│  public/  │
                    │              │     │  uploads/ │
                    │  next-auth   │     └───────────┘
                    │  middleware  │
                    └──────────────┘
```

---

## UI 设计原则

- **极简白**: 白色背景，微灰卡片，黑色文字
- **时间线**: 按日期分组，日志和提醒混排
- **四象限**: 提醒按优先级自动分组展示
- **快速记录**: 顶部固定输入框，类似发推文
- **日历热力图**: 有日志的日期显示圆点，提醒显示三角形标记
