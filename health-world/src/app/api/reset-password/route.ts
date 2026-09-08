import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email, dob, newPassword } = await req.json()

    if (!email || !dob || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Find user by email
    // Note: auth.admin.listUsers() is paginated. For a small app, this works,
    // but ideally, we should query auth.users directly via a postgres RPC, 
    // or use admin API to get user by email if supported.
    // Supabase admin API doesn't have a direct "getUserByEmail". 
    // Let's create an RPC function on the DB, or just query auth.users if we use postgres directly.
    // Wait, the admin API does have listUsers!
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ error: 'Failed to query users' }, { status: 500 })
    }

    const targetUser = users.find(u => u.email === email)

    if (!targetUser) {
      // Return generic error to prevent email enumeration
      return NextResponse.json({ error: 'Invalid email or Date of Birth' }, { status: 400 })
    }

    // 2. Verify DOB
    const storedDob = targetUser.user_metadata?.date_of_birth
    
    if (!storedDob || storedDob !== dob) {
      return NextResponse.json({ error: 'Invalid email or Date of Birth' }, { status: 400 })
    }

    // 3. Reset Password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    )

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
    
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
