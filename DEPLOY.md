# 自动部署配置说明

## 第一步：在服务器上生成 SSH 密钥

登录你的服务器，执行：

```bash
ssh-keygen -t rsa -b 4096 -C "deploy@labscheduler"
```

按提示操作：
- 保存位置：直接回车（默认 ~/.ssh/id_rsa）
- 密码：直接回车（不设置密码）

然后将公钥添加到授权列表：

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

查看私钥内容（稍后需要复制）：

```bash
cat ~/.ssh/id_rsa
```

## 第二步：在服务器上初始化项目

```bash
cd /www/wwwroot/d.ayano29.cn
git init
git remote add origin https://github.com/1685901916/labscheduler-deploy.git
git pull origin main
npm install
```

## 第三步：在 GitHub 设置 Secrets

1. 打开 https://github.com/1685901916/labscheduler-deploy/settings/secrets/actions
2. 点击 "New repository secret"，添加以下三个密钥：

**SSH_PRIVATE_KEY**
- 值：复制服务器上 `cat ~/.ssh/id_rsa` 的完整内容

**SERVER_HOST**
- 值：`156.225.28.187`

**SERVER_USER**
- 值：你的服务器用户名（通常是 `root` 或 `www`）

## 完成

设置完成后，每次你推送代码到 GitHub，就会自动部署到服务器。
