import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('Usage: node scripts/prepare-pages-math.mjs <dir> [dir ...]');
  process.exit(2);
}

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdown(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function isEscaped(text, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) count += 1;
  return count % 2 === 1;
}

function normalizeOutsideInlineCode(line, counts) {
  let output = '';
  let inlineFenceLength = 0;

  for (let i = 0; i < line.length;) {
    if (line[i] === '`') {
      let j = i + 1;
      while (j < line.length && line[j] === '`') j += 1;
      const runLength = j - i;

      if (inlineFenceLength === 0) {
        inlineFenceLength = runLength;
      } else if (runLength === inlineFenceLength) {
        inlineFenceLength = 0;
      }

      output += line.slice(i, j);
      i = j;
      continue;
    }

    if (
      inlineFenceLength === 0 &&
      line[i] === '\\' &&
      !isEscaped(line, i) &&
      i + 1 < line.length
    ) {
      const next = line[i + 1];
      if (next === '(') {
        output += '$';
        counts.inlineOpen += 1;
        i += 2;
        continue;
      }
      if (next === ')') {
        output += '$';
        counts.inlineClose += 1;
        i += 2;
        continue;
      }
      if (next === '[') {
        output += '$$';
        counts.displayOpen += 1;
        i += 2;
        continue;
      }
      if (next === ']') {
        output += '$$';
        counts.displayClose += 1;
        i += 2;
        continue;
      }
    }

    output += line[i];
    i += 1;
  }

  return output;
}

function normalizeMarkdown(text, file) {
  const lines = text.split('\n');
  const counts = {
    inlineOpen: 0,
    inlineClose: 0,
    displayOpen: 0,
    displayClose: 0
  };
  let fence = null;

  const normalized = lines.map((line) => {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);

    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.char &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      return line;
    }

    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], length: fenceMatch[1].length };
      return line;
    }

    return normalizeOutsideInlineCode(line, counts);
  }).join('\n');

  if (counts.inlineOpen !== counts.inlineClose) {
    throw new Error(
      `${file}: mismatched \\( / \\) delimiters (${counts.inlineOpen} open, ${counts.inlineClose} close)`
    );
  }
  if (counts.displayOpen !== counts.displayClose) {
    throw new Error(
      `${file}: mismatched \\[ / \\] delimiters (${counts.displayOpen} open, ${counts.displayClose} close)`
    );
  }

  return { normalized, counts };
}

const files = roots.flatMap(walkMarkdown).sort();
let inlinePairs = 0;
let displayPairs = 0;
let changedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { normalized, counts } = normalizeMarkdown(original, file);

  inlinePairs += counts.inlineOpen;
  displayPairs += counts.displayOpen;

  if (normalized !== original) {
    fs.writeFileSync(file, normalized, 'utf8');
    changedFiles += 1;
  }
}

console.log(
  `Pages math normalization complete: ${inlinePairs} inline pair(s), ${displayPairs} display pair(s), ${changedFiles}/${files.length} Markdown file(s) changed.`
);
