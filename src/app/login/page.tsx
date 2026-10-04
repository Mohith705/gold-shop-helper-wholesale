'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { handleLogin } from '@/app/actions'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginFormComponent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FCFBF8] to-[#F5F2EB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-amber-200 selection:text-amber-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-4 rounded-3xl shadow-sm shadow-amber-200/50 border border-amber-200/50">
            <Lock size={40} className="text-amber-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-amber-900 tracking-tight">
          Vyshnavi Jewellers
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
        <div className="bg-white/80 backdrop-blur-md py-10 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-amber-100/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
          <form action={handleLogin} className="space-y-6">
            {error === 'invalid' && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md text-center">
                Invalid username or password
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1">
                <input
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 sm:text-sm transition-all bg-white/50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 sm:text-sm transition-all bg-white/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-amber-500/20 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginFormComponent />
    </Suspense>
  )
}
