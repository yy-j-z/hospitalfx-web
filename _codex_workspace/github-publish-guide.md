# GitHub 发布说明

当前本地仓库已经存在 Git，不需要再次执行 `git init`。当前 `origin` 指向旧地址：

```text
https://github.com/comeon0507jyy-creator/hospitalfx-web.git
```

目标地址是：

```text
https://github.com/yy-j-z/hospitalfx-web.git
```

注意：`git add origin main` 不是正确命令。`git add` 用于暂存文件；远程仓库使用 `git remote` 管理。

推荐发布顺序：

```powershell
git status
git add <确认过的文件>
git commit -m "chore: establish team development baseline"
git remote set-url origin https://github.com/yy-j-z/hospitalfx-web.git
git push -u origin main
```

如果目标仓库已有不同历史，不要直接强制推送。先执行：

```powershell
git fetch origin
git log --oneline --all --decorate -10
```

再根据仓库内容决定合并方式。推送前必须确认 `.env.local`、数据库文件、日志和模型大文件没有进入暂存区。
