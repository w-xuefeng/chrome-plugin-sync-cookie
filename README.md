# chrome-plugin-sync-cookie
Synchronize cookies from another address to solve the cross domain cookie problem caused by samesite

## TODO
- [X] 从目标地址 example.com 同步 cookie 到 my.example.com
- [ ] 监听目标地址 example.com 的 cookie 变化，实时同步到 my.example.com
- [ ] 可指定特定 name 的 cookie 同步
- [ ] 自动校验目标地址 cookie 过期时间，如需要登录等操作则自动打开目标地址
