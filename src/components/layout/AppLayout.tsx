
import React, { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileFullScreenMenu } from './MobileFullScreenMenu'
import { TrialEndedModal } from '@/components/ui/trial-ended-modal'

export function AppLayout() {
  const location = useLocation()
  
  // Don't show trial modal on pricing page (so user can pay)
  const showTrialModal = location.pathname !== '/pricing'
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    
    // Disable browser's default scroll restoration
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual"
    }
    
    return () => {
      // Restore default behavior on cleanup
      if (window.history.scrollRestoration) {
        window.history.scrollRestoration = "auto"
      }
    }
  }, [location.pathname])
  
  // Hide header on mobile for specific pages including dashboard
  const hideHeaderOnMobile = ['/dashboard', '/tasks', '/budget', '/calendar', '/guests', '/seating', '/progress', '/settings'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-background bg-botanical">
      {showTrialModal && <TrialEndedModal />}
      
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6"><Outlet /></main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {!hideHeaderOnMobile && <Header />}
        <main className="pb-20 px-4 pt-4">
          <Outlet />
        </main>
        {location.pathname !== '/menu' && <BottomNav />}
      </div>
    </div>
  )
}
