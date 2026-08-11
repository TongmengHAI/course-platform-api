# 🚀 Production Cloud Deployment Guide — Manual Backend Deployment

A step-by-step administrator guide for manual deployment of the **Online Course Platform API** (Express + MySQL + TypeORM) to a cloud VPS instance on **Digital Ocean** or **Alibaba Cloud (ECS)**.

> **Hosting Platform**: Digital Ocean Droplet / Alibaba Cloud ECS VM (Ubuntu 22.04 LTS)
> **Stack**: Node.js (PM2 process manager) · MySQL Server · Nginx Reverse Proxy · Let's Encrypt SSL (Certbot)

---

## 📚 Table of Contents

1. [Architectural Blueprint](#1-architectural-blueprint)
2. [Step 1 — Cloud VM Provisioning & Initial System Setup](#step-1---cloud-vm-provisioning--initial-system-setup)
3. [Step 2 — Installing Node.js & Cloning Codebase](#step-2---installing-nodejs--cloning-codebase)
4. [Step 3 — Deploying & Securing MySQL Database](#step-3---deploying--securing-mysql-database)
5. [Step 4 — Running Node Server under PM2 Daemon](#step-4---running-node-server-under-pm2-daemon)
6. [Step 5 — Configuring Nginx Reverse Proxy & SSL](#step-5---configuring-nginx-reverse-proxy--ssl)
7. [System Maintenance & Monitoring Checklist](#system-maintenance--monitoring-checklist)

---

## 1. Architectural Blueprint

```
                     Internet Traffic (HTTPS/443)
                                  │
                                  ▼
┌─────────────────────────────────┼───────────────────────────┐
│ Ubuntu Virtual Machine          │                           │
│                                 ▼                           │
│                       ┌──────────────────┐                  │
│                       │   Nginx Server   │                  │
│                       │ (Proxy Pass 5000)│                  │
│                       └────────┬─────────┘                  │
│                                │ (Localhost traffic)        │
│                                ▼                            │
│                       ┌──────────────────┐                  │
│                       │ Node Express API │                  │
│                       │   (PM2 Daemon)   │                  │
│                       └────────┬─────────┘                  │
│                                │                            │
│                                ▼                            │
│                       ┌──────────────────┐                  │
│                       │   MySQL Server   │                  │
│                       │   (Port 3306)    │                  │
│                       └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1 — Cloud VM Provisioning & Initial System Setup

1. **Create VPS Droplet / ECS Instance**:
   - OS: **Ubuntu 22.04 LTS**.
   - Hardware: **1 vCPU / 1GB RAM / 25GB SSD** (minimum).
2. **Access VPS via SSH**:
   ```bash
   ssh root@<YOUR_VPS_IP_ADDRESS>
   ```
3. **Configure System Firewall (UFW)**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw allow 3306/tcp  # Optional: only open if remote database connection is required
   sudo ufw enable
   ```

---

## Step 2 — Installing Node.js & Cloning Codebase

Install **Node.js (LTS version 20)** using NodeSource binaries.

1. **Install Node.js & Git**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   node -v && npm -v
   ```
2. **Clone API Repository**:
   ```bash
   cd /var/www
   git clone <YOUR_GIT_BACKEND_REPO_URL> course-platform-api
   cd course-platform-api
   npm install
   ```

---

## Step 3 — Deploying & Securing MySQL Database

1. **Install MySQL Server**:
   ```bash
   sudo apt install mysql-server -y
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```
2. **Run MySQL Secure Installation Script**:
   ```bash
   sudo mysql_secure_installation
   ```
   *Follow prompts: Set root password strength, remove anonymous users, disallow remote root login, and drop test databases.*
3. **Initialize Database Schema & User Permissions**:
   Log in to MySQL command-line utility:
   ```bash
   sudo mysql -u root -p
   ```
   Run query block:
   ```sql
   CREATE DATABASE online_course_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'platform_user'@'localhost' IDENTIFIED BY 'SetSecurePasswordHere123!';
   GRANT ALL PRIVILEGES ON online_course_platform.* TO 'platform_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## Step 4 — Running Node Server under PM2 Daemon

PM2 runs our node processes continuously in the background and restarts them automatically if they crash or the server reboots.

1. **Configure Environment Variables**:
   Create a production `.env` config file:
   ```bash
   nano .env
   ```
   Add values:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=platform_user
   DB_PASSWORD=SetSecurePasswordHere123!
   DB_DATABASE=online_course_platform
   JWT_SECRET=MakeSomethingVerySecureAndHardToGuessKey_321!
   JWT_EXPIRES_IN=7d
   ```
2. **Run Process with PM2**:
   ```bash
   sudo npm install pm2 -g
   pm2 start server.js --name "course-api"
   ```
3. **Configure PM2 Daemon Boot Startup**:
   ```bash
   pm2 startup systemd
   # Copy and execute the exact command generated by the output of the above statement
   pm2 save
   ```

---

## Step 5 — Configuring Nginx Reverse Proxy & SSL

Nginx accepts incoming HTTP/HTTPS traffic on port 80/443 and proxies it internally to our node application running on port 5000.

1. **Install Nginx**:
   ```bash
   sudo apt install nginx -y
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```
2. **Configure Nginx Site Configuration Block**:
   ```bash
   sudo nano /etc/nginx/sites-available/api.yourdomain.com
   ```
   Add block config:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com; # Replace with your subdomain or server IP

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
3. **Enable Server Block Configuration**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default config
   sudo nginx -t                             # Test syntax
   sudo systemctl restart nginx
   ```
4. **Acquire Let's Encrypt SSL Certificates**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourdomain.com
   ```
   *Follow prompts to configure automated SSL redirection.*

---

## System Maintenance & Monitoring Checklist

* **Checking Logs**: `pm2 logs course-api`
* **Restarting Service**: `pm2 restart course-api`
* **Checking DB connection status**: `mysqladmin -u platform_user -p ping`
* **Nginx Error log checks**: `sudo tail -f /var/log/nginx/error.log`
