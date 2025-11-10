import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes (except auth)
  const pathname = request.nextUrl.pathname
  
  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Allow request to proceed if env vars are missing
      return NextResponse.next()
    }

    // Create response first
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create Supabase client with error handling
    let supabase
    try {
      supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      })
    } catch (error) {
      console.error('Error creating Supabase client:', error)
      return NextResponse.next()
    }

    // Get user with timeout protection
    let user = null
    try {
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as { data: { user: any } }
      
      user = userResult?.data?.user || null
    } catch (error) {
      // Silently continue without user if auth fails
      // This allows the app to work even if Supabase is temporarily unavailable
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard') && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if ((pathname === '/login' || pathname === '/register') && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Role-based route protection (only if user exists and Supabase is working)
    if (user && pathname.startsWith('/dashboard') && supabase) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profileError && profile) {
          const role = profile.role

          // Admin-only routes
          const adminRoutes = ['/dashboard/admin', '/dashboard/settings']
          if (adminRoutes.some((route) => pathname.startsWith(route))) {
            if (role !== 'super_admin' && role !== 'company_admin') {
              const url = request.nextUrl.clone()
              url.pathname = '/dashboard'
              return NextResponse.redirect(url)
            }
          }

          // Super admin-only routes
          const superAdminRoutes = ['/dashboard/admin']
          if (superAdminRoutes.some((route) => pathname.startsWith(route))) {
            if (role !== 'super_admin') {
              const url = request.nextUrl.clone()
              url.pathname = '/dashboard'
              return NextResponse.redirect(url)
            }
          }
        }
      } catch (error) {
        // Allow access if role check fails (graceful degradation)
        // Don't block the request
      }
    }

    return response
  } catch (error: any) {
    // Log error but don't block the request
    console.error('Middleware error:', error?.message || error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}



