# chrome-plugin-sync-cookie
Synchronize cookies from another address to solve the cross domain cookie problem caused by samesite

## What's this?
这是一个

```
可以从另一个地址同步 cookie 到当前地址从而解决由于 samesite 引起的跨域 cookie 问题的
```
chrome 插件

## TODO:
- [X] 从目标地址 example.com 同步 cookie 到 my.example.com
- [ ] 监听目标地址 example.com 的 cookie 变化，实时同步到 my.example.com
- [ ] 可指定特定 name 的 cookie 同步
- [ ] 自动校验目标地址 cookie 过期时间，如需要登录等操作则自动打开目标地址
