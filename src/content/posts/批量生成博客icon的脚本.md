---
title: 批量生成博客icon的脚本
published: 2025-12-19
description: ''
image: ''
tags: [macOS, shell]
category: '脚本'
draft: false 
lang: ''
---

>因为要给博客换 icon ，写了这个一键生成所有大小 icon 的脚本，可以把正常大小的图源转换成32 / 128 / 180 / 192 大小的 icon ，支持单张图源同时生成 dark/light 两套 icon 。

:::note[PS：]
仅在 macOS 端测试正常，不代表其他平台。
:::

## 脚本：make-favicons.sh
把下面内容保存成 make-favicons.sh：
```sh
#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="./favicons"
DARK_SRC=""
LIGHT_SRC=""
ONE_SRC=""

SIZES=(32 128 180 192)

die() { echo "Error: $*" >&2; exit 1; }

# 参数解析
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--out)
      OUT_DIR="${2:-}"; shift 2;;
    --dark)
      DARK_SRC="${2:-}"; shift 2;;
    --light)
      LIGHT_SRC="${2:-}"; shift 2;;
    -h|--help)
      sed -n '1,60p' "$0"; exit 0;;
    *)
      if [[ -z "$ONE_SRC" ]]; then ONE_SRC="$1"; shift
      else die "多余参数：$1"
      fi;;
  esac
done

# 校验输入
if [[ -n "$ONE_SRC" ]]; then
  [[ -f "$ONE_SRC" ]] || die "找不到文件：$ONE_SRC"
  DARK_SRC="$ONE_SRC"
  LIGHT_SRC="$ONE_SRC"
else
  [[ -n "$DARK_SRC" && -n "$LIGHT_SRC" ]] || die "请提供一张源图，或同时提供 --dark 和 --light"
  [[ -f "$DARK_SRC" ]] || die "找不到文件：$DARK_SRC"
  [[ -f "$LIGHT_SRC" ]] || die "找不到文件：$LIGHT_SRC"
fi

mkdir -p "$OUT_DIR"

# 用 sips 生成 PNG，并强制缩放到指定尺寸（正方形）
gen_set() {
  local src="$1"
  local theme="$2"

  for size in "${SIZES[@]}"; do
    local out="$OUT_DIR/favicon-${theme}-${size}.png"

    # 先转成 png 到临时文件，再缩放，避免源文件不是 png 时的坑
    local tmp
    tmp="$(mktemp "/tmp/favicon_${theme}_XXXXXX.png")"
    sips -s format png "$src" --out "$tmp" >/dev/null

    # 缩放到正方形 size x size
    sips -z "$size" "$size" "$tmp" --out "$out" >/dev/null
    rm -f "$tmp"

    echo "✅ $out"
  done
}

gen_set "$DARK_SRC" "dark"
gen_set "$LIGHT_SRC" "light"

echo "Done. Output => $OUT_DIR"
```

## 使用方法
### （1）一张头像同时生成两套（最常见）
```bash
chmod +x make-favicons.sh
./make-favicons.sh avatar.png
```
### （2）分别用两张源图生成 dark/light
```bash
chmod +x make-favicons.sh
./make-favicons.sh --dark avatar-dark.png --light avatar-light.png
```
### （3） 指定输出目录（默认 ./favicons）
```bash
chmod +x make-favicons.sh
./make-favicons.sh avatar.png -o ./public
```