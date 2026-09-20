---
title: 用 RouterOS 限制 IPv6 出海访问 让海外应用回落 IPv4
published: 2026-8-22
description: ''
image: 'https://picsur.kbxx.cc/i/7069d930-eabd-4ee5-b499-a2eccedc9dff.webp'
tags: [RouterOS]
category: '随记'
draft: false 
lang: ''
---

# 用 RouterOS 限制 IPv6 出海访问 让海外应用回落 IPv4

## 前言

​    在 RouterOS 与 daed 配合使用的过程中，我遇到了一个与 IPv6 相关的问题：开启 IPv6 后，许多应用会优先尝试通过 IPv6 连接。通常，如果 IPv6 连接失败，应用会回退到 IPv4；但部分服务会先依据 IPv6 地址判断地区。例如，ChatGPT 检测到 IPv6 地址不在服务范围内后，会直接提示“ChatGPT 在您所在的地区不可用”，而不会继续尝试 IPv4。我曾尝试将运营商下发的 IPv6 PD 交给 daed 处理，也在 RouterOS 上通过 OSPF 做分流。但前者在 daed 部署于 Debian 时配置较复杂，后者未能达到预期效果。

​    后来我换了一个更直接的思路：既然没有可用的 IPv6 出海线路，就不必让内网设备尝试访问海外 IPv6。具体做法是仅放行中国境内的 IPv6 地址，丢弃其他 IPv6 流量。这样，当应用尝试连接海外 IPv6 地址时会立即失败，从而触发其自身的回退机制改用 IPv4。

​    该方案不需要将 IPv6 PD 接入代理，也不依赖复杂的路由策略。它只限制 LAN 主动发起的非中国 IPv6 访问，路由器自身的 IPv6 流量不受这条 forward 链规则影响。

## 防火墙规则

完整的参考规则集如下（包含输入链和转发链的基础防护，以及放行国内 IPv6 和丢弃非国内 IPv6 的部分）：

```routeros
/ipv6 firewall filter
add action=accept chain=input comment="Allow established/related" connection-state=established,related,untracked
add action=drop chain=input comment="Drop invalid" connection-state=invalid
add action=accept chain=input comment="Allow ICMPv6" protocol=icmpv6
add action=accept chain=input comment="Allow DHCPv6-PD" dst-port=546 protocol=udp src-address=fe80::/10
add action=accept chain=input comment="Allow LAN to router" in-interface-list=LAN
add action=drop chain=input comment="Drop WAN to router" in-interface-list=WAN
add action=accept chain=forward comment="Allow established/related" connection-state=established,related,untracked
add action=drop chain=forward comment="Drop invalid" connection-state=invalid
add action=accept chain=forward comment="Allow ICMPv6" protocol=icmpv6
add action=accept chain=forward comment="Allow China IPv6" dst-address-list=CN_IPv6 in-interface-list=LAN
add action=drop chain=forward comment="Block non-China IPv6" in-interface-list=LAN out-interface-list=WAN
add action=accept chain=forward comment="Allow LAN outbound" disabled=yes in-interface-list=LAN
add action=drop chain=forward comment="Drop unsolicited WAN to LAN" in-interface-list=WAN
```
其中最关键的是：

```routeros
add action=accept chain=forward comment="Allow China IPv6" dst-address-list=CN_IPv6 in-interface-list=LAN
add action=drop chain=forward comment="Block non-China IPv6" in-interface-list=LAN out-interface-list=WAN
```

规则顺序不能颠倒：必须先允许访问 `CN_IPv6`，再丢弃其他从 LAN 发往 WAN 的 IPv6 流量。
## 自动更新 CN_IPv6 地址列表

以下脚本从 IPdeny 下载中国 IPv6 聚合前缀，先写入临时列表，校验数量后再替换正式列表，避免下载异常时清空现有规则。

```routeros
# ============================================================
# Update China IPv6 address-list from IPdeny
# RouterOS 7.14+
# ============================================================

:local url "https://www.ipdeny.com/ipv6/ipaddresses/aggregated/cn-aggregated.zone"
:local fileName "cn-ipv6.zone"
:local targetList "CN_IPv6"
:local stageList "CN_IPv6_STAGE"
:local chunkSize 32768

:log info "CN-IPv6: starting update"

# 删除旧下载文件
:if ([:len [/file find name=$fileName]] > 0) do={
    /file remove [find name=$fileName]
}

# 删除上次残留的临时列表
/ipv6 firewall address-list remove [find list=$stageList]

# 下载
:do {
    /tool fetch \
        url=$url \
        dst-path=$fileName \
        keep-result=yes \
        duration=30s
} on-error={
    :log error "CN-IPv6: download failed"
    :error "Download failed"
}

:delay 1s

:if ([:len [/file find name=$fileName]] = 0) do={
    :log error "CN-IPv6: file not found"
    :error "File not found"
}

:local fileSize [/file get [find name=$fileName] size]

:log info ("CN-IPv6: downloaded, size=" . $fileSize)

# 文件异常保护
:if ($fileSize < 10000) do={
    /file remove [find name=$fileName]
    :log error "CN-IPv6: downloaded file too small"
    :error "Invalid file"
}

# ============================================================
# 分块解析
# 文件内容本身就是：
#
# 2001:xxxx::/32
# 2400:xxxx::/32
# ...
#
# ============================================================

:local offset 0
:local pending ""

:while ($offset < $fileSize) do={

    :local result [/file/read \
        file=$fileName \
        offset=$offset \
        chunk-size=$chunkSize \
        as-value]

    :local data ($result->"data")

    :if ([:len $data] = 0) do={
        :set offset $fileSize
    } else={

        :local buffer ($pending . $data)
        :local pos 0
        :local nl [:find $buffer "\n" $pos]

        :while ([:typeof $nl] != "nil") do={

            :local line [:pick $buffer $pos $nl]

            # 去掉 CR
            :if ([:len $line] > 0) do={
                :if ([:pick $line ([:len $line] - 1) [:len $line]] = "\r") do={
                    :set line [:pick $line 0 ([:len $line] - 1)]
                }
            }

            :if ([:len $line] > 2) do={

                :do {
                    /ipv6 firewall address-list add \
                        list=$stageList \
                        address=$line \
                        comment="CN-IPdeny"
                } on-error={
                    :log warning ("CN-IPv6: failed " . $line)
                }
            }

            :set pos ($nl + 1)
            :set nl [:find $buffer "\n" $pos]
        }

        :set pending [:pick $buffer $pos [:len $buffer]]

        :set offset ($offset + [:len $data])
    }
}

# 最后一行
:if ([:len $pending] > 2) do={

    :do {
        /ipv6 firewall address-list add \
            list=$stageList \
            address=$pending \
            comment="CN-IPdeny"
    } on-error={}
}

# ============================================================
# 检查结果
# ============================================================

:local count [/ipv6 firewall address-list print count-only where list=$stageList]

:log info ("CN-IPv6: parsed prefixes=" . $count)

# 防止下载异常导致清空旧列表
:if ($count < 100) do={

    :log error ("CN-IPv6: invalid list, count=" . $count)

    /ipv6 firewall address-list remove [find list=$stageList]

    :if ([:len [/file find name=$fileName]] > 0) do={
        /file remove [find name=$fileName]
    }

    :error "CN IPv6 update rejected"
}

# ============================================================
# 替换正式列表
# ============================================================

/ipv6 firewall address-list remove [find list=$targetList]

:foreach id in=[/ipv6 firewall address-list find list=$stageList] do={
    /ipv6 firewall address-list set $id list=$targetList
}

# 删除下载文件
/file remove [find name=$fileName]

:local finalCount [/ipv6 firewall address-list print count-only where list=$targetList]

:log info ("CN-IPv6: update completed, prefixes=" . $finalCount)
```

建议将脚本加入 RouterOS Scheduler，定期更新 `CN_IPv6`。更新频率不必过高，每周或每月一次通常足够。