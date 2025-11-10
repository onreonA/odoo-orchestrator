import { redirect } from 'next/navigation'

export default async function Home() {
  // Always redirect to login - let proxy.ts handle auth checks
  // This prevents 404 errors if Supabase is unavailable
  redirect('/login')
}
