# 🌿 Adopt Bamboo Dashboard

A comprehensive bamboo adoption platform built with Next.js 15, featuring payment integration, user management, and admin dashboard capabilities.

## 🚀 Features

### 🌱 Core Features
- **Bamboo Adoption System**: Users can adopt bamboo plants with different subscription packages
- **Location Management**: Multiple planting locations across Malaysia
- **Payment Integration**: Secure payments via ToyyibPay gateway
- **User Dashboard**: Track adoptions, view payment history, and manage subscriptions
- **Admin Panel**: Comprehensive management system for users, adoptions, and analytics

### 💳 Payment System
- **ToyyibPay Integration**: Secure Malaysian payment gateway
- **Multiple Packages**: Monthly, quarterly, and annual subscription options
- **Payment Tracking**: Real-time payment status and history
- **Callback Handling**: Automated payment verification and updates

### 🔧 Admin Features
- **User Management**: View, edit, and manage user accounts
- **Adoption Tracking**: Monitor all bamboo adoptions and their status
- **Analytics Dashboard**: Real-time statistics and insights
- **Location Management**: Manage planting locations and their details
- **Package Management**: Configure subscription packages and pricing

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk Auth
- **Payments**: ToyyibPay Gateway
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **Charts**: Recharts for analytics
- **TypeScript**: Full type safety

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zroyijam97/adoptbamboodashboard.git
   cd adoptbamboodashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   DATABASE_URL="your_postgresql_connection_string"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
   CLERK_SECRET_KEY="your_clerk_secret_key"
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
   NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
   
   # ToyyibPay
   TOYYIBPAY_SECRET_KEY="your_toyyibpay_secret_key"
   TOYYIBPAY_CATEGORY_CODE="your_category_code"
   TOYYIBPAY_BASE_URL="https://dev.toyyibpay.com"
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:push
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly set in your production environment.

## 📱 Usage

### For Users
1. **Sign Up/Login**: Create an account or login via Clerk authentication
2. **Choose Package**: Select from monthly, quarterly, or annual packages
3. **Select Location**: Choose a planting location in Malaysia
4. **Make Payment**: Secure payment via ToyyibPay
5. **Track Adoption**: Monitor your bamboo adoption in the dashboard

### For Administrators
1. **Access Admin Panel**: Navigate to `/adminbamboo`
2. **Manage Users**: View and edit user information
3. **Track Adoptions**: Monitor all bamboo adoptions
4. **View Analytics**: Access real-time statistics and insights
5. **Manage Locations**: Add or update planting locations

## 🔧 API Endpoints

### Public APIs
- `GET /api/payment/status` - Check payment status
- `POST /api/payment/create` - Create payment session
- `POST /api/payment/callback` - Handle payment callbacks

### Admin APIs
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users` - Update user information
- `GET /api/admin/adoptions` - Get all adoptions
- `PUT /api/admin/adoptions` - Update adoption details
- `GET /api/admin/analytics` - Get analytics data

## 🌍 Supported Locations

- **Kuala Lumpur**: Hutan Simpan Bukit Lagong
- **Pahang**: Ladang Bambu Berkelanjutan, Bentong
- **Johor**: Taman Eko Bambu, Kluang

## 🔒 Security Features

- **SSL Encryption**: All data protected with 256-bit SSL
- **Secure Payments**: ToyyibPay certified gateway
- **Data Protection**: Personal information not stored on servers
- **Authentication**: Secure user authentication via Clerk

## 📊 Analytics

The admin dashboard provides:
- Total users and adoptions
- Revenue tracking
- Location-based statistics
- Package popularity metrics
- Payment success rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team

## 🙏 Acknowledgments

- ToyyibPay for payment gateway services
- Clerk for authentication services
- Next.js team for the amazing framework
- All contributors to this project

---

**Built with ❤️ for sustainable bamboo adoption in Malaysia** 🇲🇾
