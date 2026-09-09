const fs = require('fs');
const path = require('path');

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('=== VERIFYING 3 NEW ARTICLES & SITE INTEGRATION ===\n');

const articles = [
  {
    slug: 'how-to-use-svg-icons-in-svelte-and-sveltekit-guide',
    path: 'articles/how-to-use-svg-icons-in-svelte-and-sveltekit-guide/index.html'
  },
  {
    slug: 'figma-to-code-svg-icon-pipeline-guide',
    path: 'articles/figma-to-code-svg-icon-pipeline-guide/index.html'
  },
  {
    slug: 'best-tailwind-icon-libraries-2026',
    path: 'articles/best-tailwind-icon-libraries-2026/index.html'
  }
];

const forbidden = ['jv16', 'winfindr', 'uninstalr'];

for (const a of articles) {
  console.log(`\nChecking article: ${a.slug}...`);
  assert(fs.existsSync(a.path), `File exists: ${a.path}`);
  const content = fs.readFileSync(a.path, 'utf8');

  // 1. Single H1
  const h1Matches = content.match(/<h1[\s>]/gi) || [];
  assert(h1Matches.length === 1, `Exactly one <h1> (found ${h1Matches.length})`);

  // 2. Meta description <= 155 chars
  const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
  assert(descMatch && descMatch[1].length <= 155, `Meta description length (${descMatch ? descMatch[1].length : 0}) <= 155`);

  // 3. Canonical tag
  const canonicalExpected = `https://iconstash.io/articles/${a.slug}/`;
  assert(content.includes(`<link rel="canonical" href="${canonicalExpected}">`), `Canonical tag matches ${canonicalExpected}`);

  // 4. Visible author byline
  assert(content.includes('By <a href="/about/" rel="author">Jouni Flemming</a>'), `Visible author byline is present linking to /about/`);

  // 5. Open Graph & Twitter image
  assert(content.includes('property="og:image" content="https://iconstash.io/og-default.png"'), `OG image is og-default.png`);
  assert(content.includes('name="twitter:image" content="https://iconstash.io/og-default.png"'), `Twitter image is og-default.png`);
  assert(content.includes('property="og:image:width" content="1200"'), `OG width is 1200`);
  assert(content.includes('property="og:image:height" content="630"'), `OG height is 630`);

  // 6. Forbidden words
  for (const f of forbidden) {
    assert(!content.toLowerCase().includes(f), `Contains zero mentions of forbidden word "${f}"`);
  }

  // 7. Rich content elements
  assert(content.includes('<pre><code') && content.includes('</code></pre>'), `Contains code blocks`);
  assert(content.includes('<table') && content.includes('</table>'), `Contains comparison table`);
  assert(content.includes('.table-wrap') || content.includes('overflow-x: auto'), `Table has responsive overflow container`);

  // 8. JSON-LD validation
  let data;
  const jsonMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(!!jsonMatch, `Has JSON-LD structured data`);
  if (jsonMatch) {
    try {
      data = JSON.parse(jsonMatch[1]);
      assert(true, `JSON-LD parses cleanly as valid JSON`);
    } catch (e) {
      assert(false, `JSON-LD parsing error: ${e.message}`);
    }

    if (data) {
      const articleSchema = data.find(d => d['@type'] === 'TechArticle' || d['@type'] === 'Article');
      assert(!!articleSchema, `TechArticle / Article schema present`);
      if (articleSchema) {
        assert(articleSchema.description && articleSchema.description.length <= 155, `Schema description (${articleSchema.description.length}) <= 155 chars`);
        assert(articleSchema.author && articleSchema.author.name === 'Jouni Flemming', `Schema author is Jouni Flemming`);
        assert(articleSchema.author && articleSchema.author.url === 'https://iconstash.io/about/', `Schema author URL is https://iconstash.io/about/`);
        assert(!JSON.stringify(articleSchema.author).includes('github.com'), `Schema author does not contain github.com`);
        assert(articleSchema.publisher && articleSchema.publisher.name === 'IconStash', `Schema publisher is IconStash`);
        assert(articleSchema.publisher && articleSchema.publisher.parentOrganization && articleSchema.publisher.parentOrganization.name === 'Great Software Company', `Schema parentOrganization is Great Software Company`);
        assert(articleSchema.publisher.parentOrganization.url === 'https://greatsoftwarecompany.com', `Schema parentOrganization URL is https://greatsoftwarecompany.com`);
        assert(articleSchema.mainEntityOfPage === canonicalExpected, `mainEntityOfPage matches canonical URL`);
      }

      const faqSchema = data.find(d => d['@type'] === 'FAQPage');
      assert(!!faqSchema, `FAQPage schema present`);
      if (faqSchema) {
        assert(faqSchema.mainEntity && faqSchema.mainEntity.length >= 3, `FAQ has >= 3 questions (found ${faqSchema.mainEntity ? faqSchema.mainEntity.length : 0})`);
        for (const q of faqSchema.mainEntity) {
          assert(!!q.acceptedAnswer && !q.answer, `FAQ question "${q.name.substring(0, 30)}..." uses acceptedAnswer`);
        }
      }

      const breadcrumbSchema = data.find(d => d['@type'] === 'BreadcrumbList');
      assert(!!breadcrumbSchema, `BreadcrumbList schema present`);
      if (breadcrumbSchema) {
        assert(breadcrumbSchema.itemListElement && breadcrumbSchema.itemListElement.length === 3, `Breadcrumbs have 3 levels`);
        for (const item of breadcrumbSchema.itemListElement) {
          assert(!!item.item, `Breadcrumb position ${item.position} has full item URL: ${item.item}`);
        }
      }
    }
  }

  // 9. Responsive layout & theme support
  assert(content.includes('viewport') && content.includes('width=device-width'), `Includes mobile viewport tag`);
  assert(content.includes('@media (max-width: 768px)'), `Includes mobile media queries`);
  assert(content.includes('html[data-theme="light"]'), `Includes light theme CSS`);
  assert(content.includes('themeToggle'), `Includes theme toggle logic`);
  assert(content.includes('margin-top: 0') && content.includes('.site-footer'), `Footer has margin-top: 0 to eliminate empty space gap`);
  assert(content.includes('.header-cta') && content.includes('display: inline-block;'), `Header CTA has display: inline-block`);
  assert(content.includes('min-width: 600px'), `Table has min-width: 600px to prevent narrow column squeezing`);
  assert(content.includes('nav a:not(.header-cta)'), `Mobile header nav preserves Open App CTA button`);

  // Listicle-specific checks
  if (a.slug === 'best-tailwind-icon-libraries-2026') {
    assert(content.includes('.lib-card h3 { margin-top: 0; }'), `Listicle lib-card h3 has margin-top: 0 eliminating 58px dead space`);
    const itemList = data && data.find(d => d['@type'] === 'ItemList');
    assert(!!itemList, `ItemList schema present in listicle`);
    if (itemList) {
      assert(itemList.numberOfItems === 10, `ItemList has 10 items`);
      assert(itemList.itemListElement && itemList.itemListElement.length === 10, `ItemList contains exactly 10 list item elements`);
    }
    for (let rank = 1; rank <= 10; rank++) {
      const idMatch = content.match(new RegExp(`id="${rank}-[a-z-]+"`));
      assert(!!idMatch, `Listicle has heading anchor id for library #${rank}`);
    }
  }

  // 10. Check all internal links resolve to real files or directories
  const linkRegex = /href="(\/[^"#?]*)"/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawPath = match[1];
    if (rawPath === '/' || rawPath === '') continue;
    const relPath = rawPath.replace(/^\//, '');
    const directExists = fs.existsSync(relPath);
    const indexExists = fs.existsSync(path.join(relPath, 'index.html'));
    assert(directExists || indexExists, `Internal link "${rawPath}" exists on disk`);
  }
}

// 10. Site integration checks
console.log('\nChecking site integration...');
const articlesIndex = fs.readFileSync('articles/index.html', 'utf8');
const articlesSitemap = fs.readFileSync('articles-sitemap.xml', 'utf8');
const sitemapXml = fs.readFileSync('sitemap.xml', 'utf8');

for (const a of articles) {
  assert(articlesIndex.includes(`/articles/${a.slug}/`), `articles/index.html links to ${a.slug}`);
  assert(articlesSitemap.includes(`https://iconstash.io/articles/${a.slug}/`), `articles-sitemap.xml includes ${a.slug}`);
}

assert(/<loc>https:\/\/iconstash\.io\/articles-sitemap\.xml<\/loc><lastmod>2026-09-0[5-9]<\/lastmod>/.test(sitemapXml), 'sitemap.xml has updated lastmod for articles-sitemap.xml');

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
