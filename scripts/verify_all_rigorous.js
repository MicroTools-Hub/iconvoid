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

console.log('=== RUNNING RIGOROUS ACCEPTANCE TESTS ===\n');

// 1. Check index.html h1 and footer links
console.log('1. Checking index.html...');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const h1Matches = indexHtml.match(/<h1[\s>]/gi) || [];
assert(h1Matches.length === 1, `index.html must have exactly 1 <h1> (found ${h1Matches.length})`);

const expectedLibs = fs.readdirSync('library').filter(f => fs.statSync('library/' + f).isDirectory());
assert(expectedLibs.length === 28, `There must be 28 libraries in library/ (found ${expectedLibs.length})`);

for (const lib of expectedLibs) {
  assert(indexHtml.includes(`/library/${lib}/`), `index.html footer links library: /library/${lib}/`);
}

// 2. Check robots.txt
console.log('\n2. Checking robots.txt...');
const robots = fs.readFileSync('robots.txt', 'utf8');
const allowDataIndex = robots.indexOf('Allow: /data/index.json');
const disallowData = robots.indexOf('Disallow: /data/');
assert(allowDataIndex !== -1, 'robots.txt contains "Allow: /data/index.json"');
assert(disallowData !== -1, 'robots.txt contains "Disallow: /data/"');
assert(allowDataIndex < disallowData, '"Allow: /data/index.json" is before "Disallow: /data/"');

// 3. Check utility pages
console.log('\n3. Checking utility pages...');
const utilityPages = ['privacy/index.html', 'terms/index.html', 'contact/index.html', 'stats/index.html'];
for (const u of utilityPages) {
  const content = fs.readFileSync(u, 'utf8');
  assert(content.includes('property="og:image" content="https://iconstash.io/og-default.png"'), `${u} has correct og:image`);
  assert(content.includes('name="twitter:image" content="https://iconstash.io/og-default.png"'), `${u} has correct twitter:image`);
  assert(!content.match(/property="og:image" content="[^"]*logo\.png"/), `${u} does not use logo.png for og:image`);
  assert(!content.match(/name="twitter:image" content="[^"]*logo\.png"/), `${u} does not use logo.png for twitter:image`);
}

// 4. Check trimmed articles
console.log('\n4. Checking trimmed articles...');
const trimmedArticles = [
  'articles/convert-svg-to-react-component-guide/index.html',
  'articles/how-to-optimize-svg-icons-for-web-performance/index.html',
  'articles/svg-icons-vs-icon-fonts-in-2026/index.html'
];
for (const a of trimmedArticles) {
  const content = fs.readFileSync(a, 'utf8');
  const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
  assert(descMatch && descMatch[1].length <= 155, `${a} meta description length (${descMatch ? descMatch[1].length : 0}) <= 155`);

  const jsonMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(!!jsonMatch, `${a} has JSON-LD script`);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1]);
    const article = data.find(d => d['@type'] === 'Article' || d['@type'] === 'TechArticle');
    assert(article && article.description.length <= 155, `${a} JSON-LD description length (${article ? article.description.length : 0}) <= 155`);
    assert(article && article.author && article.author.name === 'Jouni Flemming', `${a} author is Jouni Flemming`);
    assert(article && article.author && article.author.url === 'https://iconstash.io/about/', `${a} author URL is /about/`);
    assert(article && article.publisher && article.publisher.parentOrganization && article.publisher.parentOrganization.name === 'Great Software Company', `${a} parentOrganization is Great Software Company`);
  }
}

// 5. Check 3 new articles
console.log('\n5. Checking 3 new articles...');
const newArticles = [
  'articles/best-icon-search-engines-for-developers-2026/index.html',
  'articles/lucide-vs-tabler-vs-phosphor-icons-comparison/index.html',
  'articles/how-to-use-svg-icons-in-vue-and-nuxt-guide/index.html'
];
const forbidden = ['jv16', 'winfindr', 'uninstalr'];

for (const a of newArticles) {
  assert(fs.existsSync(a), `File exists: ${a}`);
  const content = fs.readFileSync(a, 'utf8');

  // Single h1
  const h1s = content.match(/<h1[\s>]/gi) || [];
  assert(h1s.length === 1, `${a} has exactly 1 <h1> (found ${h1s.length})`);

  // Meta description
  const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
  assert(descMatch && descMatch[1].length <= 155, `${a} meta description length (${descMatch ? descMatch[1].length : 0}) <= 155`);

  // Visible author byline
  assert(content.includes('Jouni Flemming') && content.includes('/about/'), `${a} has visible author byline linking to /about/`);

  // OG and Twitter image
  assert(content.includes('content="https://iconstash.io/og-default.png"'), `${a} points to og-default.png`);

  // Canonical tag
  assert(content.includes('<link rel="canonical" href="https://iconstash.io/'), `${a} has canonical tag`);

  // Code block present
  assert(content.includes('<pre><code') && content.includes('</code></pre>'), `${a} contains rich code examples`);

  // Forbidden brand domains
  for (const f of forbidden) {
    assert(!content.toLowerCase().includes(f), `${a} contains 0 mentions of forbidden domain ${f}`);
  }

  // JSON-LD validation
  const jsonMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(!!jsonMatch, `${a} has JSON-LD script`);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1]);
    const article = data.find(d => d['@type'] === 'TechArticle' || d['@type'] === 'Article');
    assert(!!article, `${a} has Article/TechArticle schema`);
    assert(article.author && article.author.name === 'Jouni Flemming' && article.author.url === 'https://iconstash.io/about/', `${a} schema author is Jouni Flemming`);
    assert(article.publisher && article.publisher.name === 'IconStash', `${a} schema publisher is IconStash`);
    assert(article.publisher && article.publisher.parentOrganization && article.publisher.parentOrganization.name === 'Great Software Company', `${a} schema parentOrganization is Great Software Company`);
    assert(article.publisher.parentOrganization.url === 'https://greatsoftwarecompany.com', `${a} parentOrganization URL is https://greatsoftwarecompany.com`);

    // Check no GitHub link in author schema
    assert(!JSON.stringify(article.author).includes('github.com'), `${a} author schema has no GitHub link`);

    // FAQ schema
    const faq = data.find(d => d['@type'] === 'FAQPage');
    assert(!!faq, `${a} has FAQPage schema`);
    if (faq) {
      assert(faq.mainEntity && faq.mainEntity.length >= 3, `${a} has >= 3 FAQ questions`);
      for (const q of faq.mainEntity) {
        assert(!!q.acceptedAnswer && !q.answer, `${a} FAQ "${q.name}" uses acceptedAnswer correctly`);
      }
    }

    // Breadcrumb schema
    const breadcrumb = data.find(d => d['@type'] === 'BreadcrumbList');
    assert(!!breadcrumb, `${a} has BreadcrumbList schema`);
    if (breadcrumb) {
      for (const item of breadcrumb.itemListElement) {
        assert(!!item.item, `${a} breadcrumb position ${item.position} has item URL: ${item.item}`);
      }
    }
  }
}

// 6. Site integration (articles/index.html & sitemaps)
console.log('\n6. Checking site integration...');
const articlesIndex = fs.readFileSync('articles/index.html', 'utf8');
const articlesSitemap = fs.readFileSync('articles-sitemap.xml', 'utf8');
const sitemapXml = fs.readFileSync('sitemap.xml', 'utf8');

const newSlugs = [
  'best-icon-search-engines-for-developers-2026',
  'lucide-vs-tabler-vs-phosphor-icons-comparison',
  'how-to-use-svg-icons-in-vue-and-nuxt-guide'
];

for (const slug of newSlugs) {
  assert(articlesIndex.includes(slug), `articles/index.html includes ${slug}`);
  assert(articlesSitemap.includes(slug), `articles-sitemap.xml includes ${slug}`);
}

assert(/<loc>https:\/\/iconstash\.io\/articles-sitemap\.xml<\/loc><lastmod>2026-09-0[4-9]<\/lastmod>/.test(sitemapXml), 'sitemap.xml has updated lastmod for articles-sitemap.xml');

// 7. Spot check icon pages
console.log('\n7. Spot checking 1,000 icon pages...');
const iconDirs = fs.readdirSync('icons').filter(d => fs.existsSync(path.join('icons', d, 'index.html')));
const sampleSize = 1000;
let iconSamplePassed = 0;
for (let i = 0; i < sampleSize; i++) {
  const randDir = iconDirs[Math.floor(Math.random() * iconDirs.length)];
  const c = fs.readFileSync(path.join('icons', randDir, 'index.html'), 'utf8');
  if (c.includes('content="https://iconstash.io/og-default.png"')) {
    iconSamplePassed++;
  }
}
assert(iconSamplePassed === sampleSize, `1000/1000 spot-checked icon pages use og-default.png (passed ${iconSamplePassed})`);

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
