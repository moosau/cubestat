"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import RubiksTimer from "../rubiks-timer"
import AuthForm from "@/components/auth/auth-form"
import { Loader2 } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <RubiksTimer user={user} />
}
