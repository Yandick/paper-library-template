# Paper Library Template

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

学术论文库网站模板 —— 基于 Astro + Tailwind CSS 构建的静态站点。

配合 [Paper Distill MCP](https://github.com/Eclipse-Cj/paper-distill-mcp) 使用，每日自动更新论文推送内容。也可作为独立的论文展示站点使用。

## 预览

```
首页：今日论文推送（按研究方向分组）
归档页：历史推送按日期排列
论文卡片：标题、作者、期刊、影响因子、摘要、DOI 链接
```

## 特性

- 暗色 / 亮色主题切换
- 移动端响应式
- 纯静态站点，无需服务器
- 论文按研究方向自动分类
- 可展开的论文详情卡片

## 快速开始

### 1. 使用此模板

点击 **Use this template** 创建你自己的仓库。

### 2. 部署到 Vercel

1. 登录 [Vercel](https://vercel.com)，选择 **Continue with GitHub**
2. **Add New... → Project**，导入你的仓库
3. Vercel 会自动识别 Astro 项目，保持默认设置
4. 点击 **Deploy**，约 30 秒后站点上线

### 3. 配置每日更新（可选）

如果配合 Paper Distill MCP 使用：

1. Vercel 项目 → **Settings → Git → Deploy Hooks**
2. 创建 Hook（名称 `paper-digest`，分支 `main`）
3. 将 Hook URL 配置到 Paper Distill MCP 的 `.env` 中

## 项目结构

```
src/
  pages/
    index.astro              # 首页 — 最新推送
    archive.astro            # 归档页
    digest/[date].astro      # 历史推送详情
  components/
    PaperCard.astro          # 可展开论文卡片
  layouts/
    Layout.astro             # 导航栏、主题切换、页脚
  lib/
    categorize.ts            # 按研究方向分组
  content/
    digests/                 # 每日推送 JSON 文件
data/
  topic_prefs.json           # 研究方向配置
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建静态站点
```

## 自定义

- 修改 `data/topic_prefs.json` 配置研究方向
- 编辑 Astro 组件和 Tailwind 配置自定义样式
- `src/content/digests/` 目录存放每日推送数据（JSON 格式）

## 自定义域名（可选）

1. Vercel → **Settings → Domains**
2. 添加你的域名，按提示配置 DNS
3. 自动 HTTPS，免费

## 许可证

[MIT](LICENSE)
