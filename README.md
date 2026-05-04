# LifeLog

一个注重时间管理的轻量级生活日志 + 提醒应用。

## 功能

- 生活日志 — 文字 + 图片，时间线展示
- 提醒/待办 — 四象限优先级管理
- 日历视图 — 月历展示日志和提醒
- 标签分类 — 多对多标签，颜色区分
- 心情追踪 — 日志附带心情标记
- 全文搜索 — 搜索日志和提醒内容
- 图片上传 — 本地存储，拖拽上传

## 技术栈

| 技术 | 用途 |
|---|---|
| Next.js 14 | 全栈框架 |
| Prisma + SQLite | ORM + 数据库 |
| NextAuth.js | 密码认证 |
| Tailwind CSS + shadcn/ui | 极简白 UI |
| Vercel | 部署 |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置密码和密钥

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 环境变量

```env
DATABASE_URL="file:./dev.db"
ACCESS_PASSWORD="your-password-here"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Fork 本项目
2. 在 Vercel 导入项目
3. 设置环境变量
4. 部署完成

## 项目结构

```
src/
├── app/            # Next.js App Router 页面
│   ├── login/      # 登录页
│   ├── timeline/   # 首页时间线
│   ├── calendar/   # 日历视图
│   ├── reminders/  # 提醒列表
│   └── tags/       # 标签管理
├── components/     # UI 组件
├── lib/            # 工具函数 + Prisma 客户端
├── actions/        # Server Actions
└── api/            # API Routes
```

## License

MIT
