import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user) {
        setCheckingSetup(false)
        return
      }

      // Skip check if already on onboarding or setup pages
      if (location.pathname === '/onboarding' || location.pathname === '/setup') {
        console.log('🔵 [ProtectedRoute] Already on setup page, skipping check')
        setCheckingSetup(false)
        return
      }

      console.log('🔵 [ProtectedRoute] Checking setup status for user:', user.id)

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('has_completed_onboarding, setup_completed')
          .eq('user_id', user.id)
          .single()

        console.log('🔍 [ProtectedRoute] Profile status:', {
          has_completed_onboarding: profile?.has_completed_onboarding,
          setup_completed: profile?.setup_completed,
          error
        })

        if (error) {
          console.error('❌ [ProtectedRoute] Error checking profile:', error)
          setCheckingSetup(false)
          return
        }

        // Redirect to onboarding if not completed
        if (!profile?.has_completed_onboarding) {
          console.log('🚀 [ProtectedRoute] Redirecting to /onboarding')
          setRedirectTo('/onboarding')
        }
        // Redirect to setup if onboarding done but setup not done
        else if (!profile?.setup_completed) {
          console.log('🚀 [ProtectedRoute] Redirecting to /setup')
          setRedirectTo('/setup')
        } else {
          console.log('✅ [ProtectedRoute] Setup complete, allowing access')
        }
      } catch (error) {
        console.error('❌ [ProtectedRoute] Critical error:', error)
      } finally {
        setCheckingSetup(false)
      }
    }

    checkUserSetup()
  }, [user, location.pathname])

  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-barlow">Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}