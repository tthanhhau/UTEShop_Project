# UTEShop - Website Bán hàng thời trang

## 📋 Giới thiệu

UTEShop là một nền tảng thương mại điện tử chuyên về thời trang, cung cấp trải nghiệm mua sắm trực tuyến hiện đại và tiện lợi cho khách hàng.

## 🛠️ Công nghệ sử dụng

### Frontend
- **User Interface**: ReactJS - Giao diện người dùng
- **Admin Interface**: NextJS - Trang quản trị

### Backend
- **User API**: ExpressJS - RESTful API cho người dùng
- **Admin API**: NestJS - API cho hệ thống quản trị

### Database
- **MongoDB** - Cơ sở dữ liệu NoSQL



## 🚀 Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- Node.js >= 16.x
- MongoDB >= 5.x
- npm hoặc yarn

### 1. Clone repository

```bash
git clone https://github.com/tthanhhau/UTEShop_Project.git
cd uteshop
```

### 2. Cài đặt dependencies

#### Backend User API (ExpressJS)
```bash
cd UTEShop_BE
npm install
```

#### Backend Admin API (NestJS)
```bash
cd UTEShop_BE_Admin
npm install
```

#### Frontend User (ReactJS)
```bash
cd UTEShop_FE
npm install
```

#### Frontend Admin (NextJS)
```bash
cd UTEShop_FE_Admin
npm install
```

### 3. Cấu hình môi trường

#### Server (ExpressJS) - `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/uteshop
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

#### Admin API (NestJS) - `.env`
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/uteshop
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

#### Client (ReactJS) - `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Admin (NextJS) - `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 4. Chạy ứng dụng

#### Khởi động MongoDB
```bash
mongod
```

#### Chạy Backend User API (ExpressJS)
```bash
cd server
npm run dev
```

#### Chạy Backend Admin API (NestJS)
```bash
cd admin-api
npm run start:dev
```

#### Chạy Frontend User (ReactJS)
```bash
cd client
npm start
```

#### Chạy Frontend Admin (NextJS)
```bash
cd admin
npm run dev
```

## 🌐 Truy cập ứng dụng

- **Website người dùng**: http://localhost:5137
- **Trang quản trị**: http://localhost:3001
- **API người dùng**: http://localhost:5000
- **API quản trị**: http://localhost:5001

## 📦 Tính năng chính

### Người dùng
- Đăng ký/Đăng nhập tài khoản
- Xem danh sách sản phẩm mỹ phẩm
- Tìm kiếm và lọc sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Đặt hàng và thanh toán
- Quản lý đơn hàng cá nhân
- Đánh giá và nhận xét sản phẩm

### Admin
- Quản lý sản phẩm (CRUD)
- Quản lý danh mục
- Quản lý đơn hàng
- Quản lý người dùng
- Thống kê doanh thu
- Quản lý khuyến mãi

## 📚 Scripts

### Server (ExpressJS)
```bash
npm run dev      # Chạy development mode
npm start        # Chạy production mode
npm test         # Chạy tests
```

### Admin API (NestJS)
```bash
npm run start:dev    # Chạy development mode
npm run start:prod   # Chạy production mode
npm run test         # Chạy tests
```

### Client (ReactJS)
```bash
npm start        # Chạy development mode
npm run build    # Build production
npm test         # Chạy tests
```

### Admin (NextJS)
```bash
npm run dev      # Chạy development mode
npm run build    # Build production
npm start        # Chạy production mode
```

## 🗄️ Database Schema

### Collections chính
- **users**: Thông tin người dùng
- **products**: Sản phẩm mỹ phẩm
- **categories**: Danh mục sản phẩm
- **orders**: Đơn hàng
- **reviews**: Đánh giá sản phẩm
- **carts**: Giỏ hàng

## 🔐 Authentication

Hệ thống sử dụng JWT (JSON Web Token) cho xác thực người dùng và phân quyền.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo pull request hoặc mở issue để thảo luận.



**Made with ❤️ by UTEShop Team**
