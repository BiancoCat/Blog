---
title: 如何本地激活 Synology Active Backup for Business 等套件
published: 2025-11-22
description: ''
image: 'https://dev.moe/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2025/05/image-1.png.webp'
tags: [Synology]
category: '随记'
draft: false 
lang: ''
---

# 如何本地激活 Synology Active Backup for Business 等套件
---
Synology（群晖）DSM 的 Synology Active Backup for Business 套件是一个很不错的备份方案，但是首次安装或是重装该套件后，需要使用 Synology 账户激活才能使用。

我并不喜欢这种需要联网激活才能使用的本地软件 —— 如果某天服务器故障或下线，亦或是本地网络发生了故障，我又正好重装了该软件，就会被这个激活界面阻挡，成为正版受害者。

网上流传了不少本地激活这类套件的方法，但都比较复杂，因此花时间研究了下，写了一个简单且通用的激活方案，以备不时之需。
>请注意，使用本方法本地激活可能会影响您的产品支持和服务。尤其是在企业环境下，建议使用正常方式联网激活，以确保正常享受支持和服务。
## 教程
本方法支持本地激活 Synology Active Backup for Business、Synology AI Console 等套件。

1. 打开套件，进入激活页面/弹窗
2. 打开浏览器的开发者工具（F12）-> Console，粘贴以下代码并回车应用

```
const oldWindowOpen = window.open
window.open = (...args) => {
    const [url] = args
    if (url?.startsWith('https://activation.synology.com/package')) {
        const u = new URL(url)
        setTimeout(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: {
                    source: u.searchParams.get('package_name'),
                    package_name: u.searchParams.get('package_name'),
                    request_id: u.searchParams.get('request_id')
                },
                origin: "https://activation.synology.com"
            }))
        }, 100)
        setTimeout(() => {
            alert('Activation finished, please refresh the page.')
            window.open = oldWindowOpen
        }, 1000)
    } else {
        alert('Activation failed.')
    }
}
```
3. 点击激活按钮，激活完成。
---
>本文（https://dev.moe/3120）由 Coxxs 原创，转载请注明原文链接。
