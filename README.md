<h1 align="center">Welcome to UTEShop</h1>

<p align="center">
  <a href="http://localhost:5173/" target="_blank">
    <img alt="Demo" src="https://img.shields.io/badge/Demo-Live%20Demo-blue?style=for-the-badge&logo=vercel" />
  </a>
  <img alt="React" src="https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4.18.2-000000?logo=express&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" />
  <img alt="License" src="https://img.shields.io/github/license/Nhom17/UTEShop" />
</p>

<p align="center">
  <strong>UTEShop</strong> – Website bán mỹ phẩm cao cấp với trải nghiệm người dùng mượt mà và quản trị mạnh mẽ.
</p>

---

## Demo

> **User Site:** `http://localhost:5173`  
> **Admin Dashboard:** `http://localhost:3000`  
> **User API Docs:** `http://localhost:5000/api/docs`  
> **Admin API Docs:** `http://localhost:4000/api/docs`

---

## Tech Stack

| Phần | Công nghệ |
|------|-----------|
| **Frontend (User)** | React.js + Vite + TailwindCSS |
| **Backend (User API)** | Express.js + JWT + MongoDB |
| **Frontend (Admin)** | Next.js (App Router) + TypeScript + Shadcn/ui |
| **Backend (Admin API)** | NestJS + TypeORM + PostgreSQL |
| **Auth** | JWT + Refresh Token + Role-based |
| **State Management** | Zustand / Redux Toolkit |

---

---

## Hướng dẫn cài đặt & chạy local

```bash
git clone https://github.com/Nhom17/UTEShop.git
cd UTEShop
1. User Frontend (React)
bashcd client
npm install
npm run dev
2. User API (Express)
bashcd ../server-user
npm install
npm run start:dev
3. Admin Dashboard (Next.js)
bashcd ../admin
npm install
npm run dev
4. Admin API (NestJS)
bashcd ../server-admin
npm install
npm run start:dev

Scripts có sẵn

ProjectScriptMô tảclientnpm run devVite dev serverserver-usernpm run start:devExpress + nodemonadminnpm run devNext.js devserver-adminnpm run start:devNestJS dev

Biến môi trường (.env)
server-user/.env
envPORT=5000
MONGODB_URI=mongodb://localhost:27017/uteshop_user
JWT_SECRET=your_jwt_secret_key
server-admin/.env
envPORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/uteshop_admin
JWT_ADMIN_SECRET=admin_jwt_secret

Author
Nhom17

GitHub: @Nhom17


Đóng góp

Fork repo
Tạo branch: git checkout -b feature/ten-tinh-nang
Commit: git commit -m 'Add: tính năng mới'
Push & Pull Request


Show your support
Give a ⭐️ if this project helped you!

This README was generated with ❤️ by readme-md-generator and customized by Nhom17
