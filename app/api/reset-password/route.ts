import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This recovery endpoint has been retired. Request a secure recovery email from the sign-in page.' },
    { status: 410 },
  )
}
