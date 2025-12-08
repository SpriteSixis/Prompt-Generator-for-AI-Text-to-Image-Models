const { readFileSync, writeFileSync } = require('fs');

const id = process.env.GTAG_ID || '';

if (!id) {
  console.warn('GTAG_ID missing; leaving index.html unchanged.');
  process.exit(0);
}

const htmlPath = 'index.html';
const html = readFileSync(htmlPath, 'utf8');

// Check if GTAG_ID is already injected (to avoid duplicates)
if (html.includes('window.GTAG_ID')) {
  // Replace existing injection
  const injected = html.replace(
    /<script>window\.GTAG_ID = '[^']*';<\/script>/,
    `<script>window.GTAG_ID = '${id}';</script>`
  );
  writeFileSync(htmlPath, injected, 'utf8');
  console.log('Updated GTAG_ID in index.html');
} else {
  // Inject new
  const injected = html.replace(
    '<head>',
    `<head>\n  <script>window.GTAG_ID = '${id}';</script>`
  );
  writeFileSync(htmlPath, injected, 'utf8');
  console.log('Injected GTAG_ID into index.html');
}
