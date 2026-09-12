import { Hono } from 'hono';

export const docsRouter = new Hono();

docsRouter.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tanko Manga API &bull; Vercel Serverless</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: rgba(18, 20, 32, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #ff4655;
      --accent-grad: linear-gradient(135deg, #ff4655 0%, #ff7360 50%, #9047ff 100%);
      --text: #f1f3f9;
      --text-muted: #8b92a5;
      --code-bg: #0d0e15;
      --badge: rgba(255, 70, 85, 0.15);
      --badge-text: #ff7582;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 30px 20px;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(255, 70, 85, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(144, 71, 255, 0.08) 0%, transparent 40%);
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 35px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 15px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      width: 44px; height: 44px;
      background: var(--accent-grad);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 22px; color: #fff;
      box-shadow: 0 4px 20px rgba(255, 70, 85, 0.35);
    }
    .brand h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: var(--text-muted); }
    .status-badge {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--success);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: flex; align-items: center; gap: 6px;
    }
    .status-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 850px) { .grid { grid-template-columns: 1fr; } }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s;
    }
    .card:hover { border-color: rgba(255, 255, 255, 0.15); }
    .card-title {
      font-size: 16px; font-weight: 700; margin-bottom: 6px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; }
    .method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; font-weight: 700;
      padding: 3px 8px; border-radius: 6px;
      background: rgba(144, 71, 255, 0.2); color: #c499ff;
    }

    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-row { display: flex; gap: 8px; }
    input, select {
      flex: 1;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { border-color: var(--accent); }
    button {
      background: var(--accent-grad);
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: opacity 0.2s, transform 0.1s;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.98); }

    .result-box {
      margin-top: 14px;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      max-height: 240px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #9cdcfe;
      display: none;
    }
    .preview-shelf {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .manga-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .manga-card:hover { transform: translateY(-4px); }
    .manga-card img { width: 100%; height: 170px; object-fit: cover; }
    .manga-card .info { padding: 8px; }
    .manga-card .title { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .manga-card .sub { font-size: 11px; color: var(--text-muted); }

    .full-width { grid-column: span 2; }
    @media (max-width: 850px) { .full-width { grid-column: span 1; } }

    .code-tag {
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">&lambda;</div>
        <div>
          <h1>Tanko Manga Serverless API</h1>
          <p>Next-gen REST API for Manga, Manhwa & Manhua &bull; Deployed on Vercel with Hono</p>
        </div>
      </div>
      <div class="status-badge">
        <span class="status-dot"></span>
        <span>Online &bull; CORS Enabled &bull; Image Proxy Ready</span>
      </div>
    </header>

    <div class="grid">
      <!-- Search Endpoint -->
      <div class="card full-width">
        <div class="card-title">
          <span>Search Manga, Manhwa & Manhua</span>
          <span class="method">GET /api/search</span>
        </div>
        <div class="card-desc">Search by keyword across MangaDex (global) or Manganato (Korean manhwa & Chinese manhua).</div>
        <div class="form-group">
          <div class="input-row">
            <input type="text" id="search-q" placeholder="Enter title (e.g., Solo Leveling, Naruto, One Piece)..." value="Solo Leveling">
            <select id="search-provider" style="max-width: 170px;">
              <option value="mangadex">MangaDex</option>
              <option value="manganato">Manganato</option>
            </select>
            <button onclick="runSearch()">Search</button>
          </div>
        </div>
        <div id="search-shelf" class="preview-shelf"></div>
        <div id="search-result" class="result-box"></div>
      </div>

      <!-- Popular Manga -->
      <div class="card">
        <div class="card-title">
          <span>Popular & Trending</span>
          <span class="method">GET /api/popular</span>
        </div>
        <div class="card-desc">Fetch currently popular titles with ratings, covers, and descriptions.</div>
        <div class="input-row">
          <select id="popular-provider">
            <option value="mangadex">MangaDex</option>
            <option value="manganato">Manganato</option>
          </select>
          <button onclick="runPopular()">Fetch</button>
        </div>
        <div id="popular-result" class="result-box"></div>
      </div>

      <!-- Latest Updates -->
      <div class="card">
        <div class="card-title">
          <span>Latest Chapter Updates</span>
          <span class="method">GET /api/latest</span>
        </div>
        <div class="card-desc">Get the latest chapters released across the catalogue.</div>
        <div class="input-row">
          <select id="latest-provider">
            <option value="mangadex">MangaDex</option>
            <option value="manganato">Manganato</option>
          </select>
          <button onclick="runLatest()">Fetch</button>
        </div>
        <div id="latest-result" class="result-box"></div>
      </div>

      <!-- Chapter List -->
      <div class="card">
        <div class="card-title">
          <span>Manga Chapters</span>
          <span class="method">GET /api/chapters/:id</span>
        </div>
        <div class="card-desc">Fetch the complete chapter list for a given manga ID.</div>
        <div class="input-row">
          <input type="text" id="chapters-id" placeholder="Manga ID (paste from search)...">
          <select id="chapters-provider" style="max-width: 140px;">
            <option value="mangadex">MangaDex</option>
            <option value="manganato">Manganato</option>
          </select>
          <button onclick="runChapters()">Get</button>
        </div>
        <div id="chapters-result" class="result-box"></div>
      </div>

      <!-- Chapter Pages & Image Reader -->
      <div class="card">
        <div class="card-title">
          <span>Chapter Pages (Proxy Streamed)</span>
          <span class="method">GET /api/pages/:chapterId</span>
        </div>
        <div class="card-desc">Extracts high-resolution images automatically routed through <span class="code-tag">/api/proxy-image</span>.</div>
        <div class="input-row">
          <input type="text" id="pages-id" placeholder="Chapter ID...">
          <select id="pages-provider" style="max-width: 140px;">
            <option value="mangadex">MangaDex</option>
            <option value="manganato">Manganato</option>
          </select>
          <button onclick="runPages()">Read</button>
        </div>
        <div id="pages-result" class="result-box"></div>
      </div>

      <!-- Chapter Page Reader Preview Area -->
      <div id="reader-container" class="card full-width" style="display: none;">
        <div class="card-title">
          <span id="reader-title">Chapter Reader Preview</span>
          <button onclick="closeReader()" style="padding: 4px 10px; font-size: 11px;">Close Reader</button>
        </div>
        <div id="reader-pages" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 15px; max-height: 600px; overflow-y: auto;"></div>
      </div>
    </div>
  </div>

  <script>
    async function apiFetch(path) {
      const res = await fetch(path);
      return await res.json();
    }

    function showJson(elemId, data) {
      const box = document.getElementById(elemId);
      box.style.display = 'block';
      box.textContent = JSON.stringify(data, null, 2);
    }

    async function runSearch() {
      const q = document.getElementById('search-q').value.trim();
      const p = document.getElementById('search-provider').value;
      if (!q) return alert('Please enter a search query');
      const box = document.getElementById('search-result');
      const shelf = document.getElementById('search-shelf');
      box.style.display = 'block';
      box.textContent = 'Searching...';
      shelf.innerHTML = '';

      try {
        const res = await apiFetch(\`/api/search?q=\${encodeURIComponent(q)}&provider=\${p}\`);
        showJson('search-result', res);

        if (res.success && res.data) {
          shelf.innerHTML = res.data.map(m => \`
            <div class="manga-card" onclick="selectManga('\${m.id}', '\${p}')">
              <img src="\${m.cover || 'https://via.placeholder.com/150x200?text=No+Cover'}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'" />
              <div class="info">
                <div class="title" title="\${m.title}">\${m.title}</div>
                <div class="sub">\${m.latestChapter ? m.latestChapter : (m.status || '')}</div>
              </div>
            </div>
          \`).join('');
        }
      } catch (err) {
        box.textContent = 'Error: ' + err.message;
      }
    }

    function selectManga(id, provider) {
      document.getElementById('chapters-id').value = id;
      document.getElementById('chapters-provider').value = provider;
      runChapters();
    }

    async function runPopular() {
      const p = document.getElementById('popular-provider').value;
      const box = document.getElementById('popular-result');
      box.style.display = 'block';
      box.textContent = 'Loading popular...';
      try {
        const res = await apiFetch(\`/api/popular?provider=\${p}\`);
        showJson('popular-result', res);
      } catch (err) {
        box.textContent = 'Error: ' + err.message;
      }
    }

    async function runLatest() {
      const p = document.getElementById('latest-provider').value;
      const box = document.getElementById('latest-result');
      box.style.display = 'block';
      box.textContent = 'Loading latest...';
      try {
        const res = await apiFetch(\`/api/latest?provider=\${p}\`);
        showJson('latest-result', res);
      } catch (err) {
        box.textContent = 'Error: ' + err.message;
      }
    }

    async function runChapters() {
      const id = document.getElementById('chapters-id').value.trim();
      const p = document.getElementById('chapters-provider').value;
      if (!id) return alert('Please enter a manga ID');
      const box = document.getElementById('chapters-result');
      box.style.display = 'block';
      box.textContent = 'Loading chapters...';
      try {
        const res = await apiFetch(\`/api/chapters/\${encodeURIComponent(id)}?provider=\${p}\`);
        showJson('chapters-result', res);
        if (res.success && res.data && res.data.length > 0) {
          document.getElementById('pages-id').value = res.data[0].id;
          document.getElementById('pages-provider').value = p;
        }
      } catch (err) {
        box.textContent = 'Error: ' + err.message;
      }
    }

    async function runPages() {
      const id = document.getElementById('pages-id').value.trim();
      const p = document.getElementById('pages-provider').value;
      if (!id) return alert('Please enter a chapter ID');
      const box = document.getElementById('pages-result');
      box.style.display = 'block';
      box.textContent = 'Loading pages...';
      try {
        const res = await apiFetch(\`/api/pages/\${encodeURIComponent(id)}?provider=\${p}\`);
        showJson('pages-result', res);

        if (res.success && res.data && res.data.length > 0) {
          const reader = document.getElementById('reader-container');
          const readerPages = document.getElementById('reader-pages');
          reader.style.display = 'block';
          readerPages.innerHTML = res.data.map(page => \`
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Page \${page.page}</div>
              <img src="\${page.imageUrl}" style="max-width: 100%; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" loading="lazy" />
            </div>
          \`).join('');
          reader.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (err) {
        box.textContent = 'Error: ' + err.message;
      }
    }

    function closeReader() {
      document.getElementById('reader-container').style.display = 'none';
    }
  </script>
</body>
</html>
`;
  return c.html(html);
});
