#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GH_PAGES_DIR="${GH_PAGES_DIR:-$ROOT_DIR/.worktrees/gh-pages}"

if [[ "$GH_PAGES_DIR" != /* ]]; then
  GH_PAGES_DIR="$ROOT_DIR/$GH_PAGES_DIR"
fi

HOMEPAGE_SOURCE_DIR="${HOMEPAGE_SOURCE_DIR:-$GH_PAGES_DIR/website}"

if [[ "$HOMEPAGE_SOURCE_DIR" != /* ]]; then
  HOMEPAGE_SOURCE_DIR="$ROOT_DIR/$HOMEPAGE_SOURCE_DIR"
fi

if [[ ! -d "$GH_PAGES_DIR" ]]; then
  echo "Missing gh-pages worktree: $GH_PAGES_DIR" >&2
  echo "Create it with: git worktree add .worktrees/gh-pages gh-pages" >&2
  exit 1
fi

if [[ ! -e "$GH_PAGES_DIR/.git" ]]; then
  echo "Refusing to deploy outside a git worktree: $GH_PAGES_DIR" >&2
  exit 1
fi

if [[ ! -d "$HOMEPAGE_SOURCE_DIR" ]]; then
  echo "Missing homepage source: $HOMEPAGE_SOURCE_DIR" >&2
  exit 1
fi

export GH_PAGES_DIR

cd "$ROOT_DIR"

echo "building docs into $GH_PAGES_DIR"
node "$ROOT_DIR/scripts/generate-search-data.js"

./node_modules/.bin/fis3 release gh-pages -c

GH_PAGES_DOCS_DIR="$GH_PAGES_DIR/docs"
GH_PAGES_SDK_DIR="$GH_PAGES_DIR/sdk"

# 拷贝一份兼容之前的访问路径
mkdir -p "$GH_PAGES_DOCS_DIR/docs"
cp -R "$GH_PAGES_DOCS_DIR/zh-CN/docs/." "$GH_PAGES_DOCS_DIR/docs/"

cp "$ROOT_DIR/packages/amis/schema.json" "$GH_PAGES_DOCS_DIR"

cp -R "$ROOT_DIR/mock" "$GH_PAGES_DOCS_DIR/"

tar -zcf "$GH_PAGES_DOCS_DIR/sdk.tar.gz" packages/amis/sdk

# 首页发布 SDK 入口及 resource map 引用的根级 chunks，不复制 thirds 等可选目录。
mkdir -p "$GH_PAGES_SDK_DIR"
cp "$ROOT_DIR"/packages/amis/sdk/*.js "$GH_PAGES_SDK_DIR/"
cp "$ROOT_DIR/packages/amis/sdk/sdk.css" "$GH_PAGES_SDK_DIR/"
cp "$ROOT_DIR/packages/amis/sdk/helper.css" "$GH_PAGES_SDK_DIR/"
cp "$ROOT_DIR"/packages/amis/sdk/iconfont.* "$GH_PAGES_SDK_DIR/"

# 首页源文件维护在 gh-pages worktree 内，最终与文档应用在同一个 Pages 目录中汇合。
cp -R "$HOMEPAGE_SOURCE_DIR/." "$GH_PAGES_DIR/"

# 加这个 github page 就不会忽略下划线开头的文件
touch "$GH_PAGES_DIR/.nojekyll"

# GitHub Pages custom domain for prismui.io.
echo prismui.io > "$GH_PAGES_DIR/CNAME"
