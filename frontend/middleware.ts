import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_MODULES, type Role } from './lib/constants';

/**
 * Reads the payload of the auth cookie WITHOUT verifying the signature.
 * That is deliberate: this middleware only decides which page to show. Every API
 * call is verified server-side, so a forged cookie buys a redirect and nothing else.
 */
const decodeRole = (token: string): Role | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: Role;
      exp?: number;
    };
    if (json.exp && json.exp * 1000 < Date.now()) return null;
    return json.role ?? null;
  } catch {
    return null;
  }
};

const AUTH_PAGES = ['/login', '/signup'];

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const role = decodeRole(request.cookies.get('token')?.value ?? '');

  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const homeFor = (r: Role) => (r === 'borrower' ? '/apply' : '/dashboard');

  if (!role) {
    if (AUTH_PAGES.includes(pathname)) return NextResponse.next();
    return redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  // Already signed in — bounce away from the auth pages to where this role belongs.
  if (AUTH_PAGES.includes(pathname) || pathname === '/') return redirect(homeFor(role));

  if (pathname.startsWith('/apply')) {
    return role === 'borrower' ? NextResponse.next() : redirect(homeFor(role));
  }

  if (pathname.startsWith('/dashboard')) {
    if (role === 'borrower') return redirect('/apply');
    const module = pathname.split('/')[2];
    const allowed = ROLE_MODULES[role];
    // The dashboard root is the role-aware overview. Module routes still require permission.
    if (module && !allowed.includes(module)) return redirect(homeFor(role));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ['/', '/login', '/signup', '/apply/:path*', '/dashboard/:path*'],
};
