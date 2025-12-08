const { readFileSync, writeFileSync } = require('fs');

const id = process.env.GTAG_ID || '';

if (!id) {
  console.warn('GTAG_ID missing; leaving index.html unchanged.');
  process.exit(0);
}

const htmlPath = 'index.html';
const html = readFileSync(htmlPath, 'utf8');

// Check if the injected script tag already exists (look for the specific pattern we inject)
// JSON.stringify produces double quotes, so we match both single and double quotes for robustness
// Match whitespace (including newlines) between elements using \s which includes \n
const injectedScriptPattern = /<script>\s*window\.GTAG_ID\s*=\s*["'][^"']*["']\s*;\s*<\/script>/;

if (injectedScriptPattern.test(html)) {
  // Replace existing injection - match both single and double quotes
  const injected = html.replace(
    injectedScriptPattern,
    `<script>window.GTAG_ID = ${JSON.stringify(id)};</script>`
  );
  
  if (injected === html) {
    console.error('ERROR: Failed to update existing GTAG_ID injection. Pattern may not match.');
    process.exit(1);
  }
  
  writeFileSync(htmlPath, injected, 'utf8');
  console.log('Updated GTAG_ID in index.html');
} else {
  // Verify <head> tag exists before attempting injection
  if (!html.includes('<head>')) {
    console.error('ERROR: Could not find <head> tag in index.html. Cannot inject GTAG_ID.');
    process.exit(1);
  }
  
  // Inject new
  const injected = html.replace(
    '<head>',
    `<head>\n  <script>window.GTAG_ID = ${JSON.stringify(id)};</script>`
  );
  
  if (injected === html) {
    console.error('ERROR: Failed to inject GTAG_ID. Replacement did not occur.');
    process.exit(1);
  }
  
  writeFileSync(htmlPath, injected, 'utf8');
  console.log('Injected GTAG_ID into index.html');
}
