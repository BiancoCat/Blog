---
title: acme.sh学习笔记
published: 2025-03-26
description: ''
image: 'https://picsur.kbxx.cc/i/f9e10747-7f6c-4120-b496-a82cc183c939.webp'
tags: [Linux, SSL证书]
category: '笔记'
draft: false 
lang: ''
---
>- 最近证书有效期时间越来越短，自动化申请和续期SSL证书变得越来越重要，acme.sh是一个非常流行的轻量级工具，用于自动化管理证书的申请和续期。本文记录了acme.sh的安装、配置及使用方法。

# acme.sh

acme.sh 实现了 acme 协议，可以从 ZeroSSL，Let's Encrypt 等 CA 生成免费的证书。  
> 参考文档 https://github.com/acmesh-official/acme.sh/wiki/%E8%AF%B4%E6%98%8E

1. 安装  
``` 
wget -O -  https://get.acme.sh | sh 
```

2. 通用证书申请  
```
export CF_Token="fC4XOyTvYNUvxzsuSBNKn6uaEnqO1FOVSMN1vdL6"
acme.sh --set-default-ca --server letsencrypt
acme.sh --issue --dns dns_cf -d bianco.cat -d '*.bianco.cat'
```

3. 证书复制  
```
acme.sh --install-cert -d bianco.cat -d '*.bianco.cat' \
--key-file       /etc/nginx/ssl/bianco.cat.key  \
--fullchain-file /etc/nginx/ssl/bianco.cat.cer \
--reloadcmd     "service nginx reload"
```
> 如果参数包含特殊字符（比如 * 或 &），使用引号可以防止它们被 Shell 解释。例如 *.bianco.cat 中的 * 是通配符，所以如果不加引号，Shell 会试图将其展开为匹配的文件名，而不是传递字面上的通配符。

- acme.sh --install-cert 命令中的 --reloadcmd 参数可以继续添加其他命令。--reloadcmd 用于在证书安装完成后执行某个自定义的命令，例如重新加载服务或执行其他脚本。  
- 你可以将多个命令通过 && 或 ; 连接起来，这样它们就会在 --reloadcmd 后依次执行。例如：  

```
acme.sh --install-cert -d example.com \
--key-file       /path/to/keyfile/in/nginx/key.pem  \
--fullchain-file /path/to/fullchain/nginx/cert.pem \
--reloadcmd     "service nginx reload && systemctl restart some-other-service"
```

- 在这个例子中，--reloadcmd 会先执行 service nginx reload，然后执行 systemctl restart some-other-service。  
- 另外，你还可以执行任何你需要的脚本或命令，只要它们在命令行中是合法的。例如：  

```
acme.sh --install-cert -d example.com \
--key-file       /path/to/keyfile/in/nginx/key.pem  \
--fullchain-file /path/to/fullchain/nginx/cert.pem \
--reloadcmd     "/path/to/your/script.sh && service nginx reload"
```

- 这样，/path/to/your/script.sh 脚本会在 Nginx 重载之前执行。  