/**
 * SDK chunk contract mirrored from the publish-sdk deps-pack rules in fis-conf.js.
 * Keep this file data-only so the future Rollup/Vite SDK builder and the
 * current FIS3 contract checker can share one source of truth.
 */

const sdkChunkPlan = {
  entry: 'sdk.js',
  optionalChunks: ['fomula-doc.js'],
  chunks: {
    'sdk.js': [
      'examples/mod.js',
      'examples/embed.tsx',
      'examples/embed.tsx:deps',
      'examples/loadMonacoEditor.ts',
      '!mpegts.js/**',
      '!hls.js/**',
      '!froala-editor/**',
      '!codemirror/**',
      '!tinymce/**',
      '!zrender/**',
      '!echarts/**',
      '!echarts-stat/**',
      '!echarts-wordcloud/**',
      '!papaparse/**',
      '!exceljs/**',
      '!xlsx/**',
      '!docsearch.js/**',
      '!monaco-editor/**.css',
      '!amis-ui/lib/components/RichText.js',
      '!amis-ui/lib/components/Tinymce.js',
      '!amis-ui/lib/components/ColorPicker.js',
      '!amis-ui/lib/components/PdfViewer.js',
      '!react-pdf/**',
      '!pdfjs-dist/**',
      '!react-color/**',
      '!material-colors/**',
      '!reactcss/**',
      '!tinycolor2/**',
      '!cropperjs/**',
      '!@uiw/react-json-view/**',
      '!react-cropper/**',
      '!jsbarcode/**',
      '!amis-ui/lib/components/BarCode.js',
      '!amis-ui/lib/renderers/Form/CityDB.js',
      '!amis-ui/lib/components/Markdown.js',
      '!amis-core/lib/utils/markdown.js',
      '!highlight.js/**',
      '!entities/**',
      '!linkify-it/**',
      '!mdurl/**',
      '!uc.micro/**',
      '!markdown-it/**',
      '!markdown-it-html5-media/**',
      '!punycode/**',
      '!office-viewer/**',
      '!numfmt/**',
      '!amis-formula/lib/doc.js'
    ],
    'rich-text.js': ['amis-ui/lib/components/RichText.js', 'froala-editor/**'],
    'tinymce.js': ['amis-ui/lib/components/Tinymce.js', 'tinymce/**'],
    'codemirror.js': ['codemirror/**'],
    'papaparse.js': ['papaparse/**'],
    'exceljs.js': ['exceljs/**'],
    'xlsx.js': ['xlsx/**'],
    'markdown.js': [
      'amis-ui/lib/components/Markdown.js',
      'highlight.js/**',
      'entities/**',
      'linkify-it/**',
      'mdurl/**',
      'uc.micro/**',
      'markdown-it/**',
      'markdown-it-html5-media/**',
      'punycode/**'
    ],
    'color-picker.js': [
      'amis-ui/lib/components/ColorPicker.js',
      'react-color/**',
      'material-colors/**',
      'reactcss/**',
      'tinycolor2/**'
    ],
    'pdf-viewer-shared.js': ['amis-ui/lib/components/Input.js', 'clsx/**'],
    'pdf-viewer.js': ['amis-ui/lib/components/PdfViewer.js', 'react-pdf/**'],
    'cropperjs.js': ['cropperjs/**', 'react-cropper/**'],
    'barcode.js': ['src/components/BarCode.tsx', 'jsbarcode/**'],
    'charts.js': [
      'zrender/**',
      'echarts/**',
      'echarts-stat/**',
      'echarts-wordcloud/**'
    ],
    'office-viewer.js': ['office-viewer/**', 'numfmt/**'],
    'json-view.js': ['@uiw/react-json-view/**'],
    // Preserve the historical output typo. Renaming it would be an SDK break.
    'fomula-doc.js': ['amis-formula/lib/doc.js'],
    'rest.js': [
      '*.js',
      '!monaco-editor/**',
      '!codemirror/**',
      '!mpegts.js/**',
      '!hls.js/**',
      '!froala-editor/**',
      '!react-pdf/**',
      '!pdfjs-dist/**',
      '!amis-ui/lib/components/RichText.js',
      '!zrender/**',
      '!echarts/**',
      '!echarts-wordcloud/**',
      '!papaparse/**',
      '!exceljs/**',
      '!xlsx/**',
      '!highlight.js/**',
      '!argparse/**',
      '!entities/**',
      '!linkify-it/**',
      '!mdurl/**',
      '!uc.micro/**',
      '!markdown-it/**',
      '!markdown-it-html5-media/**',
      '!office-viewer/**',
      '!numfmt/**'
    ]
  }
};

const sdkCssFiles = [
  'sdk.css',
  'cxd.css',
  'prismui.css',
  'ang.css',
  'dark.css',
  'antd.css',
  'helper.css'
];

const sdkIe11CssFiles = [
  'sdk-ie11.css',
  'cxd-ie11.css',
  'prismui-ie11.css',
  'ang-ie11.css',
  'dark-ie11.css',
  'antd-ie11.css',
  'ie11-patch.css'
];

const sdkStaticFiles = [
  'iconfont.css',
  'iconfont.eot',
  'iconfont.svg',
  'iconfont.ttf',
  'iconfont.woff',
  'locale/de-DE.js',
  'thirds/hls.js/hls.js',
  'thirds/mpegts.js/mpegts.js',
  'thirds/monaco-editor/min/vs/loader.js',
  'thirds/monaco-editor/min/vs/editor/editor.main.js',
  'thirds/monaco-editor/min/vs/base/worker/workerMain.js',
  'thirds/pdfjs-dist/build/pdf.worker.min.mjs'
];

module.exports = {
  sdkChunkPlan,
  sdkCssFiles,
  sdkIe11CssFiles,
  sdkStaticFiles
};
