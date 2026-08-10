#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {createRequire} = require('module');
const {pathToFileURL} = require('url');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_NODE_MODULES = '/tmp/amis-visual-regression-deps/node_modules';
const NODE_MODULES =
  process.env.AMIS_VISUAL_NODE_MODULES || DEFAULT_NODE_MODULES;
const requireFromDeps = createRequire(path.join(NODE_MODULES, 'index.js'));

function parseArgs(argv) {
  const args = {
    baseline: 'http://127.0.0.1:8889',
    candidate: 'http://127.0.0.1:8888',
    manifest: path.join(__dirname, 'page-manifest.json'),
    outDir: '',
    viewport: '1440x900',
    theme: 'cxd',
    tab: '',
    path: '',
    limit: 0,
    workers: 1,
    maxChunks: 0,
    overlap: 120,
    threshold: 0.1,
    warnRatio: 0.0005,
    failRatio: 0.003,
    noRetry: false,
    retryDelay: 1000,
    timeout: 30000,
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (key === 'baseline') args.baseline = next, i++;
    else if (key === 'candidate') args.candidate = next, i++;
    else if (key === 'manifest') args.manifest = path.resolve(next), i++;
    else if (key === 'out') args.outDir = path.resolve(next), i++;
    else if (key === 'viewport') args.viewport = next, i++;
    else if (key === 'theme') args.theme = next, i++;
    else if (key === 'tab') args.tab = next, i++;
    else if (key === 'path') args.path = next, i++;
    else if (key === 'limit') args.limit = Number(next), i++;
    else if (key === 'workers') args.workers = Number(next), i++;
    else if (key === 'max-chunks') args.maxChunks = Number(next), i++;
    else if (key === 'overlap') args.overlap = Number(next), i++;
    else if (key === 'threshold') args.threshold = Number(next), i++;
    else if (key === 'warn-ratio') args.warnRatio = Number(next), i++;
    else if (key === 'fail-ratio') args.failRatio = Number(next), i++;
    else if (key === 'no-retry') args.noRetry = true;
    else if (key === 'retry-delay') args.retryDelay = Number(next), i++;
    else if (key === 'timeout') args.timeout = Number(next), i++;
    else if (key === 'executable-path') args.executablePath = next, i++;
    else if (key === 'help') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  const [width, height] = args.viewport.split('x').map(Number);
  if (!width || !height) {
    throw new Error(`Invalid --viewport ${args.viewport}; expected WIDTHxHEIGHT`);
  }
  args.viewportSize = {width, height};
  if (!args.outDir) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    args.outDir = path.join(ROOT, '.gstack/visual-regression', stamp);
  }
  args.workers = Math.max(1, Math.floor(args.workers || 1));
  return args;
}

function usage() {
  return `Usage:
  AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \\
    node .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs \\
    --baseline http://127.0.0.1:8889 --candidate http://127.0.0.1:8888

Options:
  --limit N          Run only the first N filtered pages.
  --workers N        Run N pages in parallel. Each page still scrolls sequentially.
  --tab NAME         Filter by docs/components/style/examples.
  --path PATH        Run one route path from page-manifest.json.
  --max-chunks N     Cap scroll chunks per page, useful for smoke runs.
  --no-retry         Do not recapture chunks that exceed warn threshold.
  --out DIR          Output directory, default .gstack/visual-regression/<timestamp>.
`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, {recursive: true});
}

function normalizeRoutePath(routePath) {
  if (!routePath) return '/';
  return routePath.startsWith('/') ? routePath : `/${routePath}`;
}

function routeKey(page) {
  return `${page.tab}_${normalizeRoutePath(page.path)}`
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function chunkName(index, y) {
  return `${String(index + 1).padStart(3, '0')}_y${String(y).padStart(
    5,
    '0'
  )}.png`;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeHealthUrl(url, baseUrl) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    if (parsed.origin === base.origin) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch (e) {
    return url.replace(baseUrl, '');
  }
}

async function twoRaf(page) {
  await page.evaluate(
    () =>
      new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}

async function waitForVisibleImages(page, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pending = await page.evaluate(() => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      return Array.from(document.images).filter(img => {
        const rect = img.getBoundingClientRect();
        const visible =
          rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= viewportHeight &&
          rect.left <= viewportWidth;
        return visible && (!img.complete || img.naturalWidth === 0);
      }).length;
    });
    if (!pending) return;
    await delay(150);
  }
}

async function waitForNoSpinner(page, timeout = 15000) {
  try {
    await page.waitForFunction(
      () => {
        const selectors = [
          '.visibility-sensor > .amis-Spinner',
          '.visibility-sensor > .cxd-Spinner',
          '.amis-LazyComponent > .amis-Spinner',
          '.cxd-LazyComponent > .cxd-Spinner'
        ];
        return selectors.every(selector =>
          Array.from(document.querySelectorAll(selector)).every(node => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            const outsideViewport =
              rect.bottom < 0 ||
              rect.right < 0 ||
              rect.top > window.innerHeight ||
              rect.left > window.innerWidth;
            return (
              outsideViewport ||
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.opacity === '0' ||
              rect.width === 0 ||
              rect.height === 0
            );
          })
        );
      },
      {timeout}
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function waitForStableLayout(page, rounds = 3, interval = 250) {
  let stable = 0;
  let previous = '';
  const started = Date.now();
  while (Date.now() - started < 8000) {
    const current = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return [el.scrollHeight, el.clientWidth, el.clientHeight, window.innerWidth, window.innerHeight].join('x');
    });
    stable = current === previous ? stable + 1 : 1;
    previous = current;
    if (stable >= rounds) return;
    await delay(interval);
  }
}

async function stabilize(page, mode) {
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => undefined);
  await waitForNoSpinner(page);
  await waitForVisibleImages(page, 4000);
  await waitForStableLayout(page, mode === 'scroll' ? 2 : 3, 250);
  await twoRaf(page).catch(() => undefined);
  await delay(mode === 'scroll' ? 700 : 500);
  const loadingSettled = await waitForNoSpinner(page);
  if (!loadingSettled) {
    throw new Error('Visible loading placeholder did not settle before capture.');
  }
  await waitForStableLayout(page, 2, 250);
  await twoRaf(page).catch(() => undefined);
}

async function installDeterminism(context, theme) {
  await context.addInitScript(({theme}) => {
    const fixedNow = Date.parse('2026-08-09T00:00:00.000Z');
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }
      static now() {
        return fixedNow;
      }
    }
    FixedDate.UTC = RealDate.UTC;
    FixedDate.parse = RealDate.parse;
    FixedDate.prototype = RealDate.prototype;
    window.Date = FixedDate;
    let randomSeed = 0x2a2a2a2a;
    Math.random = () => {
      randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
      return randomSeed / 0x100000000;
    };
    try {
      localStorage.clear();
      localStorage.setItem('amis-theme', theme);
      localStorage.setItem('amis-viewMode', 'pc');
      localStorage.setItem('amis-locale', 'zh-CN');
    } catch (e) {}
  }, {theme});
}

async function disableAnimations(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }

      html, body, #root {
        overflow-anchor: none !important;
      }
    `
  }).catch(() => undefined);
}

async function installVisualMasks(page) {
  await page
    .addStyleTag({
      content: `
        .amis-Log-body,
        .cxd-Log-body {
          color: transparent !important;
        }

        .amis-Log-body *,
        .cxd-Log-body * {
          color: transparent !important;
          text-shadow: none !important;
        }

        .markdown img[src*=".gif"],
        .amis-doc img[src*=".gif"] {
          visibility: hidden !important;
        }

        iframe[src^="http://"],
        iframe[src^="https://"] {
          opacity: 0 !important;
        }
      `
    })
    .catch(() => undefined);
}

function collectConsole(page, bucket, side, baseUrl) {
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      bucket.push({side, type: msg.type(), text: msg.text()});
    }
  });
  page.on('pageerror', err => {
    bucket.push({side, type: 'pageerror', text: err.message});
  });
  page.on('requestfailed', request => {
    const url = request.url();
    if (!url.startsWith('data:')) {
      bucket.push({
        side,
        type: 'requestfailed',
        text: `${request.failure()?.errorText || 'failed'} ${url}`
      });
    }
  });
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      bucket.push({
        side,
        type: 'resource-error',
        status,
        url: normalizeHealthUrl(response.url(), baseUrl),
        text: `${status} ${normalizeHealthUrl(response.url(), baseUrl)}`
      });
    }
  });
}

async function openPage(context, baseUrl, pageMeta, side, consoleEvents, timeout) {
  const page = await context.newPage();
  collectConsole(page, consoleEvents, side, baseUrl);
  const url = `${baseUrl}${normalizeRoutePath(pageMeta.path)}`;
  try {
    const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout});
    await page.waitForLoadState('networkidle', {timeout: 5000}).catch(() => undefined);
    await disableAnimations(page);
    await installVisualMasks(page);
    await stabilize(page, 'load');
    return {page, status: response ? response.status() : null, url};
  } catch (error) {
    await page.close().catch(() => undefined);
    throw error;
  }
}

async function openPageWithRetry(
  context,
  baseUrl,
  pageMeta,
  side,
  consoleEvents,
  timeout
) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const eventStart = consoleEvents.length;
    try {
      const opened = await openPage(
        context,
        baseUrl,
        pageMeta,
        side,
        consoleEvents,
        timeout
      );
      const hasTransientOptimizeError = consoleEvents
        .slice(eventStart)
        .some(
          event =>
            event.side === side &&
            event.type === 'resource-error' &&
            event.status === 504
        );
      if (!hasTransientOptimizeError || attempt === 1) {
        return opened;
      }
      await opened.page.close().catch(() => undefined);
      await delay(1000);
    } catch (error) {
      lastError = error;
      if (attempt === 0) await delay(1000);
    }
  }
  throw lastError;
}

function resourceErrorKey(event) {
  const value = event.url || event.text || '';
  if (value.includes('/node_modules/.vite/deps/')) {
    return `${event.status || ''} ${value.replace(/[?&]v=[^&]+/, '')}`;
  }
  return `${event.status || ''} ${value}`;
}

function summarizeEvents(events) {
  return events.map(event => ({
    side: event.side,
    type: event.type,
    status: event.status,
    url: event.url,
    text: event.text
  }));
}

function normalizeContentText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function contentSignature(page) {
  const content = await page.evaluate(() => {
    const selectors = [
      '.Doc-content',
      '.markdown-body',
      '.markdown',
      '[role="main"]',
      'main',
      '#root'
    ];
    const selector = selectors.find(item => document.querySelector(item));
    const node = selector ? document.querySelector(selector) : document.body;
    return {
      selector: selector || 'body',
      text: node ? node.innerText || node.textContent || '' : ''
    };
  });
  const normalized = normalizeContentText(content.text);
  return {
    selector: content.selector,
    textHash: hashText(normalized),
    textLength: normalized.length,
    textSample: normalized.slice(0, 240),
    textTail: normalized.slice(-240)
  };
}

function buildContentDrift(baselineContent, candidateContent) {
  if (!baselineContent || !candidateContent) return null;
  if (baselineContent.textHash === candidateContent.textHash) return null;
  return {
    reason: 'text-content-drift',
    lengthDelta: candidateContent.textLength - baselineContent.textLength,
    baseline: baselineContent,
    candidate: candidateContent
  };
}

function findAsymmetricResourceErrors(consoleEvents) {
  const resourceErrors = consoleEvents.filter(
    event => event.type === 'resource-error'
  );
  const baselineKeys = new Set(
    resourceErrors
      .filter(event => event.side === 'baseline')
      .map(resourceErrorKey)
  );
  const candidateKeys = new Set(
    resourceErrors
      .filter(event => event.side === 'candidate')
      .map(resourceErrorKey)
  );

  return resourceErrors.filter(event => {
    const key = resourceErrorKey(event);
    return event.side === 'baseline'
      ? !candidateKeys.has(key)
      : !baselineKeys.has(key);
  });
}

function findPageErrors(consoleEvents) {
  return consoleEvents.filter(event => event.type === 'pageerror');
}

async function visibleRuntimeErrors(page) {
  return page.evaluate(() => {
    const errorPattern = /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|EvalError|URIError):/;
    const candidateSelectors = [
      '.amis-Alert--danger',
      '.cxd-Alert--danger',
      '.amis-Alert--error',
      '.cxd-Alert--error',
      '.renderer-error-boundary',
      '[role="alert"]'
    ];
    const hasErrorLikeBackground = color => {
      const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color || '');
      if (!match) return false;
      const [, red, green, blue] = match.map(Number);
      return red >= 240 && green <= 235 && blue <= 235;
    };

    const candidates = Array.from(
      document.body.querySelectorAll(candidateSelectors.join(','))
    ).filter((node, index, list) => list.indexOf(node) === index);

    return candidates
      .map(node => {
        const text = (node.textContent || '').trim();
        if (
          !errorPattern.test(text) &&
          !/渲染发生错误|详细错误信息请查看控制台输出/.test(text)
        ) {
          return null;
        }

        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0';

        if (!visible) return null;

        const hasStackTrace = /\n\s+at\s+/.test(text);
        const isKnownErrorContainer = candidateSelectors.some(selector =>
          node.matches(selector)
        );
        if (
          !isKnownErrorContainer &&
          !hasStackTrace &&
          !hasErrorLikeBackground(style.backgroundColor)
        ) {
          return null;
        }

        return {
          text: text.slice(0, 240),
          className: node.className ? String(node.className) : '',
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        };
      })
      .filter(Boolean)
      .slice(0, 5);
  });
}

function buildHealthFailure(consoleEvents, baselineRuntimeErrors, candidateRuntimeErrors) {
  const asymmetricResourceErrors = findAsymmetricResourceErrors(consoleEvents);
  const pageErrors = findPageErrors(consoleEvents);
  const runtimeErrors = [
    ...baselineRuntimeErrors.map(error => ({side: 'baseline', ...error})),
    ...candidateRuntimeErrors.map(error => ({side: 'candidate', ...error}))
  ];
  const reasons = [];

  if (asymmetricResourceErrors.length) {
    reasons.push('asymmetric-resource-errors');
  }
  if (pageErrors.length) {
    reasons.push('page-errors');
  }
  if (runtimeErrors.length) {
    reasons.push('visible-runtime-errors');
  }

  if (!reasons.length) return null;

  return {
    reasons,
    asymmetricResourceErrors: summarizeEvents(asymmetricResourceErrors),
    pageErrors: summarizeEvents(pageErrors),
    runtimeErrors
  };
}

async function metrics(page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return {
      scrollHeight: el.scrollHeight,
      scrollWidth: el.scrollWidth,
      clientHeight: el.clientHeight,
      clientWidth: el.clientWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      title: document.title,
      notFound:
        !!document.querySelector('.amis-404, .cxd-404') ||
        /not\s*found|404/i.test(document.body.innerText.slice(0, 500))
    };
  });
}

function yPositions(maxScrollHeight, viewportHeight, overlap, maxChunks) {
  const maxScroll = Math.max(0, maxScrollHeight - viewportHeight);
  const step = Math.max(1, viewportHeight - overlap);
  const ys = [];
  for (let y = 0; y < maxScroll; y += step) {
    ys.push(y);
    if (maxChunks && ys.length >= maxChunks) return ys;
  }
  if (!ys.length || ys[ys.length - 1] !== maxScroll) {
    ys.push(maxScroll);
  }
  return maxChunks ? ys.slice(0, maxChunks) : ys;
}

async function screenshotAt(page, y, minimumScrollHeight, outPath) {
  let actualY = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await stabilize(page, 'scroll');
      const scrollState = await page.evaluate(() => {
        const el = document.scrollingElement || document.documentElement;
        return {
          actualY: window.scrollY,
          scrollHeight: el.scrollHeight,
          viewportHeight: window.innerHeight
        };
      });
      actualY = scrollState.actualY;
      const expectedY = Math.min(
        y,
        Math.max(0, scrollState.scrollHeight - scrollState.viewportHeight)
      );
      if (scrollState.scrollHeight + 2 < minimumScrollHeight) {
        throw new Error(
          `Page height collapsed during capture: minimum ${minimumScrollHeight}, actual ${scrollState.scrollHeight}.`
        );
      }
      if (Math.abs(actualY - expectedY) <= 1) {
        break;
      }
    } catch (error) {
      if (attempt === 1) throw error;
    }

    if (attempt === 1) {
      throw new Error(
        `Scroll position did not settle for requested ${y}: actual ${actualY}.`
      );
    }
    await page.waitForLoadState('domcontentloaded', {timeout: 10000}).catch(() => undefined);
    await stabilize(page, 'load');
  }
  await page.screenshot({path: outPath, animations: 'disabled'});
  return actualY;
}

async function comparePng(pixelmatch, PNG, baselinePath, candidatePath, diffPath, threshold) {
  const imgA = PNG.sync.read(fs.readFileSync(baselinePath));
  const imgB = PNG.sync.read(fs.readFileSync(candidatePath));
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return {
      width: Math.max(imgA.width, imgB.width),
      height: Math.max(imgA.height, imgB.height),
      diffPixels: Math.max(imgA.width * imgA.height, imgB.width * imgB.height),
      diffRatio: 1,
      dimensionMismatch: true
    };
  }
  const diff = new PNG({width: imgA.width, height: imgA.height});
  const diffPixels = pixelmatch(
    imgA.data,
    imgB.data,
    diff.data,
    imgA.width,
    imgA.height,
    {threshold, includeAA: false}
  );
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return {
    width: imgA.width,
    height: imgA.height,
    diffPixels,
    diffRatio: diffPixels / (imgA.width * imgA.height),
    dimensionMismatch: false
  };
}

function statusForRatio(ratio, warnRatio, failRatio) {
  if (ratio > failRatio) return 'fail';
  if (ratio > warnRatio) return 'warn';
  return 'pass';
}

function statusRank(status) {
  return {
    pass: 0,
    warn: 1,
    'content-drift': 2,
    fail: 3,
    error: 4
  }[status] ?? 5;
}

function isBetterResult(next, current) {
  return statusRank(next.status) < statusRank(current.status);
}

function shouldRetryPageResult(result, args) {
  if (args.noRetry) return false;
  return result.status === 'fail' || result.status === 'error';
}

async function runPageAttempt(deps, browser, args, pageMeta) {
  const key = routeKey(pageMeta);
  const pageDir = path.join(args.outDir, key);
  const baselineDir = path.join(pageDir, 'baseline');
  const candidateDir = path.join(pageDir, 'candidate');
  const diffDir = path.join(pageDir, 'diff');
  [baselineDir, candidateDir, diffDir].forEach(ensureDir);

  const consoleEvents = [];
  const context = await browser.newContext({
    viewport: args.viewportSize,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'zh-CN'
  });
  await installDeterminism(context, args.theme);

  let baseline;
  let candidate;
  try {
    baseline = await openPageWithRetry(
      context,
      args.baseline,
      pageMeta,
      'baseline',
      consoleEvents,
      args.timeout
    );
    candidate = await openPageWithRetry(
      context,
      args.candidate,
      pageMeta,
      'candidate',
      consoleEvents,
      args.timeout
    );

    const baseMetrics = await metrics(baseline.page);
    const candMetrics = await metrics(candidate.page);
    const baselineContent = await contentSignature(baseline.page);
    const candidateContent = await contentSignature(candidate.page);
    const contentDrift = buildContentDrift(baselineContent, candidateContent);
    const baselineRuntimeErrors = await visibleRuntimeErrors(baseline.page);
    const candidateRuntimeErrors = await visibleRuntimeErrors(candidate.page);
    const healthFailure = buildHealthFailure(
      consoleEvents,
      baselineRuntimeErrors,
      candidateRuntimeErrors
    );

    if (healthFailure) {
      return {
        key,
        page: pageMeta,
        baselineUrl: baseline.url,
        candidateUrl: candidate.url,
        baselineStatus: baseline.status,
        candidateStatus: candidate.status,
        baselineMetrics: baseMetrics,
        candidateMetrics: candMetrics,
        baselineContent,
        candidateContent,
        contentDrift,
        chunkCount: 0,
        truncatedChunks: false,
        chunks: [],
        consoleEvents,
        healthFailure,
        status: 'error',
        error: `Health gate blocked pixel comparison: ${healthFailure.reasons.join(', ')}`
      };
    }

    const maxScrollHeight = Math.max(baseMetrics.scrollHeight, candMetrics.scrollHeight);
    const viewportHeight = Math.min(baseMetrics.viewportHeight, candMetrics.viewportHeight);
    const ys = yPositions(maxScrollHeight, viewportHeight, args.overlap, args.maxChunks);

    const chunks = [];
    for (let index = 0; index < ys.length; index++) {
      const y = ys[index];
      const fileName = chunkName(index, y);
      const baselinePath = path.join(baselineDir, fileName);
      const candidatePath = path.join(candidateDir, fileName);
      const diffPath = path.join(diffDir, fileName);
      const actualBaselineY = await screenshotAt(
        baseline.page,
        y,
        baseMetrics.scrollHeight,
        baselinePath
      );
      const actualCandidateY = await screenshotAt(
        candidate.page,
        y,
        candMetrics.scrollHeight,
        candidatePath
      );
      let diff = await comparePng(
        deps.pixelmatch,
        deps.PNG,
        baselinePath,
        candidatePath,
        diffPath,
        args.threshold
      );

      if (!args.noRetry && diff.diffRatio > args.warnRatio) {
        await delay(args.retryDelay);
        const retryBaselinePath = path.join(baselineDir, fileName.replace('.png', '.retry.png'));
        const retryCandidatePath = path.join(candidateDir, fileName.replace('.png', '.retry.png'));
        const retryDiffPath = path.join(diffDir, fileName.replace('.png', '.retry.png'));
        await screenshotAt(
          baseline.page,
          y,
          baseMetrics.scrollHeight,
          retryBaselinePath
        );
        await screenshotAt(
          candidate.page,
          y,
          candMetrics.scrollHeight,
          retryCandidatePath
        );
        const retryDiff = await comparePng(
          deps.pixelmatch,
          deps.PNG,
          retryBaselinePath,
          retryCandidatePath,
          retryDiffPath,
          args.threshold
        );
        if (retryDiff.diffRatio <= diff.diffRatio) {
          diff = retryDiff;
        }
      }

      chunks.push({
        index,
        y,
        actualBaselineY,
        actualCandidateY,
        baselinePath: path.relative(args.outDir, baselinePath),
        candidatePath: path.relative(args.outDir, candidatePath),
        diffPath: path.relative(args.outDir, diffPath),
        ...diff,
        status: statusForRatio(diff.diffRatio, args.warnRatio, args.failRatio)
      });
    }

    const pixelStatus = chunks.some(chunk => chunk.status === 'fail')
      ? 'fail'
      : chunks.some(chunk => chunk.status === 'warn')
        ? 'warn'
        : 'pass';

    return {
      key,
      page: pageMeta,
      baselineUrl: baseline.url,
      candidateUrl: candidate.url,
      baselineStatus: baseline.status,
      candidateStatus: candidate.status,
      baselineMetrics: baseMetrics,
      candidateMetrics: candMetrics,
      baselineContent,
      candidateContent,
      contentDrift,
      chunkCount: chunks.length,
      truncatedChunks: !!args.maxChunks && ys.length >= args.maxChunks,
      chunks,
      consoleEvents,
      status: pixelStatus !== 'pass' && contentDrift ? 'content-drift' : pixelStatus
    };
  } catch (error) {
    return {
      key,
      page: pageMeta,
      consoleEvents,
      status: 'error',
      error: error && error.stack ? error.stack : String(error)
    };
  } finally {
    await baseline?.page?.close().catch(() => undefined);
    await candidate?.page?.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

async function runPage(deps, browser, args, pageMeta) {
  const first = await runPageAttempt(deps, browser, args, pageMeta);

  if (!shouldRetryPageResult(first, args)) {
    return {...first, attempts: 1};
  }

  await delay(args.retryDelay);
  const second = await runPageAttempt(deps, browser, args, pageMeta);
  const selected = isBetterResult(second, first) ? second : first;

  return {
    ...selected,
    attempts: 2,
    previousStatus: isBetterResult(second, first) ? first.status : second.status
  };
}

function writeReport(args, manifest, results) {
  const summary = {
    generatedAt: new Date().toISOString(),
    baseline: args.baseline,
    candidate: args.candidate,
    viewport: args.viewport,
    theme: args.theme,
    totalPagesInManifest: manifest.total,
    pagesRun: results.length,
    counts: results.reduce(
      (acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      },
      {pass: 0, warn: 0, fail: 0, error: 0, 'content-drift': 0}
    ),
    maxDiffChunks: results
      .flatMap(result =>
        (result.chunks || []).map(chunk => ({
          path: result.page.path,
          tab: result.page.tab,
          label: result.page.label,
          y: chunk.y,
          status: chunk.status,
          diffRatio: chunk.diffRatio,
          diffPixels: chunk.diffPixels,
          diffPath: chunk.diffPath
        }))
      )
      .sort((a, b) => b.diffRatio - a.diffRatio)
      .slice(0, 50)
  };

  fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(path.join(args.outDir, 'results.json'), JSON.stringify(results, null, 2) + '\n');

  const lines = [
    '# amis 像素回归执行报告',
    '',
    `生成时间：${summary.generatedAt}`,
    `Baseline：${args.baseline}`,
    `Candidate：${args.candidate}`,
    `Viewport：${args.viewport}`,
    `Theme：${args.theme}`,
    '',
    '## Summary',
    '',
    `- Manifest 页面数：${manifest.total}`,
    `- 本次执行页面数：${results.length}`,
    `- Pass：${summary.counts.pass || 0}`,
    `- Warn：${summary.counts.warn || 0}`,
    `- Fail：${summary.counts.fail || 0}`,
    `- Error：${summary.counts.error || 0}`,
    `- Content Drift：${summary.counts['content-drift'] || 0}`,
    '',
    '## Top Diff Chunks',
    '',
    '| # | Status | Diff % | Pixels | Path | y | Diff |',
    '|---:|---|---:|---:|---|---:|---|'
  ];
  summary.maxDiffChunks.forEach((chunk, index) => {
    lines.push(
      `| ${index + 1} | ${chunk.status} | ${(chunk.diffRatio * 100).toFixed(4)}% | ${chunk.diffPixels} | \`${chunk.path}\` | ${chunk.y} | \`${chunk.diffPath}\` |`
    );
  });
  lines.push('', '## Page Results', '', '| Status | Chunks | Path | Label | Console Events | Health Gate | Content Drift |', '|---|---:|---|---|---:|---|---|');
  for (const result of results) {
    lines.push(
      `| ${result.status} | ${result.chunkCount || 0} | \`${result.page.path}\` | ${String(result.page.label || '').replace(/\|/g, '\\|')} | ${result.consoleEvents?.length || 0} | ${result.healthFailure?.reasons?.join(', ') || ''} | ${result.contentDrift?.reason || ''} |`
    );
  }
  fs.writeFileSync(path.join(args.outDir, 'report.md'), lines.join('\n') + '\n');
  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const [{chromium}, {PNG}, pixelmatchModule] = await Promise.all([
    Promise.resolve(requireFromDeps('playwright')),
    Promise.resolve(requireFromDeps('pngjs')),
    import(pathToFileURL(requireFromDeps.resolve('pixelmatch')).href)
  ]);
  const deps = {PNG, pixelmatch: pixelmatchModule.default || pixelmatchModule};

  const manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
  let pages = manifest.pages.map(page => ({
    ...page,
    path: normalizeRoutePath(page.path)
  }));
  if (args.tab) pages = pages.filter(page => page.tab === args.tab);
  if (args.path) {
    const requestedPath = normalizeRoutePath(args.path);
    pages = pages.filter(page => page.path === requestedPath);
  }
  if (args.limit) pages = pages.slice(0, args.limit);
  if (!pages.length) throw new Error('No pages matched the filters.');

  ensureDir(args.outDir);
  fs.writeFileSync(path.join(args.outDir, 'run-config.json'), JSON.stringify(args, null, 2) + '\n');

  const launchOptions = {
    headless: true,
    args: ['--disable-gpu', '--font-render-hinting=none']
  };
  if (args.executablePath && fs.existsSync(args.executablePath)) {
    launchOptions.executablePath = args.executablePath;
  }

  const browser = await chromium.launch(launchOptions);
  const results = new Array(pages.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker(workerIndex) {
    while (nextIndex < pages.length) {
      const currentIndex = nextIndex++;
      const page = pages[currentIndex];
      const result = await runPage(deps, browser, args, page);
      results[currentIndex] = result;
      completed++;
      console.log(
        `[${currentIndex + 1}/${pages.length}] worker=${workerIndex} ${result.status.toUpperCase()} ${page.path} chunks=${result.chunkCount || 0}`
      );
      if (completed % 10 === 0 || completed === pages.length) {
        writeReport(args, manifest, results.filter(Boolean));
      }
    }
  }

  try {
    await Promise.all(
      Array.from({length: Math.min(args.workers, pages.length)}, (_, index) =>
        worker(index + 1)
      )
    );
  } finally {
    await browser.close().catch(() => undefined);
  }

  const summary = writeReport(args, manifest, results.filter(Boolean));
  console.log(JSON.stringify({outDir: args.outDir, counts: summary.counts}, null, 2));
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
