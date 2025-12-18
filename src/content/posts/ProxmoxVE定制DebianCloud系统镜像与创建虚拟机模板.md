---
title: Proxmox VE 定制 Debian Cloud 系统镜像与创建虚拟机模板
published: 2025-12-13
description: ''
image: 'https://picsur.kbxx.cc/i/c394679b-eb68-46d3-ae96-152d5df2fa25.webp'
tags: [Linux, ProxmoxVE, Debian]
category: '笔记'
draft: false 
lang: ''
---

### 前言
> 因为经常折腾pve虚拟机，经常需要新的环境，之前一直使用 Debian 的标准镜像安装，安装完部署环境时真的让人头大,直到我关注到了 Debian 的云镜像。云镜像可以大大简化安装过程，节省时间，并且可高度自定义。本文档将详细介绍如何为 Proxmox VE 定制 DebianCloud 系统镜像，并创建虚拟机模板。
### 选择合适的 DebianCloud 镜像
“云镜像”有这几种：azure、ec2、generic、genericcloud、nocloud。
- 首先排除 azure 与 ec2（它们针对云平台）。
- nocloud 不支持 cloud‑init，也可排除。
- 剩下 generic 和 genericcloud：
    - genericcloud 更精简，常被推荐用于虚拟机；
    - 但它可能不包含 USB 等内核模块，如果需要 USB 直通（打印机、移动硬盘等），建议用 generic，家庭用户更合适。
### 定制镜像
准备一台 Debian 系统的虚拟机，要代理网络，避免网络原因造成定制失败，内存的话最好在 4G 以上。
安装必要的软件包：
```bash
apt update
apt install libguestfs-tools
```
下载官方原版的 qcow2 镜像
```bash
wget -c https://cdimage.debian.org/images/cloud/trixie/latest/debian-13-generic-amd64.qcow2
```
下面是我定制 Debian 的命令，可以根据需要修改：
```bash
virt-customize -a debian-13-generic-amd64.qcow2 \
  --smp 2 --verbose \
  --timezone "Asia/Shanghai" \
  --append-line "/etc/default/grub:# disables OS prober to avoid loopback detection which breaks booting" \
  --append-line "/etc/default/grub:GRUB_DISABLE_OS_PROBER=true" \
  --run-command "update-grub" \
  --run-command "sed -i 's|Types: deb deb-src|Types: deb|g' /etc/apt/sources.list.d/debian.sources" \
  --run-command "sed -i 's|generate_mirrorlists: true|generate_mirrorlists: false|g' /etc/cloud/cloud.cfg.d/01_debian_cloud.cfg" \
  --update --install "zsh,wget,curl,nano,vim,sudo,git,unzip,mtr-tiny,iputils-ping,bind9-host,dnsutils,net-tools,lsb-release,ca-certificates,bash-completion,fail2ban,dialog,netbase,iproute2,whois,ssh,dbus,systemd,systemd-sysv,locales,apt-utils,gnupg2,apt-transport-https,rsyslog,logrotate,less,rsync,qemu-guest-agent,haveged,systemd-timesyncd" \
  --run-command "install -m 0755 -d /etc/apt/keyrings" \
  --run-command "curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg" \
  --run-command "chmod a+r /etc/apt/keyrings/docker.gpg" \
  --run-command "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable\" > /etc/apt/sources.list.d/docker.list" \
  --run-command "apt-get -y autoremove --purge && apt-get -y clean" \
  --run-command "chsh -s /usr/bin/zsh root" \
  --run-command "git clone https://github.com/ohmyzsh/ohmyzsh.git /root/.oh-my-zsh" \
  --run-command "cp /root/.oh-my-zsh/templates/zshrc.zsh-template /root/.zshrc" \
  --run-command "mkdir -p /root/.oh-my-zsh/custom/themes" \
  --run-command "curl -fsSL -o /root/.oh-my-zsh/custom/themes/kongbai.zsh-theme 'https://alist.kbxx.cc/d/Bianco-nas/home/%E8%BD%AF%E4%BB%B6/Linux%E8%84%9A%E6%9C%AC/zsh%E4%B8%BB%E9%A2%98/kongbai.zsh-theme?sign=bpMr7CpBl2rxkQIrUQgE1fD_2QIPrzPiemd2lKjVmAg=:0'" \
  --run-command "sed -i 's/^ZSH_THEME=.*/ZSH_THEME=\"kongbai\"/' /root/.zshrc" \
  --run-command "sed -i 's/^#\?\s*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sed -i 's/^#\?\s*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config" \
  --append-line "/etc/systemd/timesyncd.conf:NTP=ntp.aliyun.com" \
  --delete "/var/log/*.log" \
  --delete "/var/lib/apt/lists/*" \
  --delete "/var/cache/apt/*" \
  --truncate "/etc/apt/mirrors/debian.list" \
  --append-line "/etc/apt/mirrors/debian.list:https://mirrors.tuna.tsinghua.edu.cn/debian" \
  --truncate "/etc/apt/mirrors/debian-security.list" \
  --append-line "/etc/apt/mirrors/debian-security.list:https://mirrors.tuna.tsinghua.edu.cn/debian-security" \
  --truncate "/etc/machine-id"
```
具体做了这些操作：
- 设置时区为上海时间；
- 禁用 GRUB 的 OS prober，避免引导问题；
- 修改 APT 源为清华大学镜像源，加快软件包下载速度；
- 添加最新版 Docker 官方源；
- 安装常用软件包；
- 设置 root 用户默认 shell 为 zsh，并安装 Oh My Zsh 及自定义主题；
- 修改 SSH 配置，允许 root 登录和密码认证；
- 配置系统时间同步使用阿里云 NTP 服务器；
- 清理日志和缓存，减小镜像体积；
- 清空 machine-id，确保每个实例启动时生成唯一的 ID。

最后，压缩定制好的镜像：
```bash
virt-sparsify --compress debian-13-generic-amd64.qcow2 debian-13-generic-amd64-bianco.qcow2
```
### 创建 Proxmox VE 虚拟机模板
创建虚拟机，VM ID 最好大一些，避免冲突，名称随意。
![创建虚拟机](https://picsur.kbxx.cc/i/733a6e96-3031-4866-a875-e299ea39d660.webp)
因为我们是使用云镜像所以这里选择 “不使用任何介质”。
![alt text](https://picsur.kbxx.cc/i/929d429b-9ed8-4103-807b-5b669b5b179c.webp)
机型可以选择 “q35”，BIOS 选择 “OVMF (UEFI)”，最重要的是勾选 “Qemu 代理”，可以和虚拟机内安装的 qemu-guest-agent 交互。
![alt text](https://picsur.kbxx.cc/i/6f084cc1-003b-4302-8145-5e5f2dff6f6d.webp)
磁盘这里可以直接删掉默认创建的磁盘，后面我们会把镜像转换成磁盘使用。
![alt text](https://picsur.kbxx.cc/i/778f8804-d8c1-40dc-803b-435299eeb7cc.webp)
CPU 和内存最小就行，后面可以根据需要调整。
![alt text](https://picsur.kbxx.cc/i/5f399cab-6da3-462a-ba87-aa24084a3d23.webp)
![alt text](https://picsur.kbxx.cc/i/1173ef72-58c0-4c23-b965-898b72f5085a.webp)
网络默认桥接，关闭防火墙。
![alt text](https://picsur.kbxx.cc/i/df666089-c1c6-40be-bf82-ce0caf8505bf.webp)
创建完成后，不要启动虚拟机，进入 shell，把定制好的镜像上传到 root 用户根目录，然后转换成虚拟机磁盘格式：
```bash
qm importdisk 100000 /tmp/debian-13-generic-amd64-zc.qcow2 local-lvm --format=qcow2
```
- 100000 是刚才创建的虚拟机 VM ID
- /tmp/debian-13-generic-amd64-zc.qcow2 是上传的定制镜像路径
- local-lvm 是存储名称，根据实际情况修改
- --format=qcow2 指定镜像格式

然后回到虚拟机把未使用的磁盘添加到虚拟机。
![alt text](https://picsur.kbxx.cc/i/d756ec82-ac67-4546-886c-315516a7027c.webp)
更改启动顺序，把新添加的磁盘设置为第一启动项。
![alt text](https://picsur.kbxx.cc/i/bc7c34c2-5c6f-4186-bab2-bfa73ae47ee5.webp)
添加 Cloud-Init 驱动器，类型选择 “CloudInit”，总线选择 “SCSI”。
![alt text](https://picsur.kbxx.cc/i/378e8671-bc8e-4714-81af-2160229c992c.webp)
![alt text](https://picsur.kbxx.cc/i/9efc8ba5-dbd6-4dca-84d5-b5d2e58a012d.webp)
最后配置一下 Cloud-Init 选项，设置好 IP ，用户，密码和 SSH 密钥等，保存后就可以右键虚拟机，选择 “转换为模板”，之后你就可以看到你的模板了。以后需要创建虚拟机时，直接右键模板克隆就行，非常方便。
![alt text](https://picsur.kbxx.cc/i/da02e58a-89c5-408f-9fb9-6c3534671e48.webp)

### ps：
这里着重说一下如何扩容硬盘，点击你的硬盘，然后选择磁盘操作里的 “调整大小”，初始硬盘为 3G，输入的数字为增量，例如扩容到 10G，则需要在弹出的窗口中填写 7G。
![alt text](https://picsur.kbxx.cc/i/38704628-8b5c-41d4-be7c-814938e22060.webp)

扩容完成后，启动虚拟机，登录系统，使用以下命令查看当前磁盘情况：
```bash
lsblk
```

### 参考资料
- https://blog.skk.moe/post/proxmox-ve-customize-debian-cloud-image/
- https://zhichao.org/posts/b7239f
