# 后端部署说明

这份后端已经整理成可以直接部署到外网的形态了，核心特点是：

- 支持 `PORT` 环境变量
- 支持 `HOST` 环境变量
- 支持 `ALLOW_ORIGIN` 环境变量
- MySQL 可以走环境变量，不依赖本地 `db/mysql.local.json`
- 自带 `/api/ping` 健康检查接口

## 一、先明确目标

如果你是为了让微信小程序进入小范围测试，后端至少要满足这几个条件：

- 有外网可访问地址
- 最终是 `https://` 域名
- 后端接口稳定在线
- MySQL 也要放到云上，不能继续只用你电脑本地数据库

## 二、推荐的两条路线

### 路线 A：最快验证

适合先跑通测试版：

- 云平台部署 Node 服务
- 云数据库 MySQL
- 平台自动提供 HTTPS

这一条部署最快，但后面如果要接入微信小程序正式体验版或更稳定测试，通常还需要你自己的正式域名。

### 路线 B：更适合小程序测试

适合你现在这个项目继续往前推进：

- 买一台云服务器
- 绑定你自己的域名
- 用 Nginx 做反向代理
- 给域名配 HTTPS 证书
- 小程序后台配置这个域名

如果你主要面向国内微信小程序测试，这条路线更稳。

## 三、当前后端用到的环境变量

部署时至少准备这些：

```bash
HOST=0.0.0.0
PORT=3000
ALLOW_ORIGIN=*
MATCH_MYSQL_HOST=你的云数据库地址
MATCH_MYSQL_PORT=3306
MATCH_MYSQL_USER=你的数据库用户名
MATCH_MYSQL_PASSWORD=你的数据库密码
MATCH_MYSQL_DATABASE=match
```

说明：

- 本地开发时你可以继续用 `db/mysql.local.json`
- 云上部署时，建议不要上传这个本地配置文件
- 直接在云平台环境变量里填数据库配置

## 四、Docker 部署方式

如果你的云平台支持 Docker，可以直接在 `server` 目录执行：

```bash
docker build -t match-miniapp-server .
docker run -d ^
  --name match-miniapp-server ^
  -p 3000:3000 ^
  -e HOST=0.0.0.0 ^
  -e PORT=3000 ^
  -e ALLOW_ORIGIN=* ^
  -e MATCH_MYSQL_HOST=你的云数据库地址 ^
  -e MATCH_MYSQL_PORT=3306 ^
  -e MATCH_MYSQL_USER=你的数据库用户名 ^
  -e MATCH_MYSQL_PASSWORD=你的数据库密码 ^
  -e MATCH_MYSQL_DATABASE=match ^
  match-miniapp-server
```

## 五、自己买云服务器时的推荐结构

建议结构：

- Node 服务监听 `3000`
- Nginx 对外提供 `443`
- `https://你的域名` 反代到 `http://127.0.0.1:3000`

Nginx 的核心思路是：

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 六、部署完成后的检查顺序

先在浏览器里检查这几个地址：

1. `https://你的域名/api/ping`
2. `https://你的域名/api/admin/families`
3. `https://你的域名/admin`

如果这三个都能打开，说明：

- 服务启动成功
- HTTPS 生效
- 后端路由没问题
- 后台页面也能访问

## 七、和你当前前端的关系

你现在前端很多页面还在用：

```txt
http://127.0.0.1:3000/api
```

后端部署好以后，下一步要做的是把前端接口地址统一改成：

```txt
https://你的域名/api
```

而且最好不要散落在每个页面里，建议改成一个统一配置文件。

## 八、你现在最实际的下一步

你现在只差两样外部资源：

1. 一台云服务器或者一个可部署 Node 的云平台
2. 一套云数据库 MySQL

只要你把这两个准备好，我就可以继续帮你：

- 改前端接口地址配置
- 写服务器启动命令
- 检查小程序后台域名配置项
- 做上线前联调
