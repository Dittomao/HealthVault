import { isDashboardTab } from '@/lib/document-analysis'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

type DashboardPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  const params = await searchParams
  const requestedTab = Array.isArray(params.tab) ? params.tab[0] : params.tab
  const initialTab = isDashboardTab(requestedTab) ? requestedTab : 'jargon'

  if (error || !user) {
    const destination = `/dashboard?tab=${initialTab}`
    redirect(`/login?next=${encodeURIComponent(destination)}`)
  }

  return <DashboardClient user={user} initialTab={initialTab} />
}

