#!/bin/bash
set -e

export NODE_ENV=production
SDK_BUILDER=${AMIS_SDK_BUILDER:-rollup}

if [ "$SDK_BUILDER" != "rollup" ] && [ "$SDK_BUILDER" != "fis3" ]; then
  echo "Unsupported AMIS_SDK_BUILDER: $SDK_BUILDER. Use rollup or fis3."
  exit 1
fi

rm -rf esm
rm -rf lib
rm -rf output

echo "===rollup build==="
NODE_ENV=production ../../node_modules/.bin/rollup -c

# 从 amis-ui 中复制 css
mkdir -p lib/themes
cp ../../node_modules/amis-ui/lib/themes/ang.css lib/themes/ang.css
cp ../../node_modules/amis-ui/lib/themes/dark.css lib/themes/dark.css
cp ../../node_modules/amis-ui/lib/themes/antd.css lib/themes/antd.css
cp ../../node_modules/amis-ui/lib/themes/cxd.css lib/themes/cxd.css
cp ../../node_modules/amis-ui/lib/themes/cxd.css lib/themes/prismui.css
cp ../../node_modules/amis-ui/lib/themes/default.css lib/themes/default.css
cp ../../node_modules/amis-ui/lib/helper.css lib/helper.css

# 生成 sdk
if [ "$SDK_BUILDER" = "fis3" ]; then
  echo "===fis sdk==="
  rm -rf sdk && ../../node_modules/.bin/fis3 release publish-sdk -c -f ../../fis-conf.js

  cp -r ../../node_modules/monaco-editor/min/vs/base/browser sdk/thirds/monaco-editor/min/vs/base

  #pdfjs worker js
  cp -r ../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs sdk/thirds/pdfjs-dist/build/pdf.worker.min.mjs
else
  echo "===rollup sdk==="
  node ../../scripts/sdk-build/build-sdk-next.js --mode rollup-sdk
fi

echo "===postcss ie11==="
# 生成去掉变量的 css，动画设置为零
cat lib/themes/cxd.css | ../../node_modules/.bin/postcss >lib/themes/cxd-ie11.css
cat lib/themes/ang.css | ../../node_modules/.bin/postcss >lib/themes/ang-ie11.css
cat lib/themes/dark.css | ../../node_modules/.bin/postcss >lib/themes/dark-ie11.css
cat lib/themes/antd.css | ../../node_modules/.bin/postcss >lib/themes/antd-ie11.css
cp lib/themes/cxd-ie11.css lib/themes/prismui-ie11.css
cp lib/themes/cxd-ie11.css lib/themes/default-ie11.css

if [ "$SDK_BUILDER" = "fis3" ]; then
  printf ':root { --animation-duration: 0s;}\n' >sdk/ie11-patch.css
  cat sdk/sdk.css sdk/ie11-patch.css | ../../node_modules/.bin/postcss >sdk/sdk-ie11.css
  cat sdk/ang.css sdk/ie11-patch.css | ../../node_modules/.bin/postcss >sdk/ang-ie11.css
  cat sdk/dark.css sdk/ie11-patch.css | ../../node_modules/.bin/postcss >sdk/dark-ie11.css
  cat sdk/antd.css sdk/ie11-patch.css | ../../node_modules/.bin/postcss >sdk/antd-ie11.css

  # cxd 是默认主题，同时保留 sdk.css 作为聚合入口
  cp sdk/sdk.css sdk/cxd.css
  cp sdk/sdk-ie11.css sdk/cxd-ie11.css
  cp sdk/sdk.css sdk/prismui.css
  cp sdk/sdk-ie11.css sdk/prismui-ie11.css

  cp ./lib/helper.css sdk/helper.css
  # cp ./lib/helper.css.map sdk/helper.css.map
  cp ../../examples/static/iconfont.* sdk/

  mkdir sdk/locale

  echo "===sdk locale==="
  node ../../scripts/generate-sdk-locale.js ../amis-ui/src/locale/de-DE.ts >sdk/locale/de-DE.js
fi

echo "===build-schemas==="
npm run build-schemas
