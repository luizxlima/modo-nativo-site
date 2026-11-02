import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const contentDir = path.join(rootDir, "content", "blog");
const blogOutDir = path.join(rootDir, "blog");
const postsJsonPath = path.join(blogOutDir, "posts.json");
const sitemapPath = path.join(rootDir, "sitemap.xml");
const llmsPath = path.join(rootDir, "llms.txt");
const mapaPath = path.join(__dirname, "mapa-ilustracoes.json");

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("No frontmatter block found");
  }
  const yaml = match[1];
  const body = match[2];
  const data = {};
  for (const line of yaml.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\"/g, '"');
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    } else if (/^\d+$/.test(val)) {
      val = parseInt(val, 10);
    }
    data[key] = val;
  }
  return { data, body };
}

function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de leitura`;
}

function formatDatePtBr(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return `${day} de ${months[month - 1]} de ${year}`;
}

function transformCourseLinks(html, slug) {
  return html.replace(/href="(https?:\/\/mkt\.modonativo\.me\/curso[^"]*)"/g, (match, url) => {
    try {
      const u = new URL(url);
      u.searchParams.set("utm_source", "blog");
      u.searchParams.set("utm_medium", "artigo");
      u.searchParams.set("utm_campaign", slug);
      return `href="${u.toString()}"`;
    } catch {
      return `href="https://mkt.modonativo.me/curso?utm_source=blog&utm_medium=artigo&utm_campaign=${slug}"`;
    }
  });
}

function getHeaderHtml() {
  return `<header class="site-header">
  <a class="brand" href="/" aria-label="Modo Nativo início">
    <img src="/assets/logo-transparente.webp" alt="Modo Nativo" width="240" height="227">
  </a>
  <div class="nav-actions">
    <a class="btn-login" href="https://app.modonativo.me/">Entrar</a>
    <a class="btn-cta" href="/#oferta">Começar agora <span>↗</span></a>
  </div>
</header>`;
}

function getDarkCtaHtml() {
  return `<section class="dark-cta">
  <h2>Pronto para destravar o seu inglês?</h2>
  <p>Comece hoje com 15 minutos por dia usando a técnica de Shadowing.</p>
  <a class="cta-btn" href="/#oferta">QUERO COMEÇAR <span>↗</span></a>
</section>`;
}

function getFooterHtml() {
  return `<footer class="site-footer wrap">
  <img class="footer-logo" src="/assets/logo-transparente.webp" alt="Modo Nativo" width="240" height="227" loading="lazy">
  <p class="footer-copy">© 2026 Modo Nativo Educação Digital. Todos os direitos reservados.</p>
  <p class="footer-disclaimer">Os resultados dependem da dedicação e da prática de cada aluno. Este site não é afiliado ao Facebook.</p>
</footer>`;
}

function getGtmHead() {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M2Q6K5BN');</script>
<!-- End Google Tag Manager -->`;
}

function getGtmNoscript() {
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M2Q6K5BN"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}

function renderCardHtml(post) {
  const altText = post.alt || `Ilustração do artigo: ${post.title}`;
  return `<article class="card" data-category="${escapeHtml(post.category)}">
  <div class="card-cover-wrapper">
    <span class="card-badge">${escapeHtml(post.category)}</span>
    <img class="card-cover" src="${escapeHtml(post.cover)}" alt="${escapeHtml(altText)}" width="1600" height="900" loading="lazy" decoding="async">
  </div>
  <div class="card-body">
    <div class="card-meta">
      <span>${escapeHtml(formatDatePtBr(post.date))}</span>
      <span>•</span>
      <span>${escapeHtml(post.readingTime)}</span>
    </div>
    <h3 class="card-title">${escapeHtml(post.title)}</h3>
    <p class="card-desc">${escapeHtml(post.description)}</p>
  </div>
  <a class="card-link-overlay" href="/blog/${escapeHtml(post.slug)}" aria-label="${escapeHtml(post.title)}"></a>
</article>`;
}

async function build() {
  console.log("Iniciando build do blog...");

  if (!fs.existsSync(contentDir)) {
    console.error("Diretório content/blog não encontrado:", contentDir);
    process.exit(1);
  }

  if (!fs.existsSync(blogOutDir)) {
    fs.mkdirSync(blogOutDir, { recursive: true });
  }

  const mapaAltBySlug = new Map();
  if (fs.existsSync(mapaPath)) {
    try {
      const mapaList = JSON.parse(fs.readFileSync(mapaPath, "utf8"));
      for (const item of mapaList) {
        if (item.slug && item.alt) {
          mapaAltBySlug.set(item.slug, item.alt);
        }
      }
    } catch (err) {
      console.warn("Aviso: erro ao carregar mapa-ilustracoes.json:", err.message);
    }
  }

  // 1. Ler todos os arquivos .md (ignorando os que começam com _)
  const fileNames = fs.readdirSync(contentDir).filter(f => f.endsWith(".md") && !f.startsWith("_"));
  console.log(`Encontrados ${fileNames.length} artigos para processar.`);

  const posts = [];
  for (const fileName of fileNames) {
    const fullPath = path.join(contentDir, fileName);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, body } = parseFrontmatter(raw);

    const readingTime = calculateReadingTime(body);
    const alt = mapaAltBySlug.get(data.slug) || `Ilustração do artigo: ${data.title}`;
    posts.push({
      title: data.title,
      slug: data.slug,
      description: data.description || "",
      keyword: data.keyword || "",
      category: data.category || "Conversação",
      date: data.date || "2026-11-01",
      cover: data.cover || `/blog/img/${data.slug}.webp`,
      alt,
      author: data.author || "Equipe Modo Nativo",
      order: typeof data.order === "number" ? data.order : 999,
      readingTime,
      markdownBody: body
    });
  }

  // 2. Ordenar: data decrescente; desempate por order crescente
  posts.sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return a.order - b.order;
  });

  // 3. Categorias ordenadas conforme especificação da Etapa 2
  const preferredCategoryOrder = [
    "Conversação",
    "Inglês para Viagem",
    "Gramática",
    "Vocabulário",
    "Inglês para Carreira",
    "Pronúncia e Fluência"
  ];
  const presentCategories = new Set(posts.map(p => p.category));
  const activeCategories = preferredCategoryOrder.filter(c => presentCategories.has(c));
  // Adiciona qualquer outra categoria encontrada nos arquivos que não estava na lista padrão
  for (const c of presentCategories) {
    if (!activeCategories.includes(c)) {
      activeCategories.push(c);
    }
  }

  // 4. Gerar blog/posts.json
  const postsJsonData = posts.map(p => ({
    title: p.title,
    slug: p.slug,
    description: p.description,
    keyword: p.keyword,
    category: p.category,
    date: p.date,
    cover: p.cover,
    alt: p.alt,
    readingTime: p.readingTime,
    order: p.order
  }));
  fs.writeFileSync(postsJsonPath, JSON.stringify(postsJsonData, null, 2), "utf8");
  console.log(`Gerado posts.json com ${postsJsonData.length} itens.`);

  // 5. Gerar blog/index.html (Listagem)
  const initialCardsCount = 9;
  const initialCardsHtml = posts.slice(0, initialCardsCount).map(p => renderCardHtml(p)).join("\n");

  const filterPillsHtml = [
    `<button class="filter-pill active" data-category="Todos">Todos</button>`,
    ...activeCategories.map(cat => `<button class="filter-pill" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`)
  ].join("\n      ");

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": "https://modonativo.me/blog#blog",
        "name": "Blog Modo Nativo",
        "description": "Dicas de pronúncia, Shadowing e conversação para você destravar o inglês em 15 minutos por dia.",
        "url": "https://modonativo.me/blog",
        "publisher": {
          "@type": "Organization",
          "@id": "https://modonativo.me/#organization",
          "name": "Modo Nativo",
          "url": "https://modonativo.me/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://modonativo.me/assets/icons/icon-512.png"
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://modonativo.me/blog#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Início",
            "item": "https://modonativo.me/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": "https://modonativo.me/blog"
          }
        ]
      }
    ]
  };

  const listingHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${getGtmHead()}
  <title>Blog Modo Nativo · Inglês na prática, do jeito que se fala</title>
  <meta name="description" content="Dicas práticas de pronúncia, Shadowing e conversação para você destravar o inglês em 15 minutos por dia. Artigos e guias da equipe Modo Nativo.">
  <link rel="canonical" href="https://modonativo.me/blog">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="author" content="Modo Nativo">
  <meta name="theme-color" content="#f7f6f3">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Modo Nativo">
  <meta property="og:title" content="Blog Modo Nativo · Inglês na prática, do jeito que se fala">
  <meta property="og:description" content="Dicas práticas de pronúncia, Shadowing e conversação para você destravar o inglês em 15 minutos por dia.">
  <meta property="og:url" content="https://modonativo.me/blog">
  <meta property="og:image" content="https://modonativo.me/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Blog Modo Nativo · Inglês na prática, do jeito que se fala">
  <meta name="twitter:description" content="Dicas práticas de pronúncia, Shadowing e conversação para você destravar o inglês em 15 minutos por dia.">
  <meta name="twitter:image" content="https://modonativo.me/assets/og-image.jpg">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/icons/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/blog/blog.css">
  <script type="application/ld+json">
${JSON.stringify(listingJsonLd, null, 2)}
  </script>
</head>
<body>
  ${getGtmNoscript()}
  ${getHeaderHtml()}

  <main class="wrap">
    <section class="blog-hero">
      <span class="eyebrow">BLOG MODO NATIVO</span>
      <h1 class="blog-title">Inglês na prática,<br><span class="text-orange">do jeito que se fala.</span></h1>
      <p class="blog-subtitle">Dicas de pronúncia, Shadowing e conversação para você destravar o inglês em 15 minutos por dia.</p>
    </section>

    <section class="blog-controls" aria-label="Filtros e busca do blog">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input class="search-input" id="search-input" type="search" placeholder="Buscar por tema, palavra ou dúvida..." aria-label="Buscar artigos">
        <button class="search-clear" id="search-clear" type="button" aria-label="Limpar busca">✕</button>
      </div>

      <div class="filter-pills" role="tablist" aria-label="Categorias do blog">
        ${filterPillsHtml}
      </div>
    </section>

    <div class="posts-grid" id="posts-grid">
      ${initialCardsHtml}
      <div class="empty-state" id="empty-state">
        <p><strong>Nenhum artigo encontrado.</strong></p>
        <p>Tente outras palavras-chave ou selecione outra categoria.</p>
      </div>
    </div>

    <div class="load-more-wrap" id="load-more-wrap">
      <button class="btn-load-more" id="btn-load-more" type="button">Carregar mais artigos</button>
    </div>

    ${getDarkCtaHtml()}
  </main>

  ${getFooterHtml()}

  <script>
    const allPosts = ${JSON.stringify(postsJsonData)};
    let activeCategory = "Todos";
    let searchQuery = "";
    let visibleCount = 9;

    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear");
    const filterPills = document.querySelectorAll(".filter-pill");
    const grid = document.getElementById("posts-grid");
    const emptyState = document.getElementById("empty-state");
    const loadMoreWrap = document.getElementById("load-more-wrap");
    const btnLoadMore = document.getElementById("btn-load-more");

    function normalizeText(text) {
      return (text || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    }

    function formatDate(dateStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
      return day + " de " + months[month - 1] + " de " + year;
    }

    function createCardElement(post) {
      const article = document.createElement("article");
      article.className = "card";
      article.dataset.category = post.category;
      const altText = post.alt || ("Ilustração do artigo: " + post.title);
      article.innerHTML = '<div class="card-cover-wrapper">' +
        '<span class="card-badge">' + post.category + '</span>' +
        '<img class="card-cover" src="' + post.cover + '" alt="' + altText.replace(/"/g, '&quot;') + '" width="1600" height="900" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="card-meta"><span>' + formatDate(post.date) + '</span><span>•</span><span>' + post.readingTime + '</span></div>' +
        '<h3 class="card-title">' + post.title + '</h3>' +
        '<p class="card-desc">' + post.description + '</p>' +
        '</div>' +
        '<a class="card-link-overlay" href="/blog/' + post.slug + '" aria-label="' + post.title.replace(/"/g, '&quot;') + '"></a>';
      return article;
    }

    function getFilteredPosts() {
      const q = normalizeText(searchQuery.trim());
      return allPosts.filter(p => {
        const matchesCategory = (activeCategory === "Todos" || p.category === activeCategory);
        if (!matchesCategory) return false;
        if (!q) return true;
        const inTitle = normalizeText(p.title).includes(q);
        const inDesc = normalizeText(p.description).includes(q);
        const inKey = normalizeText(p.keyword).includes(q);
        return inTitle || inDesc || inKey;
      });
    }

    function render() {
      const filtered = getFilteredPosts();
      const currentCards = grid.querySelectorAll(".card");
      currentCards.forEach(c => c.remove());

      if (filtered.length === 0) {
        emptyState.style.display = "block";
        loadMoreWrap.style.display = "none";
        return;
      }

      emptyState.style.display = "none";
      const toShow = filtered.slice(0, visibleCount);
      toShow.forEach(p => {
        grid.appendChild(createCardElement(p));
      });

      if (visibleCount >= filtered.length) {
        loadMoreWrap.style.display = "none";
      } else {
        loadMoreWrap.style.display = "block";
      }
    }

    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        filterPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        activeCategory = pill.dataset.category;
        visibleCount = 9;
        render();
      });
    });

    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      searchClear.style.display = searchQuery ? "block" : "none";
      visibleCount = 9;
      render();
    });

    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      searchClear.style.display = "none";
      searchInput.focus();
      visibleCount = 9;
      render();
    });

    btnLoadMore.addEventListener("click", () => {
      visibleCount += 9;
      render();
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(blogOutDir, "index.html"), listingHtml, "utf8");
  console.log("blog/index.html gerado com sucesso.");

  // 6. Gerar cada página de artigo: blog/<slug>/index.html
  console.log("Gerando páginas individuais dos artigos...");
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const postDir = path.join(blogOutDir, post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    // Processar markdown com marked
    const rawHtml = marked.parse(post.markdownBody);
    // Aplicar UTM aos links do curso
    const contentHtml = transformCourseLinks(rawHtml, post.slug);

    // 3 outros artigos (mesma categoria; se faltar, pega os mais recentes)
    const sameCat = posts.filter(p => p.slug !== post.slug && p.category === post.category);
    const otherCat = posts.filter(p => p.slug !== post.slug && p.category !== post.category);
    const relatedPosts = [...sameCat, ...otherCat].slice(0, 3);
    const relatedCardsHtml = relatedPosts.map(p => renderCardHtml(p)).join("\n");

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": `https://modonativo.me/blog/${post.slug}#article`,
          "headline": post.title,
          "description": post.description,
          "image": {
            "@type": "ImageObject",
            "url": `https://modonativo.me${post.cover}`,
            "width": 1600,
            "height": 900
          },
          "datePublished": post.date,
          "dateModified": post.date,
          "keywords": post.keyword,
          "author": {
            "@type": "Organization",
            "@id": "https://modonativo.me/#organization",
            "name": "Modo Nativo"
          },
          "publisher": {
            "@type": "Organization",
            "@id": "https://modonativo.me/#organization",
            "name": "Modo Nativo",
            "url": "https://modonativo.me/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://modonativo.me/assets/icons/icon-512.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://modonativo.me/blog/${post.slug}`
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `https://modonativo.me/blog/${post.slug}#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Início",
              "item": "https://modonativo.me/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "https://modonativo.me/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": post.title,
              "item": `https://modonativo.me/blog/${post.slug}`
            }
          ]
        }
      ]
    };

    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " - https://modonativo.me/blog/" + post.slug)}`;

    const articleHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${getGtmHead()}
  <title>${escapeHtml(post.title)} | Blog Modo Nativo</title>
  <meta name="description" content="${escapeHtml(post.description)}">
  <meta name="keywords" content="${escapeHtml(post.keyword)}">
  <link rel="canonical" href="https://modonativo.me/blog/${escapeHtml(post.slug)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="author" content="${escapeHtml(post.author)}">
  <meta name="theme-color" content="#f7f6f3">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Modo Nativo">
  <meta property="og:title" content="${escapeHtml(post.title)} | Blog Modo Nativo">
  <meta property="og:description" content="${escapeHtml(post.description)}">
  <meta property="og:url" content="https://modonativo.me/blog/${escapeHtml(post.slug)}">
  <meta property="og:image" content="https://modonativo.me${escapeHtml(post.cover)}">
  <meta property="og:image:width" content="1600">
  <meta property="og:image:height" content="900">
  <meta property="article:published_time" content="${escapeHtml(post.date)}">
  <meta property="article:modified_time" content="${escapeHtml(post.date)}">
  <meta property="article:section" content="${escapeHtml(post.category)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)} | Blog Modo Nativo">
  <meta name="twitter:description" content="${escapeHtml(post.description)}">
  <meta name="twitter:image" content="https://modonativo.me${escapeHtml(post.cover)}">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/icons/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/blog/blog.css">
  <script type="application/ld+json">
${JSON.stringify(articleJsonLd, null, 2)}
  </script>
</head>
<body>
  ${getGtmNoscript()}
  ${getHeaderHtml()}

  <article class="article-wrap">
    <a class="article-back" href="/blog">← Todos os artigos</a>
    <header class="article-header">
      <span class="article-badge">${escapeHtml(post.category)}</span>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="article-meta">
        <span class="article-meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${escapeHtml(formatDatePtBr(post.date))}
        </span>
        <span class="article-meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${escapeHtml(post.readingTime)}
        </span>
        <span class="article-meta-item">Por ${escapeHtml(post.author)}</span>
      </div>
    </header>

    <div class="article-cover-wrap">
      <img class="article-cover" src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.alt || `Ilustração do artigo: ${post.title}`)}" width="1600" height="900" loading="eager" fetchpriority="high">
    </div>

    <div class="article-content">
      ${contentHtml}
    </div>

    <section class="share-bar" aria-label="Compartilhar este artigo">
      <span class="share-title">Gostou deste artigo? Compartilhe:</span>
      <div class="share-buttons">
        <a class="btn-share btn-share-wa" href="${whatsappShareUrl}" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15s-.777.978-.952 1.18c-.176.2-.351.226-.652.075s-1.272-.469-2.424-1.496c-.896-.799-1.501-1.787-1.677-2.088-.175-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.175.201-.3.301-.501.101-.2.05-.376-.025-.526s-.676-1.63-.927-2.232c-.244-.587-.492-.507-.676-.516l-.576-.01c-.2 0-.526.075-.802.376s-1.052 1.028-1.052 2.508 1.077 2.909 1.228 3.11c.15.2 2.119 3.236 5.134 4.539.717.31 1.277.495 1.714.634.72.229 1.376.196 1.895.12.577-.087 1.78-.727 2.03-1.43.251-.702.251-1.304.176-1.43-.075-.126-.276-.201-.577-.351zm-5.467 7.618c-1.802 0-3.57-.486-5.116-1.408l-.367-.218-3.805.998 1.016-3.71-.239-.38a10.026 10.026 0 0 1-1.536-5.304c0-5.54 4.507-10.047 10.047-10.047 2.684 0 5.207 1.045 7.106 2.944 1.899 1.899 2.944 4.422 2.944 7.106 0 5.54-4.507 10.047-10.047 10.047zm8.526-18.573A12.01 12.01 0 0 0 12.005 0C5.386 0 0 5.386 0 12.005c0 2.112.552 4.175 1.601 5.993L0 24l6.166-1.57a11.966 11.966 0 0 0 5.839 1.575h.005c6.618 0 12.005-5.386 12.005-12.005 0-3.208-1.25-6.223-3.48-8.453z"/></svg>
          WhatsApp
        </a>
        <button class="btn-share btn-share-copy" id="btn-copy" type="button" onclick="navigator.clipboard.writeText(window.location.href);document.getElementById('copy-feedback').style.display='inline';setTimeout(()=>{document.getElementById('copy-feedback').style.display='none'},2500)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copiar link
        </button>
        <span class="copy-feedback" id="copy-feedback">Link copiado!</span>
      </div>
    </section>

    ${getDarkCtaHtml()}
  </article>

  <aside class="related-section">
    <h2 class="related-title">Outros artigos</h2>
    <div class="posts-grid">
      ${relatedCardsHtml}
    </div>
  </aside>

  ${getFooterHtml()}
</body>
</html>`;

    fs.writeFileSync(path.join(postDir, "index.html"), articleHtml, "utf8");
  }
  console.log(`Páginas de ${posts.length} artigos geradas com sucesso.`);

  // 7. Atualizar sitemap.xml preservando URLs existentes
  console.log("Atualizando sitemap.xml...");
  let sitemapContent = fs.readFileSync(sitemapPath, "utf8");

  // Verificar se o sitemap tem a URL raiz
  const hasBaseUrl = sitemapContent.includes("<loc>https://modonativo.me/</loc>");

  let sitemapUrls = [];
  if (hasBaseUrl) {
    sitemapUrls.push(`  <url>
    <loc>https://modonativo.me/</loc>
    <lastmod>2026-10-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://modonativo.me/assets/og-image.jpg</image:loc>
      <image:title>Modo Nativo - Curso de Inglês com Shadowing</image:title>
    </image:image>
    <image:image>
      <image:loc>https://modonativo.me/assets/produto-mockup.webp</image:loc>
      <image:title>Curso Modo Nativo em diferentes dispositivos</image:title>
    </image:image>
  </url>`);
  }

  // URL da listagem do blog
  const latestDate = posts.length > 0 ? posts[0].date : "2026-11-01";
  sitemapUrls.push(`  <url>
    <loc>https://modonativo.me/blog</loc>
    <lastmod>${latestDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

  // URLs de cada artigo
  for (const post of posts) {
    sitemapUrls.push(`  <url>
    <loc>https://modonativo.me/blog/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>https://modonativo.me${post.cover}</image:loc>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>
  </url>`);
  }

  const newSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls.join("\n")}
</urlset>
`;
  fs.writeFileSync(sitemapPath, newSitemap, "utf8");
  console.log(`sitemap.xml atualizado com ${sitemapUrls.length} URLs.`);

  // 8. Atualizar llms.txt com link do blog e seção ## Blog
  console.log("Atualizando llms.txt...");
  let llmsContent = fs.readFileSync(llmsPath, "utf8");

  // Adicionar link do blog na seção ## Links se ainda não existir
  if (!llmsContent.includes("https://modonativo.me/blog")) {
    llmsContent = llmsContent.replace(
      "- Site oficial: https://modonativo.me/",
      "- Site oficial: https://modonativo.me/\n- Blog oficial: https://modonativo.me/blog"
    );
  }

  // Remover seção ## Blog anterior se existir
  const blogSectionIndex = llmsContent.indexOf("## Blog");
  if (blogSectionIndex !== -1) {
    llmsContent = llmsContent.slice(0, blogSectionIndex).trimEnd();
  }

  // Criar seção ## Blog com a lista de todos os artigos
  const blogListItems = posts.map(p => `- [${p.title}](https://modonativo.me/blog/${p.slug}): ${p.description}`).join("\n");
  const newLlms = `${llmsContent.trimEnd()}

## Blog

${blogListItems}
`;

  fs.writeFileSync(llmsPath, newLlms, "utf8");
  console.log(`llms.txt atualizado com ${posts.length} artigos listados na seção ## Blog.`);

  console.log("Build concluído com sucesso!");
}

build().catch(err => {
  console.error("Erro durante o build do blog:", err);
  process.exit(1);
});
