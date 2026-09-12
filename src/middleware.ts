import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

/**
 * حماية المسارات على الحافة — طبقة أولى سريعة.
 * التحقّق النهائي من الصلاحيات يبقى دائمًا في الخادم (getAccess / getCurriculum)
 * حتى لا يُمنح أي وصول اعتمادًا على الـ middleware وحده.
 */

const STUDENT_PATHS = ["/dashboard", "/learn", "/quiz", "/profile", "/checkout", "/certificate"];
const ADMIN_PATHS = ["/admin"];
const GUEST_ONLY = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const needsAuth =
    STUDENT_PATHS.some((p) => pathname.startsWith(p)) ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (needsAuth && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    session?.role !== "admin"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session && GUEST_ONLY.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "admin" ? "/admin" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/quiz/:path*",
    "/profile/:path*",
    "/checkout/:path*",
    "/certificate/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
