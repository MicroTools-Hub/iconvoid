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

console.log('=== VERIFYING EDGE CASES FOR LATEST THREE PAGES ===\n');

// 1. CSS Mask Guide checks
console.log('1. Checking CSS Mask Guide...');
const cssGuidePath = 'articles/how-to-use-svg-icons-in-css-mask-image-guide/index.html';
const cssGuide = fs.readFileSync(cssGuidePath, 'utf8');

assert(cssGuide.includes('mask-image:'), 'CSS Guide covers mask-image');
assert(cssGuide.includes('-webkit-mask-image:'), 'CSS Guide covers -webkit-mask-image prefix');
assert(cssGuide.includes('mask-size: contain;'), 'CSS Guide covers mask-size: contain');
assert(cssGuide.includes('currentColor'), 'CSS Guide covers currentColor inheritance');
assert(cssGuide.includes('data:image/svg+xml;utf8,'), 'CSS Guide explains UTF-8 SVG data URI format');
assert(cssGuide.includes('data:image/svg+xml;base64,'), 'CSS Guide compares Base64 data URI format');
assert(cssGuide.includes('@utility') || cssGuide.includes('@layer utilities'), 'CSS Guide provides Tailwind CSS utilities');
assert(cssGuide.includes('aria-hidden="true"'), 'CSS Guide includes accessibility attributes');
assert(cssGuide.includes('role="img"'), 'CSS Guide covers semantic role="img"');
assert(cssGuide.includes('/assets/articles/svg-icons-css-mask-image-guide.jpg'), 'CSS Guide references AI generated image');
assert(fs.existsSync('assets/articles/svg-icons-css-mask-image-guide.jpg'), 'CSS Guide image exists in assets/articles/');

// Check unescaped raw HTML inside code blocks
const unescapedRawTag = /<code>(?![^<]*&[lg]t;)[^<]*<[a-z][^<]*<\/code>/i;
// Just verify code blocks have properly escaped tags
assert(!cssGuide.includes('<code><svg'), 'CSS Guide has properly escaped &lt;svg&gt; inside code tags');

// 2. Angular Guide checks
console.log('\n2. Checking Angular Guide...');
const ngGuidePath = 'articles/how-to-use-svg-icons-in-angular-guide/index.html';
const ngGuide = fs.readFileSync(ngGuidePath, 'utf8');

assert(ngGuide.includes('input.required'), 'Angular Guide uses modern signal inputs (input.required)');
assert(ngGuide.includes('computed('), 'Angular Guide uses computed signals');
assert(ngGuide.includes('ChangeDetectionStrategy.OnPush'), 'Angular Guide uses OnPush change detection');
assert(ngGuide.includes('DomSanitizer'), 'Angular Guide covers DomSanitizer');
assert(ngGuide.includes('SecurityContext.HTML'), 'Angular Guide explains SecurityContext.HTML');
assert(ngGuide.includes('@defer'), 'Angular Guide demonstrates modern Angular @defer syntax');
assert(ngGuide.includes('provideIconRegistry') || ngGuide.includes('IconRegistryService'), 'Angular Guide provides injectable tree-shakable icon registry');
assert(ngGuide.includes('/assets/articles/angular-19-svg-icons-guide.jpg'), 'Angular Guide references AI generated image');
assert(fs.existsSync('assets/articles/angular-19-svg-icons-guide.jpg'), 'Angular Guide image exists in assets/articles/');
assert(!ngGuide.includes('<code><svg'), 'Angular Guide has properly escaped &lt;svg&gt; inside code tags');

// 3. SVG Gradients & Paint Servers Glossary checks
console.log('\n3. Checking SVG Gradients & Paint Servers Glossary...');
const glossPath = 'Glossary/svg-gradients-patterns-paint-servers-glossary/index.html';
const gloss = fs.readFileSync(glossPath, 'utf8');

// Count term cards
const termCards = gloss.match(/class="term-card"/g) || [];
assert(termCards.length >= 40, `Glossary has >= 40 defined terms (found ${termCards.length})`);

// Key terms check
const requiredTerms = [
  'linearGradient',
  'radialGradient',
  'pattern',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'stop-color',
  'stop-opacity',
  'patternUnits',
  'patternContentUnits',
  'patternTransform',
  'objectBoundingBox',
  'userSpaceOnUse',
  'pad',
  'reflect',
  'repeat',
  'display-p3'
];

for (const term of requiredTerms) {
  assert(gloss.toLowerCase().includes(term.toLowerCase()), `Glossary covers term: ${term}`);
}

assert(gloss.includes('id="termFilter"'), 'Glossary has search input element');
assert(gloss.includes('id="noResults"'), 'Glossary has no results alert box');
assert(gloss.includes('id="resetFilterBtn"'), 'Glossary has reset filter button');
assert(gloss.includes('/assets/articles/svg-gradients-patterns-paint-servers-glossary.jpg'), 'Glossary references AI generated image');
assert(fs.existsSync('assets/articles/svg-gradients-patterns-paint-servers-glossary.jpg'), 'Glossary image exists in assets/articles/');

// Check breadcrumbs alignment
const htmlBreadcrumbMatches = gloss.match(/<nav class="breadcrumb"[\s\S]*?<\/nav>/);
assert(htmlBreadcrumbMatches && htmlBreadcrumbMatches[0].includes('Glossary') && htmlBreadcrumbMatches[0].includes('SVG Gradients'), 'HTML breadcrumbs contain proper hierarchy');

// 4. Schema parentOrganization & author across all 3
console.log('\n4. Checking Author & Organization Schema across all 3 pages...');
for (const p of [cssGuidePath, ngGuidePath, glossPath]) {
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('"name": "Jouni Flemming"'), `${p} author name is Jouni Flemming`);
  assert(content.includes('"url": "https://iconstash.io/about/"'), `${p} author url is https://iconstash.io/about/`);
  assert(!content.includes('github.com/'), `${p} has zero GitHub links`);
  assert(content.includes('"name": "Great Software Company"'), `${p} parentOrganization name is Great Software Company`);
  assert(content.includes('"url": "https://greatsoftwarecompany.com"'), `${p} parentOrganization url is https://greatsoftwarecompany.com`);
}

// 5. Zero forbidden brands across all 3
console.log('\n5. Checking forbidden domains...');
const forbidden = ['jv16', 'winfindr', 'uninstalr'];
for (const p of [cssGuidePath, ngGuidePath, glossPath]) {
  const content = fs.readFileSync(p, 'utf8');
  for (const f of forbidden) {
    assert(!content.toLowerCase().includes(f), `${p} has zero mentions of ${f}`);
  }
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
