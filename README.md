# Tanko Manga & Manhwa Serverless API

A high-performance, serverless REST API for **Manga, Manhwa, and Manhua** powered by [Hono](https://hono.dev/) with TypeScript, designed for seamless deployment on **Vercel Serverless Functions**.

Adapted from the [Tanko](https://github.com/Alexandro521/Tanko) terminal manga reader, this backend provides a clean RESTful interface for web and mobile frontends (React, React Native, Expo, Flutter, Next.js, etc.) with streaming image proxying, edge caching, and full CORS support.

---

## 🌟 Key Features

- **⚡ Blazing Fast & Serverless**: Built on Hono with near-instant cold starts and zero heavy browser/Playwright dependencies.
- **📚 Multi-Source Providers**:
  - **MangaDex**: Official REST integration with multi-language chapters, rich metadata, and cover art.
  - **Manganato / MangaRead**: Pure HTTP scraping for Korean manhwa, Chinese manhua, and Japanese manga.
  - Extensible provider registry (`?provider=mangadex` or `?provider=manganato`).
- **🖼️ Streaming Image Proxy**: Built-in `/api/proxy-image` route that streams chapter images with correct `Referer` headers and `Cache-Control` edge caching, bypassing CORS and hotlink restrictions on mobile and web clients.
- **🌐 Full CORS Enabled**: Pre-configured with wildcard CORS for seamless requests from mobile applications and web browsers.
- **🖥️ Built-in Testing UI**: Interactive web testing dashboard served at `/` for quick API experimentation right in your browser.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The server will start on [http://localhost:3000](http://localhost:3000). Open this URL in your browser to view the interactive testing dashboard.

### 3. Build for Production
```bash
npm run build
```

---

## ☁️ Deploying to Vercel

### Option 1: Deploy with Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: Deploy via GitHub / GitLab
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Keep default settings (Vercel automatically detects `vercel.json` and `api/index.ts`).
4. Click **Deploy**.

---

## 📖 API Documentation

All API responses follow a consistent JSON envelope:
```json
{
  "success": true,
  "data": ...
}
```

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verify server status and registered providers.
- **Example**:
  ```bash
  curl http://localhost:3000/api/health
  ```
- **Response**:
  ```json
  {
    "success": true,
    "status": "ok",
    "timestamp": "2026-09-10T17:00:00.000Z",
    "providers": [
      { "name": "mangadex", "isDefault": true },
      { "name": "manganato", "isDefault": false },
      { "name": "mangaread", "isDefault": false }
    ]
  }
  ```

---

### 2. Search Titles
- **Endpoint**: `GET /api/search`
- **Query Parameters**:
  - `q` (required): Search keyword (e.g., `solo leveling`, `one piece`).
  - `provider` (optional): `mangadex` (default) or `manganato`.
  - `page` (optional): Page number (default: `1`).
- **Example**:
  ```bash
  curl "http://localhost:3000/api/search?q=solo+leveling&provider=mangadex"
  ```
- **Response**:
  ```json
  {
    "success": true,
    "provider": "mangadex",
    "page": 1,
    "results": 20,
    "data": [
      {
        "id": "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
        "title": "Solo Leveling",
        "description": "10 years ago, after 'the Gate' that connected the real world with the monster world opened...",
        "cover": "https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/filename.512.jpg",
        "authors": ["Chugong", "DUBU"],
        "status": "completed",
        "genres": ["Action", "Fantasy"],
        "latestChapter": "200",
        "provider": "mangadex"
      }
    ]
  }
  ```

---

### 3. Popular & Trending Manga
- **Endpoint**: `GET /api/popular`
- **Query Parameters**:
  - `provider` (optional): `mangadex` or `manganato`.
  - `page` (optional): Page number (default: `1`).
- **Example**:
  ```bash
  curl "http://localhost:3000/api/popular?provider=manganato"
  ```

---

### 4. Latest Updated Titles
- **Endpoint**: `GET /api/latest`
- **Query Parameters**:
  - `provider` (optional): `mangadex` or `manganato`.
  - `page` (optional): Page number (default: `1`).
- **Example**:
  ```bash
  curl "http://localhost:3000/api/latest?provider=mangadex"
  ```

---

### 5. Manga Details
- **Endpoint**: `GET /api/manga/:id`
- **Query Parameters**:
  - `provider` (optional): `mangadex` or `manganato`.
- **Example**:
  ```bash
  curl "http://localhost:3000/api/manga/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0?provider=mangadex"
  ```

---

### 6. Chapter Feed
- **Endpoint**: `GET /api/chapters/:id`
- **Query Parameters**:
  - `provider` (optional): `mangadex` or `manganato`.
  - `lang` (optional): Filter translation language (e.g., `en`, `es`, `fr`, or `all`). Default: `en`.
- **Example**:
  ```bash
  curl "http://localhost:3000/api/chapters/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0?provider=mangadex&lang=en"
  ```
- **Response**:
  ```json
  {
    "success": true,
    "provider": "mangadex",
    "count": 200,
    "data": [
      {
        "id": "7e8305c0-e1a9-42c4-8d72-96217f73f9a3",
        "number": 200,
        "title": "Ch. 200 - Epilogue",
        "lang": "en",
        "publishDate": "2023-05-31T00:00:00Z",
        "pagesCount": 22
      }
    ]
  }
  ```

---

### 7. Chapter Pages & Reader
- **Endpoint**: `GET /api/pages/:chapterId`
- **Query Parameters**:
  - `provider` (optional): `mangadex` or `manganato`.
- **Description**: Returns all pages for reading. Each page object includes a pre-proxied `imageUrl` (ready to be displayed in an `<img>` tag or React Native `<Image source={{ uri }}>`) and the raw `directUrl`.
- **Example**:
  ```bash
  curl "http://localhost:3000/api/pages/7e8305c0-e1a9-42c4-8d72-96217f73f9a3?provider=mangadex"
  ```
- **Response**:
  ```json
  {
    "success": true,
    "provider": "mangadex",
    "chapterId": "7e8305c0-e1a9-42c4-8d72-96217f73f9a3",
    "pagesCount": 22,
    "data": [
      {
        "page": 1,
        "imageUrl": "https://your-vercel-domain.vercel.app/api/proxy-image?url=https%3A%2F%2Fcmdxd...&referer=https%3A%2F%2Fmangadex.org",
        "directUrl": "https://cmdxd.../data/.../1.png"
      }
    ]
  }
  ```

---

### 8. Streaming Image Proxy
- **Endpoint**: `GET /api/proxy-image`
- **Query Parameters**:
  - `url` (required): Target image URL (URL-encoded).
  - `referer` (optional): Referer header to bypass hotlink protection.
- **Description**: Proxies binary images with `Cache-Control: public, max-age=86400` and CORS headers.

---

## 📱 Mobile App (React Native / Flutter) Example

```typescript
// Fetch chapters and render pages in React Native
async function readChapter(chapterId: string, provider: string) {
  const res = await fetch(\`https://your-vercel-domain.vercel.app/api/pages/\${chapterId}?provider=\${provider}\`);
  const { data } = await res.json();

  // data = [{ page: 1, imageUrl: 'https://...', directUrl: 'https://...' }]
  return data;
}
```
