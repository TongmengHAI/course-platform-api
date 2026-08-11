# 🚀 Step 5: Production Cloud Deployment — From Scratch VPS Setup (React, Express, MySQL & Nginx)

This guide provides a comprehensive, step-by-step walkthrough to manually provision and deploy the **Online Course Platform** (React UI, Express API, and MySQL Database) on an Ubuntu 22.04 LTS VPS instance (Digital Ocean Droplet or Alibaba Cloud ECS).

---

## 📚 Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Step 1 — Cloud Firewall & System Packages Installation](#step-1--cloud-firewall--system-packages-installation)
3. [Step 2 — Installing & Configuring MySQL Database Server](#step-2--installing--configuring-mysql-database-server)
4. [Step 3 — Deploying & Daemonizing the Express.js API (PM2)](#step-3--deploying--daemonizing-the-expressjs-api-pm2)
5. [Step 4 — Compiling & Deploying the React.js Frontend](#step-4--compiling--deploying-the-reactjs-frontend)
6. [Step 5 — Configuring Nginx as Reverse Proxy & Static Host](#step-5--configuring-nginx-as-reverse-proxy--static-host)
7. [Step 6 — Setting up Let's Encrypt SSL Certificates](#step-6--setting-up-lets-encrypt-ssl-certificates)
8. [Deployment Verification & Troubleshooting](#deployment-verification--troubleshooting)

---

## 1. Architectural Overview

```
                      User Browser Requests (HTTPS)
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
         (Static Assets)                         (API Calls)
                │                                     │
                ▼                                     ▼
        [yourdomain.com]                     [api.yourdomain.com]
        ┌──────────────┐                     ┌──────────────────┐
        │ Nginx Server │                     │   Nginx Server   │
        │(Static Host) │                     │ (Reverse Proxy)  │
        └──────┬───────┘                     └────────┬─────────┘
               │                                      │ (Proxy Pass to 5000)
               ▼                                      ▼
     /var/www/course-platform                Express.js Server
     (React Compiled Files)                    (PM2 Daemon)
                                                      │
                                                      ▼
                                              MySQL DB Server
                                                (Port 3306)
```

---

## Step 1 — Cloud Firewall & System Packages Installation

Log into your clean Ubuntu 22.04 VPS server as `root` via SSH:
```bash
ssh root@<YOUR_VPS_IP>
```

### 1.1 Update System Repositories
Run the update command to ensure all package lists are up to date:
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Configure UFW Firewall
Configure the Uncomplicated Firewall (UFW) to lock down the server, leaving only SSH, HTTP, and HTTPS ports open:
```bash
# Allow SSH connections
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS web traffic
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```
*Verify status:*
```bash
sudo ufw status verbose
```

### 1.3 Install Prerequisite Build Utilities
Install basic libraries needed for downloading, compiling, and running node modules:
```bash
sudo apt install -y curl git build-essential dirmngr apt-transport-https lsb-release ca-certificates
```

---

## Step 2 — Installing & Configuring MySQL Database Server

We will install MySQL, secure it, create our platform database, and establish a dedicated database user with restricted local access privileges.

### 2.1 Install MySQL Engine
```bash
sudo apt install mysql-server -y
```
Ensure the MySQL daemon service starts automatically upon server boot:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2.2 Run Security Configuration Script
Run the built-in database security configuration utility:
```bash
sudo mysql_secure_installation
```
Select the following configuration choices when prompted:
1. **Validate Password Component**: Press `y` (Select strength `1` or `2` for password complexity rules).
2. **Set Root Password**: Define a strong administrative root password.
3. **Remove Anonymous Users**: Press `y`.
4. **Disallow Root Login Remotely**: Press `y` (This restricts root access to localhost shell only).
5. **Remove Test Database**: Press `y`.
6. **Reload Privilege Tables**: Press `y`.

### 2.3 Initialize Course Platform Schema & Database User
Log into the MySQL command line interface:
```bash
sudo mysql -u root -p
```
Run the following SQL queries to initialize the database and create a separate application user account with secure credentials:
```sql
-- 1. Create database schema with support for modern UTF-8 emojis/characters
CREATE DATABASE course_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create the application user (bind access strictly to localhost)
CREATE USER 'platform_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Secure_DB_Password_2026!';

-- 3. Grant privileges on course platform database to the application user
GRANT ALL PRIVILEGES ON course_platform.* TO 'platform_user'@'localhost';

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Exit MySQL Command line
EXIT;
```

---

## Step 3 — Deploying & Daemonizing the Express.js API (PM2)

### 3.1 Install Node.js LTS (v20)
Download and execute the official NodeSource installation script:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Verify installations:
```bash
node -v  # Output: v20.x.x
npm -v   # Output: v10.x.x
```

### 3.2 Clone API Source Repository
1. Navigate to `/var/www` and clone your repository:
   ```bash
   cd /var/www
   git clone <YOUR_GIT_API_REPO_URL> course-platform-api
   cd course-platform-api
   ```
2. Install production node packages:
   ```bash
   npm install --omit=dev
   ```

### 3.3 Set Up Environment Variables
Create a production environment configuration file `.env`:
```bash
nano .env
```
Copy and paste the following config properties, matching your MySQL configurations from Step 2:
```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=platform_user
DB_PASSWORD=Secure_DB_Password_2026!
DB_DATABASE=course_platform
JWT_SECRET=KeepThisVerySecretStringKey_2026_!
JWT_EXPIRES_IN=7d
```
*Press `Ctrl+O` and `Enter` to save, then `Ctrl+X` to exit.*

### 3.4 Install and Run with PM2 Process Manager
PM2 runs the API server continuously in the background and restarts the application automatically if it crashes.
```bash
# Install PM2 globally
sudo npm install pm2 -g

# Start server.js inside PM2 container
pm2 start server.js --name "course-api"
```
Verify the process status:
```bash
pm2 status
```

### 3.5 Configure Boot Autostart
Generate and configure a systemd daemon script to auto-launch PM2 upon system reboots:
```bash
pm2 startup systemd
```
*Copy the complete command printed in the terminal prompt output and execute it.*
Save the active process list:
```bash
pm2 save
```

---

## Step 4 — Compiling & Deploying the React.js Frontend

The frontend React client compiles into a bundle of static files (HTML, CSS, JS). This step is done locally or inside a CI pipeline, and the resulting bundle is uploaded to the VPS.

### 4.1 Define Production API Endpoint (Locally)
In your local development environment, open the React root directory (`course-platform/`) and configure your production environment settings:
```bash
nano .env.production
```
Point the API variable to your server's secure subdomain:
```env
VITE_API_URL=https://api.yourdomain.com
```

### 4.2 Compile Production Assets (Locally)
Run the compilation build script:
```bash
npm run build
```
This generates a static `dist/` directory in your local folder:
```
dist/
├── index.html
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

### 4.3 Upload Compiled Assets to the VPS Server
Create the target deployment directory on the VPS:
```bash
# Run this on your VPS server terminal
mkdir -p /var/www/course-platform
```
Upload the compiled `dist/` folder contents from your local machine to the VPS using SCP:
```bash
# Run this on your local machine terminal
scp -r ./dist/* root@<YOUR_VPS_IP>:/var/www/course-platform/
```

---

## Step 5 — Configuring Nginx as Reverse Proxy & Static Host

Nginx will serve our static React files on your main domain and act as a reverse proxy on your API subdomain, forwarding traffic to the Express app running on port 5000.

### 5.1 Install Nginx Web Server
```bash
sudo apt install nginx -y
```
Ensure Nginx is enabled and running:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.2 Configure Nginx Server Blocks
Create a new server configuration block:
```bash
sudo nano /etc/nginx/sites-available/course-platform
```
Paste the following complete configuration block. This sets up both the frontend static site and the backend API reverse proxy in a single file:
```nginx
# 1. FRONTEND STATIC HOST: yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/course-platform;
    index index.html;

    # Support React Router browserHistory routing rules
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# 2. BACKEND API REVERSE PROXY: api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers for proxy traffic
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.3 Enable Server Block Configuration
Link the configuration file from `sites-available` to `sites-enabled`:
```bash
sudo ln -s /etc/nginx/sites-available/course-platform /etc/nginx/sites-enabled/

# Remove default boilerplate configuration
sudo rm /etc/nginx/sites-enabled/default
```
Validate Nginx syntax:
```bash
sudo nginx -t
```
*Expected output: `syntax is ok` and `test is successful`*

Restart Nginx to apply changes:
```bash
sudo systemctl restart nginx
```

---

## Step 6 — Setting up Let's Encrypt SSL Certificates

We will use Certbot to automatically fetch and configure SSL certificates for both domains.

### 6.1 Install Certbot
Install Certbot and its Nginx integration plugin:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Fetch and Install SSL Certificates
Run the Nginx plugin script:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
During the prompt flow:
1. Provide a contact email address.
2. Accept the Terms of Service.
3. Choose whether to share your email with the Electronic Frontier Foundation (EFF).
4. **Choose Redirection**: Select `2` to redirect all HTTP requests automatically to secure HTTPS.

Certbot will automatically update the Nginx configuration block with SSL certificates and set up a system cron job to automatically renew them.

---

## Deployment Verification & Troubleshooting

### 1. PM2 Processes Logs
If the API fails to respond, check the active node output logs:
```bash
pm2 logs course-api
```

### 2. MySQL Status Check
Check that MySQL is running and accepting local connections:
```bash
sudo systemctl status mysql
```

### 3. Verify Nginx Access Logs
Check incoming web request traces:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```
