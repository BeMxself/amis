#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const policyPath = path.join(__dirname, 'theme-selectors/policy.json');
const args = process.argv.slice(2);
const update = args.includes('--update');
const allowBaselineGrowth = args.includes('--allow-baseline-growth');
const fixtureIndex = args.indexOf('--fixture');
const fixtureName = fixtureIndex >= 0 ? args[fixtureIndex + 1] : null;

const categories = {
  'public-forbidden': {
    description:
      'New old-prefix selectors or unclassified prefix-based style dependencies.',
    owner: 'theme-system-refactor',
    exit_condition:
      'Must be rewritten to stable .prismui-* selectors, [data-prismui-theme] scope, or explicitly classified before merge.'
  },
  'migration-target': {
    description:
      'Existing old-prefix selector or classPrefix selector debt that belongs to component migration.',
    owner: 'core-component-selector-migration',
    exit_condition:
      'Remove as each component migrates to stable .prismui-* selectors and tokenized styles.'
  },
  'internal-legacy': {
    description:
      'Existing editor/theme-editor legacy selectors that are internal migration inputs, not public CSS API.',
    owner: 'editor-theme-helper-migration',
    exit_condition: 'Replace during editor/theme-editor helper migration.'
  },
  'dom-alias-generated': {
    description:
      'Runtime-only legacy DOM alias output when explicitly enabled; library SCSS/CSS must not generate it.',
    owner: 'legacy-prefix-teardown',
    exit_condition:
      'Reassess no later than the one-year compatibility review window and remove when migration docs are sufficient.'
  },
  'docs-historical': {
    description:
      'Comments or documentation that mention historical selectors without creating CSS output.',
    owner: 'theme-system-validation-docs-rollout',
    exit_condition:
      'Update or remove as public docs move to tokenized theming guidance.'
  },
  'generated-artifact': {
    description:
      'Build output or generated artifacts ignored by this source guard.',
    owner: 'build-output',
    exit_condition:
      'Do not edit generated output by hand; regenerate from source.'
  },
  'theme-scope-portal-covered': {
    description:
      'Direct Portal/createPortal call sites covered by shared ThemeScope resolution/application helpers.',
    owner: 'theme-system-refactor',
    exit_condition:
      'Keep covered by shared ThemeScope helpers; do not add unmanaged direct portals.'
  },
  'theme-scope-portal-exception': {
    description:
      'Direct Portal/createPortal call sites explicitly classified as internal non-theme UI exceptions with tests.',
    owner: 'theme-system-refactor',
    exit_condition:
      'Keep exception tests and rationale current; convert to shared ThemeScope helper if the portal renders public amis component UI.'
  }
};

const scans = [
  {
    id: 'theme-prefix-selector',
    description:
      'Old .amis-* / .cxd-* selectors or theme-specific .antd-* / .dark-* selector usage in source styles and editor helpers.',
    paths: [
      'packages/amis-ui/scss',
      'packages/amis-theme-editor-helper/src',
      'packages/amis-editor-core/scss',
      'packages/amis-editor/examples',
      'examples'
    ],
    extensions: ['.scss', '.ts', '.tsx'],
    regex: '\\.(?:amis|cxd|antd|dark)-[A-Za-z0-9_-]+',
    defaultCategory: 'migration-target'
  },
  {
    id: 'classprefix-dom-selector',
    description:
      'Runtime DOM selectors that interpolate classPrefix or known classPrefix aliases into CSS selector strings.',
    paths: [
      'packages/amis-core/src',
      'packages/amis/src',
      'packages/amis-ui/src',
      'packages/amis-editor-core/src',
      'packages/amis-theme-editor-helper/src'
    ],
    extensions: ['.ts', '.tsx'],
    regex:
      '(querySelector|querySelectorAll|closest|matches|handle|filter|ghostClass).*\\$\\{(classPrefix|ns|themePrefix)\\}',
    defaultCategory: 'migration-target'
  },
  {
    id: 'direct-portal-theme-scope',
    description:
      'Direct Portal/createPortal call sites that can bypass root ThemeScope propagation.',
    paths: [
      'packages/amis-core/src',
      'packages/amis/src',
      'packages/amis-ui/src',
      'packages/amis-editor-core/src'
    ],
    extensions: ['.ts', '.tsx'],
    regex: '<Portal\\b|ReactDOM\\.createPortal\\s*\\(',
    defaultCategory: 'theme-scope-portal'
  }
];

const generatedSegments = new Set([
  'node_modules',
  'lib',
  'esm',
  '.rollup.cache',
  'coverage'
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function shouldSkipDir(dirent) {
  return generatedSegments.has(dirent.name);
}

function listFiles(startDir, extensions) {
  if (!fs.existsSync(startDir)) {
    return [];
  }

  const result = [];
  const stack = [startDir];

  while (stack.length) {
    const current = stack.pop();
    for (const dirent of fs.readdirSync(current, {withFileTypes: true})) {
      const next = path.join(current, dirent.name);

      if (dirent.isDirectory()) {
        if (!shouldSkipDir(dirent)) {
          stack.push(next);
        }
        continue;
      }

      if (dirent.isFile() && extensions.includes(path.extname(dirent.name))) {
        result.push(next);
      }
    }
  }

  return result.sort();
}

function normalizeLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function countChar(value, char) {
  return value.split(char).length - 1;
}

function collectCallLines(lines, index, maxLines = 12) {
  const result = [];
  let depth = 0;

  for (let current = index; current < lines.length; current++) {
    const line = lines[current];
    result.push({line, index: current});
    depth += countChar(line, '(') - countChar(line, ')');

    if ((depth <= 0 && current > index) || result.length >= maxLines) {
      break;
    }
  }

  return result;
}

function collectPropertyLines(lines, index, maxLines = 4) {
  const result = [];

  for (let current = index; current < lines.length; current++) {
    const line = lines[current];
    result.push({line, index: current});

    if (line.includes(',') || result.length >= maxLines) {
      break;
    }
  }

  return result;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeTemplateClassSelectorPattern(aliases) {
  return new RegExp(
    '`[^`]*\\.\\$\\{\\s*(?:' +
      [...aliases].map(escapeRegExp).join('|') +
      ')\\s*\\}[^`]*`'
  );
}

function makeTemplateClassNamePattern(aliases) {
  return new RegExp(
    '`[^`]*\\$\\{\\s*(?:' +
      [...aliases].map(escapeRegExp).join('|') +
      ')\\s*\\}[A-Za-z0-9_-][^`]*`'
  );
}

function hasCxSelector(line) {
  return /`[^`]*\.\$\{\s*(?:cx|classnames)\s*\([^`]*`/.test(line);
}

function hasCxClassName(line) {
  return /`[^`]*\$\{\s*(?:cx|classnames)\s*\([^`]*`/.test(line);
}

function hasHardcodedLegacySelector(line) {
  return /['"`][^'"`]*\.(?:amis|cxd|antd|dark)-[A-Za-z0-9_-]+/.test(line);
}

function hasClassListContainsCx(line) {
  return /\bclassList\.contains\(\s*(?:cx|classnames)\s*\(/.test(line);
}

function isClassPrefixExpression(expression) {
  return /^(?:this\.)?(?:props\.)?(?:classPrefix|themePrefix)$/.test(
    expression
  );
}

function collectDangerousVars(lines) {
  const aliases = new Set(['classPrefix', 'ns', 'themePrefix']);
  const selectorVars = new Set();
  const classNameVars = new Set();
  const declarationPattern =
    /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?);?\s*$/;
  const destructuredAliasPattern =
    /^\s*(?:const|let|var)\s*{[^}]*\b(?:classPrefix|themePrefix)\s*:\s*([A-Za-z_$][\w$]*)/;

  let changed = true;
  while (changed) {
    changed = false;

    lines.forEach(line => {
      const destructuredAlias = line.match(destructuredAliasPattern);
      if (destructuredAlias && !aliases.has(destructuredAlias[1])) {
        aliases.add(destructuredAlias[1]);
        changed = true;
      }

      const match = line.match(declarationPattern);
      if (!match) {
        return;
      }

      const [, name, expression] = match;
      const normalizedExpression = expression.trim();
      const selectorInterpolation = makeTemplateClassSelectorPattern(aliases);
      const classNameInterpolation = makeTemplateClassNamePattern(aliases);

      if (
        (aliases.has(normalizedExpression) ||
          isClassPrefixExpression(normalizedExpression)) &&
        !aliases.has(name)
      ) {
        aliases.add(name);
        changed = true;
      }

      if (
        (selectorInterpolation.test(normalizedExpression) ||
          hasCxSelector(normalizedExpression) ||
          hasHardcodedLegacySelector(normalizedExpression) ||
          selectorVars.has(normalizedExpression)) &&
        !selectorVars.has(name)
      ) {
        selectorVars.add(name);
        changed = true;
      }

      if (
        (classNameInterpolation.test(normalizedExpression) ||
          hasCxClassName(normalizedExpression) ||
          classNameVars.has(normalizedExpression)) &&
        !classNameVars.has(name)
      ) {
        classNameVars.add(name);
        changed = true;
      }
    });
  }

  return {aliases, selectorVars, classNameVars};
}

function firstArgumentName(line) {
  const match = line.match(/\(\s*([A-Za-z_$][\w$]*)\s*\)?\s*[),;]/);
  return match ? match[1] : null;
}

function propertyValueName(line) {
  const match = line.match(/:\s*([A-Za-z_$][\w$]*)\s*[,}]/);
  return match ? match[1] : null;
}

function findClassPrefixDomSelectorMatches(lines) {
  const selectorApiPattern =
    /\b(?:querySelector|querySelectorAll|closest|matches)\s*\(/;
  const selectorOptionPattern = /\b(?:handle|filter)\s*:/;
  const ghostClassPattern = /\bghostClass\s*:/;
  const classListContainsPattern = /\bclassList\.contains\s*\(/;
  const {aliases, selectorVars, classNameVars} = collectDangerousVars(lines);
  const classSelectorInterpolation = makeTemplateClassSelectorPattern(aliases);
  const classNameInterpolation = makeTemplateClassNamePattern(aliases);
  const matches = [];
  const seen = new Set();

  function addContextMatches(context, matcher, variableSet) {
    for (const {line, index} of context) {
      const variableName = firstArgumentName(line) || propertyValueName(line);
      const matched =
        typeof matcher === 'function' ? matcher(line) : matcher.test(line);
      if (!matched && !(variableName && variableSet?.has(variableName))) {
        continue;
      }

      const key = `${index}\u0000${line}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      matches.push({line, lineNumber: index + 1});
    }
  }

  lines.forEach((line, index) => {
    if (selectorApiPattern.test(line)) {
      addContextMatches(
        collectCallLines(lines, index),
        line => {
          return (
            classSelectorInterpolation.test(line) ||
            hasCxSelector(line) ||
            hasHardcodedLegacySelector(line)
          );
        },
        selectorVars
      );
    }

    if (selectorOptionPattern.test(line)) {
      addContextMatches(
        collectPropertyLines(lines, index),
        line => {
          return (
            classSelectorInterpolation.test(line) ||
            hasCxSelector(line) ||
            hasHardcodedLegacySelector(line)
          );
        },
        selectorVars
      );
    }

    if (ghostClassPattern.test(line)) {
      addContextMatches(
        collectPropertyLines(lines, index),
        line => {
          return classNameInterpolation.test(line) || hasCxClassName(line);
        },
        classNameVars
      );
    }

    if (classListContainsPattern.test(line)) {
      addContextMatches(
        collectCallLines(lines, index),
        line => {
          return (
            classNameInterpolation.test(line) ||
            hasCxClassName(line) ||
            hasClassListContainsCx(line)
          );
        },
        classNameVars
      );
    }
  });

  return matches;
}

function classifyMatch(scan, file, line) {
  const normalizedFile = toPosix(file);

  if (scan.id === 'direct-portal-theme-scope') {
    return normalizedFile.endsWith(
      'packages/amis-ui/src/components/MobileDevTool.tsx'
    )
      ? 'theme-scope-portal-exception'
      : 'theme-scope-portal-covered';
  }

  if (/^\s*\/\//.test(line) || normalizedFile.endsWith('.md')) {
    return 'docs-historical';
  }

  if (
    normalizedFile.startsWith('packages/amis-theme-editor-helper/') ||
    normalizedFile.startsWith('packages/amis-editor-core/')
  ) {
    return 'internal-legacy';
  }

  return scan.defaultCategory;
}

function addEntry(map, entry) {
  const key = `${entry.scan}\u0000${entry.file}\u0000${entry.pattern}\u0000${entry.text}`;
  const existing = map.get(key);

  if (existing) {
    existing.count += 1;
    existing.lines.push(entry.line);
    return;
  }

  map.set(key, {
    scan: entry.scan,
    category: entry.category,
    file: entry.file,
    pattern: entry.pattern,
    text: entry.text,
    count: 1,
    lines: [entry.line]
  });
}

function scanFiles(activeScans) {
  const entries = new Map();

  for (const scan of activeScans) {
    const regex = new RegExp(scan.regex);
    const files = scan.paths.flatMap(scanPath =>
      listFiles(path.join(repoRoot, scanPath), scan.extensions)
    );

    for (const file of files) {
      const rel = toPosix(path.relative(repoRoot, file));
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

      if (scan.id === 'classprefix-dom-selector') {
        findClassPrefixDomSelectorMatches(lines).forEach(match => {
          addEntry(entries, {
            scan: scan.id,
            category: classifyMatch(scan, rel, match.line),
            file: rel,
            pattern: scan.regex,
            text: normalizeLine(match.line),
            line: match.lineNumber
          });
        });
        continue;
      }

      lines.forEach((line, index) => {
        if (!regex.test(line)) {
          return;
        }

        addEntry(entries, {
          scan: scan.id,
          category: classifyMatch(scan, rel, line),
          file: rel,
          pattern: scan.regex,
          text: normalizeLine(line),
          line: index + 1
        });
      });
    }
  }

  return [...entries.values()].sort((a, b) => {
    return (
      a.scan.localeCompare(b.scan) ||
      a.file.localeCompare(b.file) ||
      a.text.localeCompare(b.text)
    );
  });
}

function summarize(entries) {
  return entries.reduce(
    (acc, entry) => {
      acc.total_matches += entry.count;
      acc.by_scan[entry.scan] = (acc.by_scan[entry.scan] || 0) + entry.count;
      acc.by_category[entry.category] =
        (acc.by_category[entry.category] || 0) + entry.count;
      return acc;
    },
    {total_matches: 0, by_scan: {}, by_category: {}}
  );
}

function loadPolicy() {
  if (!fs.existsSync(policyPath)) {
    throw new Error(
      `Missing theme selector policy: ${path.relative(
        repoRoot,
        policyPath
      )}. Run with --update to create it.`
    );
  }

  return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
}

function countEntries(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const key = `${entry.scan}\u0000${entry.file}\u0000${entry.pattern}\u0000${entry.text}`;
    counts.set(key, (counts.get(key) || 0) + entry.count);
  }
  return counts;
}

function checkAgainstPolicy(currentEntries, policy) {
  const allowed = countEntries(policy.entries || []);
  const violations = [];

  for (const entry of currentEntries) {
    const key = `${entry.scan}\u0000${entry.file}\u0000${entry.pattern}\u0000${entry.text}`;
    const allowedCount = allowed.get(key) || 0;

    if (entry.count > allowedCount) {
      violations.push({
        ...entry,
        allowed_count: allowedCount,
        new_count: entry.count - allowedCount
      });
    }
  }

  return violations;
}

function fixtureScans(name) {
  const fixtureRoot = `packages/amis-ui/scripts/theme-selectors/fixtures/${name}`;

  return scans.map(scan => ({
    ...scan,
    paths: [fixtureRoot],
    extensions: ['.scss', '.ts', '.tsx']
  }));
}

function writePolicy(entries) {
  const policy = {
    version: 1,
    updated: new Date().toISOString().slice(0, 10),
    purpose:
      'Tracks old-prefix selector and unsafe classPrefix selector baseline as active debt. Existing entries may be removed; new unclassified matches fail npm run check:theme-selectors --workspace amis-ui. Plain --update may only keep or shrink the baseline; growth requires --allow-baseline-growth and review.',
    categories,
    ignored_generated_segments: [...generatedSegments].sort(),
    scans: scans.map(
      ({id, description, paths, extensions, regex, defaultCategory}) => ({
        id,
        description,
        paths,
        extensions,
        regex,
        default_category: defaultCategory
      })
    ),
    summary: summarize(entries),
    entries
  };

  fs.mkdirSync(path.dirname(policyPath), {recursive: true});
  fs.writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
}

function main() {
  const activeScans = fixtureName ? fixtureScans(fixtureName) : scans;
  const currentEntries = scanFiles(activeScans);

  if (update) {
    if (fixtureName) {
      throw new Error('--update cannot be combined with --fixture');
    }

    if (fs.existsSync(policyPath) && !allowBaselineGrowth) {
      const previousPolicy = loadPolicy();
      const previousTotal = summarize(
        previousPolicy.entries || []
      ).total_matches;
      const currentTotal = summarize(currentEntries).total_matches;

      if (currentTotal > previousTotal) {
        throw new Error(
          `Theme selector baseline grew from ${previousTotal} to ${currentTotal}. ` +
            'Classify and remove the new debt, or rerun with --allow-baseline-growth after review.'
        );
      }
    }

    writePolicy(currentEntries);
    console.log(
      `Updated ${toPosix(path.relative(repoRoot, policyPath))}: ${
        summarize(currentEntries).total_matches
      } allowed baseline matches.`
    );
    return;
  }

  const policy = fixtureName ? {entries: []} : loadPolicy();
  const violations = checkAgainstPolicy(currentEntries, policy);

  if (violations.length) {
    console.error(
      'Theme selector guard failed: new unclassified old-prefix or unsafe classPrefix selector matches found.'
    );
    for (const violation of violations.slice(0, 50)) {
      console.error(
        `- ${violation.file}:${violation.lines[0]} [${violation.scan}] ${violation.text}`
      );
    }
    if (violations.length > 50) {
      console.error(`... ${violations.length - 50} more violation(s) omitted.`);
    }
    process.exit(1);
  }

  const summary = summarize(currentEntries);
  const categorySummary = Object.keys(summary.by_category)
    .sort()
    .map(category => `${category}: ${summary.by_category[category]}`)
    .join(', ');
  console.log(
    `Theme selector guard passed: ${summary.total_matches} old-prefix/classPrefix baseline match(es), 0 new violation(s). Remaining debt by category: ${categorySummary}.`
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
