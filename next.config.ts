import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TOYYIBPAY_SECRET_KEY: process.env.TOYYIBPAY_SECRET_KEY || '',
    TOYYIBPAY_CATEGORY_CODE: process.env.TOYYIBPAY_CATEGORY_CODE || '',
    TOYYIBPAY_BASE_URL: process.env.TOYYIBPAY_BASE_URL || 'https://dev.toyyibpay.com'
  }
};

export default nextConfig;
