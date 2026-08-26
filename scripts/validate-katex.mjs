import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';

const roots = ['ans', 'probrems'];

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

function spacesLike(text) {
  return text.replace(/[^\n]/g, ' ');
}

function stripCode(text) {
  const lines = text.split('\n');
  let fence = null;

  return lines.map((line) => {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);

    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.char &&
        fenceMatch[1].length >= fence.length
      ) {
        fence = null;
      }
      return spacesLike(line);
    }

    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], length: fenceMatch[1].length };
      return spacesLike(line);
    }

    // Inline code spans should not be interpreted as math.
    return line.replace(/(`+)(.*?)\1/g, (match) => spacesLike(match));
  }).join('\n');
}

function isEscaped(text, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) count += 1;
  return count % 2 === 1;
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

function findClosingDollar(text, start, displayMode) {
  const token = displayMode ? '$$' : '$';

  for (let i = start; i < text.length; i += 1) {
    if (!displayMode && text[i] === '\n') return -1;

    if (text.startsWith(token, i) && !isEscaped(text, i)) {
      if (!displayMode && text.startsWith('$$', i)) {
        i += 1;
        continue;
      }
      return i;
    }
  }

  return -1;
}

function findClosingBackslashDelimiter(text, start, close) {
  let index = text.indexOf(close, start);
  while (index !== -1) {
    if (!isEscaped(text, index)) return index;
    index = text.indexOf(close, index + close.length);
  }
  return -1;
}

function extractMath(text, file) {
  const expressions = [];
  const errors = [];

  for (let i = 0; i < text.length;) {
    if (text.startsWith('$$', i) && !isEscaped(text, i)) {
      const close = findClosingDollar(text, i + 2, true);
      if (close === -1) {
        errors.push(`${file}:${lineNumberAt(text, i)}: closing $$ not found`);
        break;
      }
      expressions.push({
        expression: text.slice(i + 2, close),
        displayMode: true,
        line: lineNumberAt(text, i)
      });
      i = close + 2;
      continue;
    }

    if (text.startsWith('\\[', i) && !isEscaped(text, i)) {
      const close = findClosingBackslashDelimiter(text, i + 2, '\\]');
      if (close === -1) {
        errors.push(`${file}:${lineNumberAt(text, i)}: closing \\] not found`);
        break;
      }
      expressions.push({
        expression: text.slice(i + 2, close),
        displayMode: true,
        line: lineNumberAt(text, i)
      });
      i = close + 2;
      continue;
    }

    if (text.startsWith('\\(', i) && !isEscaped(text, i)) {
      const close = findClosingBackslashDelimiter(text, i + 2, '\\)');
      if (close === -1) {
        errors.push(`${file}:${lineNumberAt(text, i)}: closing \\) not found`);
        break;
      }
      expressions.push({
        expression: text.slice(i + 2, close),
        displayMode: false,
        line: lineNumberAt(text, i)
      });
      i = close + 2;
      continue;
    }

    if (text[i] === '$' && !isEscaped(text, i)) {
      const close = findClosingDollar(text, i + 1, false);
      if (close === -1) {
        errors.push(`${file}:${lineNumberAt(text, i)}: closing $ not found on the same line`);
        i += 1;
        continue;
      }
      expressions.push({
        expression: text.slice(i + 1, close),
        displayMode: false,
        line: lineNumberAt(text, i)
      });
      i = close + 1;
      continue;
    }

    i += 1;
  }

  return { expressions, errors };
}

function findRawMathOutsideDelimiters(text, file) {
  const errors = [];

  for (let i = 0; i < text.length;) {
    if (text.startsWith('$$', i) && !isEscaped(text, i)) {
      const close = findClosingDollar(text, i + 2, true);
      if (close === -1) break;
      i = close + 2;
      continue;
    }

    if (text.startsWith('\\[', i) && !isEscaped(text, i)) {
      const close = findClosingBackslashDelimiter(text, i + 2, '\\]');
      if (close === -1) break;
      i = close + 2;
      continue;
    }

    if (text.startsWith('\\(', i) && !isEscaped(text, i)) {
      const close = findClosingBackslashDelimiter(text, i + 2, '\\)');
      if (close === -1) break;
      i = close + 2;
      continue;
    }

    if (text[i] === '$' && !isEscaped(text, i)) {
      const close = findClosingDollar(text, i + 1, false);
      if (close === -1) {
        i += 1;
        continue;
      }
      i = close + 1;
      continue;
    }

    if (text[i] === '\\' && !isEscaped(text, i) && /[A-Za-z]/.test(text[i + 1] ?? '')) {
      const match = text.slice(i).match(/^\\[A-Za-z]+/);
      const command = match ? match[0] : '\\';
      errors.push(
        `${file}:${lineNumberAt(text, i)}: raw TeX command ${command} is outside math delimiters`
      );
      i += command.length;
      continue;
    }

    if ((text[i] === '^' || text[i] === '_') && !isEscaped(text, i)) {
      errors.push(
        `${file}:${lineNumberAt(text, i)}: ${text[i]} appears outside math delimiters`
      );
    }

    i += 1;
  }

  return errors;
}

const files = roots.flatMap(walkMarkdown).sort();
const failures = [];
let expressionCount = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const text = stripCode(original);
  const { expressions, errors } = extractMath(text, file);

  failures.push(...errors);
  failures.push(...findRawMathOutsideDelimiters(text, file));
  expressionCount += expressions.length;

  for (const { expression, displayMode, line } of expressions) {
    if (!expression.trim()) {
      failures.push(`${file}:${line}: empty math expression`);
      continue;
    }

    try {
      katex.renderToString(expression, {
        displayMode,
        throwOnError: true,
        strict: 'warn',
        trust: false
      });
    } catch (error) {
      failures.push(`${file}:${line}: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`KaTeX validation failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`KaTeX validation passed: ${expressionCount} expression(s) in ${files.length} Markdown file(s).`);
