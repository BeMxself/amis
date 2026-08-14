#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const {buildSdkThemeCssFromSource} = require('./build-sdk-theme-css-source');

const repoRoot = path.resolve(__dirname, '../..');
const sdkDir = path.join(repoRoot, 'packages/amis/sdk');
const maxDiffs = 20;

if (!fs.existsSync(sdkDir)) {
  throw new Error(
    'Missing packages/amis/sdk. Run `npm run build --workspace amis` first.'
  );
}

const generatedThemeCss = buildSdkThemeCssFromSource({repoRoot});
const totals = {
  declarations: 0,
  exactValues: 0,
  colorRepresentations: 0,
  calcRepresentations: 0
};
const diffs = [];

generatedThemeCss.forEach(themeCss => {
  const formalCssFile = path.join(sdkDir, themeCss.filename);

  if (!fs.existsSync(formalCssFile)) {
    diffs.push(`${themeCss.filename}: missing formal SDK CSS file`);
    return;
  }

  const result = compareCssDeclarations(
    themeCss.content,
    fs.readFileSync(formalCssFile, 'utf8')
  );

  mergeTotals(totals, result.stats);

  result.diffs.forEach(diff => {
    if (diffs.length < maxDiffs) {
      diffs.push(`${themeCss.filename}: ${diff}`);
    }
  });
});

if (diffs.length) {
  throw new Error(
    'SDK theme CSS source parity has unclassified differences:\n' +
      diffs.map(diff => `- ${diff}`).join('\n')
  );
}

console.log(
  [
    `SDK theme CSS source parity OK: ${generatedThemeCss.length} themes checked.`,
    `${totals.declarations} declarations compared.`,
    `${totals.colorRepresentations} color representation differences classified.`,
    `${totals.calcRepresentations} calc arithmetic representation differences classified.`
  ].join(' ')
);

function compareCssDeclarations(generatedCss, formalCss) {
  const generatedDeclarations = collectDeclarations(generatedCss);
  const formalDeclarations = collectDeclarations(formalCss);
  const keys = new Set([
    ...generatedDeclarations.keys(),
    ...formalDeclarations.keys()
  ]);
  const stats = {
    declarations: 0,
    exactValues: 0,
    colorRepresentations: 0,
    calcRepresentations: 0
  };
  const cssDiffs = [];

  Array.from(keys)
    .sort()
    .forEach(key => {
      if (cssDiffs.length >= maxDiffs) {
        return;
      }

      const generatedValues = generatedDeclarations.get(key) || [];
      const formalValues = formalDeclarations.get(key) || [];

      if (generatedValues.length !== formalValues.length) {
        cssDiffs.push(
          `${formatDeclarationKey(key)} count ${generatedValues.length} != ${formalValues.length}`
        );
        return;
      }

      generatedValues.forEach((generatedValue, index) => {
        if (cssDiffs.length >= maxDiffs) {
          return;
        }

        stats.declarations++;

        const valueClass = classifyValueDifference(
          generatedValue,
          formalValues[index]
        );

        if (!valueClass) {
          cssDiffs.push(
            `${formatDeclarationKey(key)} ${generatedValue} != ${formalValues[index]}`
          );
          return;
        }

        stats[valueClass]++;
      });
    });

  return {diffs: cssDiffs, stats};
}

function collectDeclarations(css) {
  const declarations = new Map();
  const root = postcss.parse(css);

  root.nodes
    .filter(node => node.type !== 'comment')
    .forEach(node => collectNodeDeclarations(node, [], '', declarations));

  return declarations;
}

function collectNodeDeclarations(node, atRules, selector, declarations) {
  if (node.type === 'atrule') {
    const nextAtRules = atRules.concat(formatAtRule(node));
    (node.nodes || []).forEach(child =>
      collectNodeDeclarations(child, nextAtRules, selector, declarations)
    );
    return;
  }

  if (node.type === 'rule') {
    const nextSelector = normalizeSelector(node.selector);
    (node.nodes || []).forEach(child =>
      collectNodeDeclarations(child, atRules, nextSelector, declarations)
    );
    return;
  }

  if (node.type !== 'decl') {
    return;
  }

  const key = createDeclarationKey(atRules, selector, node.prop);

  if (!declarations.has(key)) {
    declarations.set(key, []);
  }

  declarations.get(key).push(node.value);
}

function classifyValueDifference(generatedValue, formalValue) {
  const generated = normalizeCssValue(generatedValue);
  const formal = normalizeCssValue(formalValue);

  if (generated === formal) {
    return 'exactValues';
  }

  if (hasEquivalentColors(generatedValue, formalValue)) {
    return 'colorRepresentations';
  }

  if (/calc\(/i.test(generatedValue) || /calc\(/i.test(formalValue)) {
    return 'calcRepresentations';
  }

  return '';
}

function normalizeCssValue(value) {
  return normalizeColors(decodeCssEscapes(value))
    .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, body) => `"${body}"`)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeColors(value) {
  return value
    .replace(
      /hsla\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.\-]+)%\s*,\s*([0-9.]+)\s*\)/gi,
      (_, hue, saturation, lightness, alpha) =>
        hslToHex(hue, saturation, lightness) + toAlphaByte(alpha)
    )
    .replace(
      /rgba\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9.]+)\s*\)/gi,
      (_, red, green, blue, alpha) =>
        `#${toByte(red)}${toByte(green)}${toByte(blue)}${toAlphaByte(alpha)}`
    )
    .replace(
      /rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/gi,
      (_, red, green, blue) =>
        `#${toByte(red)}${toByte(green)}${toByte(blue)}`
    )
    .replace(
      /rgb\(\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*\)/gi,
      (_, red, green, blue) =>
        `#${toPercentByte(red)}${toPercentByte(green)}${toPercentByte(blue)}`
    )
    .replace(
      /hsl\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.\-]+)%\s*\)/gi,
      (_, hue, saturation, lightness) =>
        hslToHex(hue, saturation, lightness)
    )
    .replace(/\bblack\b/gi, '#000000')
    .replace(/\bwhite\b/gi, '#ffffff')
    .replace(/\bgr[ae]y\b/gi, '#808080')
    .replace(/\btransparent\b/gi, '#00000000');
}

function hasEquivalentColors(generatedValue, formalValue) {
  const generated = tokenizeColors(generatedValue);
  const formal = tokenizeColors(formalValue);

  return (
    generated.skeleton === formal.skeleton &&
    generated.colors.length > 0 &&
    generated.colors.length === formal.colors.length &&
    generated.colors.every((color, index) =>
      colorsAreClose(color, formal.colors[index])
    )
  );
}

function tokenizeColors(value) {
  const colors = [];
  const skeleton = normalizeCssValue(value).replace(
    /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi,
    color => {
      colors.push(expandHexColor(color));
      return '__COLOR__';
    }
  );

  return {colors, skeleton};
}

function colorsAreClose(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  for (let offset = 1; offset < left.length; offset += 2) {
    if (hexChannelDelta(left, right, offset) > 1) {
      return false;
    }
  }

  return true;
}

function expandHexColor(color) {
  const value = color.toLowerCase();
  const hex = value.slice(1);

  return hex.length === 3
    ? '#' + hex.split('').map(char => char + char).join('')
    : value;
}

function hexChannelDelta(left, right, offset) {
  return Math.abs(
    parseInt(left.slice(offset, offset + 2), 16) -
      parseInt(right.slice(offset, offset + 2), 16)
  );
}

function decodeCssEscapes(value) {
  return value.replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
}

function hslToHex(hue, saturation, lightness) {
  const h = (((Number(hue) % 360) + 360) % 360) / 360;
  const s = Math.min(1, Math.max(0, Number(saturation) / 100));
  const l = Math.min(1, Math.max(0, Number(lightness) / 100));

  if (s === 0) {
    return `#${toColorByte(l * 255)}${toColorByte(l * 255)}${toColorByte(
      l * 255
    )}`;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return `#${toColorByte(hueToRgb(p, q, h + 1 / 3) * 255)}${toColorByte(
    hueToRgb(p, q, h) * 255
  )}${toColorByte(hueToRgb(p, q, h - 1 / 3) * 255)}`;
}

function hueToRgb(p, q, t) {
  if (t < 0) {
    t += 1;
  }

  if (t > 1) {
    t -= 1;
  }

  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }

  if (t < 1 / 2) {
    return q;
  }

  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }

  return p;
}

function toPercentByte(value) {
  return toColorByte((Number(value) * 255) / 100);
}

function toAlphaByte(value) {
  return toColorByte(Number(value) * 255);
}

function toByte(value) {
  return toColorByte(Number(value));
}

function toColorByte(value) {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0');
}

function normalizeSelector(selector) {
  return selector
    .split(',')
    .map(item => item.trim().replace(/\s+/g, ' '))
    .join(',');
}

function formatAtRule(node) {
  return `${node.name} ${normalizeCssValue(node.params)}`;
}

function createDeclarationKey(atRules, selector, prop) {
  return [atRules.join('>'), selector, prop].join('\u0000');
}

function formatDeclarationKey(key) {
  const [atRules, selector, prop] = key.split('\u0000');

  return [atRules, selector, prop].filter(Boolean).join(' | ');
}

function mergeTotals(target, source) {
  Object.keys(target).forEach(key => {
    target[key] += source[key];
  });
}
