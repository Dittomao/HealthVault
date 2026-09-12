import LoginClient from './LoginClient'

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[]
    next?: string | string[]
    reset?: string | string[]
  }>
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  return (
    <LoginClient
      callbackError={firstValue(params.error)}
      requestedDestination={firstValue(params.next)}
      resetStatus={firstValue(params.reset)}
    />
  )
}
