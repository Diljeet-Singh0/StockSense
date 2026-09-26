import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Customer public storefront routes
const isStorefrontPublic = (pathname) => {
  if (pathname === '/') return true;
  if (pathname.startsWith('/product/')) return true;
  if (pathname === '/cart') return true;
  if (pathname.startsWith('/customer/')) return true;
  if (pathname === '/login' || pathname === '/admin/login' || pathname === '/forgot-password' || pathname === '/reset-password') return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/store/')) return true;
  return false;
};

// Customer protected routes (requires login as customer or staff)
const isCustomerProtected = (pathname) => {
  return (
    pathname === '/checkout' ||
    pathname.startsWith('/orders') ||
    pathname === '/profile' ||
    pathname.startsWith('/api/customer/')
  );
};

// Admin / Inventory routes (requires MANAGER or STAFF)
const isAdminRoute = (pathname) => {
  if (pathname === '/admin/login') return false;
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/products' ||
    pathname.startsWith('/products/') ||
    pathname === '/receipts' ||
    pathname.startsWith('/receipts/') ||
    pathname === '/deliveries' ||
    pathname.startsWith('/deliveries/') ||
    pathname === '/transfers' ||
    pathname.startsWith('/transfers/') ||
    pathname === '/adjustments' ||
    pathname.startsWith('/adjustments/') ||
    pathname === '/history' ||
    pathname.startsWith('/history/') ||
    pathname === '/warehouses' ||
    pathname.startsWith('/warehouses/') ||
    pathname === '/suppliers' ||
    pathname.startsWith('/suppliers/')
    || pathname === '/profile' ||
    pathname.startsWith('/profile/')
  );
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Next.js internal static assets & favicons
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const user = token ? await verifyToken(token) : null;

  // Attach user headers for API routes if token valid
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-name', encodeURIComponent(user.name));
    requestHeaders.set('x-user-email', user.email);
  }

  // Handle /admin root redirect
  if (pathname === '/admin') {
    if (user && (user.role === 'MANAGER' || user.role === 'STAFF')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Admin route check
  if (isAdminRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'MANAGER' && user.role !== 'STAFF') {
      // Customer trying to access admin inventory
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'Restricted: Warehouse staff access only');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Customer protected route check
  if (isCustomerProtected(pathname)) {
    if (!user) {
      const loginUrl = new URL('/customer/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Public storefront or auth routes
  if (isStorefrontPublic(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
