# 临床试验小秘书

面向临研人的项目待办管理助手。当前网页版支持项目管理、待办管理、完成统计、搜索、任务注释、本地账号隔离和导出。

## 本地开发

```bash
npm run dev
```

默认开发地址会显示在终端里，通常是 `http://localhost:4173`。

## 构建上线

```bash
npm run build
```

构建产物会生成到 `dist/`，可以部署到 Vercel、Netlify、Cloudflare Pages 或任意静态网站服务器。

## 部署建议

### Vercel

- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `dist`

### Netlify

- Build Command: `npm run build`
- Publish Directory: `dist`

### 静态服务器

执行 `npm run build` 后，把 `dist/` 目录内容上传到服务器或对象存储即可。

## 当前数据说明

当前版本数据保存在浏览器本地 `localStorage` 中。登录功能目前用于本机账户空间隔离，还没有接入云端认证和跨设备同步。

后续上线小程序和 APP 前，建议优先补齐后端账号体系、数据库和同步 API。
