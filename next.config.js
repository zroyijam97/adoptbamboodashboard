/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TOYYIBPAY_SECRET_KEY: process.env.TOYYIBPAY_SECRET_KEY,
    TOYYIBPAY_CATEGORY_CODE: process.env.TOYYIBPAY_CATEGORY_CODE,
    TOYYIBPAY_BASE_URL: process.env.TOYYIBPAY_BASE_URL || 'https://dev.toyyibpay.com',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }
};

module.exports = nextConfig;