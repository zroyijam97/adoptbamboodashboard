import { clerkMiddleware } from '@clerk/nextjs/server';
import { createRouteMatcher } from '@clerk/nextjs/server';
 
const isProtectedRoute = createRouteMatcher([
  '/adminbamboo(.*)',
  '/payment(.*)',
  '/api/payment/create',
  '/api/payment/status',
  // Note: /api/payment/callback is excluded as it's called by ToyyibPay without auth
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};