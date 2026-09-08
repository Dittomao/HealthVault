const fs = require('fs')

let content = fs.readFileSync('src/app/login/page.tsx', 'utf8')

// Add 'forgot_password' to mode state
content = content.replace(
  "const [mode, setMode] = useState<'login' | 'signup'>('login')",
  "const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login')"
)

// Add handleResetPassword function
const handleResetPassword = `
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dob, newPassword: password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }
      
      alert('Password reset successful! You can now sign in with your new password.')
      setMode('login')
      setPassword('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
`

// Inject handleResetPassword before handleAuth
content = content.replace("const handleAuth =", handleResetPassword + "\n  const handleAuth =")

// Modify the form onSubmit
content = content.replace(
  "<form onSubmit={handleAuth} className=\"space-y-4\">",
  "<form onSubmit={mode === 'forgot_password' ? handleResetPassword : handleAuth} className=\"space-y-4\">"
)

// Modify DOB condition to show on signup AND forgot_password
content = content.replace(
  "{mode === 'signup' && (",
  "{(mode === 'signup' || mode === 'forgot_password') && ("
)

// Fix the DOB text based on mode
content = content.replace(
  "<p className=\"text-xs text-gray-500 mt-1\">Used to verify your identity if you forget your password.</p>",
  "<p className=\"text-xs text-gray-500 mt-1\">{mode === 'forgot_password' ? 'Enter the exact Date of Birth you used during sign up.' : 'Used to verify your identity if you forget your password.'}</p>"
)

// Change Password label text based on mode
content = content.replace(
  "<label className=\"block text-sm font-medium text-gray-700 mb-1\">Password</label>",
  "<label className=\"block text-sm font-medium text-gray-700 mb-1\">{mode === 'forgot_password' ? 'New Password' : 'Password'}</label>"
)

// Change Button text
content = content.replace(
  "{loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}",
  "{loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password')}"
)

// Change toggle links at bottom
content = content.replace(
  "onClick={() => alert('Forgot Password flow with DOB verification will be implemented here!')}",
  "onClick={() => setMode('forgot_password')}"
)

fs.writeFileSync('src/app/login/page.tsx', content)
console.log('Done refactoring login')
