import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { COOKIE, userFromToken, publicUser } from '@/server/auth.mjs';
import Dashboard from './Dashboard';

export default async function StaffPage({ role }) {
  const cookieStore = await cookies();
  const u = await userFromToken(cookieStore.get(COOKIE)?.value);
  if (!u) redirect('/' + role + '/login');
  if (u.role !== role) return <div className="container page"><h1>Access restricted</h1><p>This area requires a {role} account.</p><Link href="/account">Your account</Link></div>;
  if (u.status !== 'active') return <div className="container page"><h1>Your seller application is pending</h1><p>An administrator must approve your account before you can manage products and orders.</p><Link href="/account">Your account</Link></div>;
  return <Dashboard role={role} user={publicUser(u)} />;
}
