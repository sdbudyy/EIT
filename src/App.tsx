import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Skills from './pages/Skills'
import Documents from './pages/Documents'
import Essays from './pages/Essays'
import TextInput from './pages/TextInput'
import NotFound from './pages/NotFound'
import EditDocument from './pages/EditDocument'
import Settings from './pages/Settings'
import SAOs from './pages/SAOs'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/signup"
        element={!session ? <SignUp /> : <Navigate to="/" />}
      />
      <Route
        path="/forgot-password"
        element={!session ? <ForgotPassword /> : <Navigate to="/" />}
      />
      <Route
        path="/reset-password"
        element={!session ? <ResetPassword /> : <Navigate to="/" />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={session ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="skills" element={<Skills />} />
        <Route path="saos" element={<SAOs />} />
        <Route path="documents" element={<Documents />} />
        <Route path="essays" element={<Essays />} />
        <Route path="text-input" element={<TextInput />} />
        <Route path="edit-document/:id" element={<EditDocument />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App