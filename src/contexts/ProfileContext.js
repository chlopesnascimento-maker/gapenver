import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ProfileCtx = createContext(null)

export function ProfileProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session ?? null)

      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome, cargo, "photoURL"')
          .eq('id', session.user.id)
          .single()
        if (!mounted) return
        setProfile(data ?? null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (!sess?.user?.id) {
        setProfile(null)
        return
      }
      supabase
        .from('profiles')
        .select('id, nome, sobrenome, cargo, "photoURL"')
        .eq('id', sess.user.id)
        .single()
        .then(({ data }) => setProfile(data ?? null))
    })

    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  const role = (profile?.cargo ?? 'default').toLowerCase()

  return (
    <ProfileCtx.Provider value={{ session, profile, role, loading, refresh: async () => {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, cargo, "photoURL"')
        .eq('id', session.user.id)
        .single()
      setProfile(data ?? null)
    }}}>
      {children}
    </ProfileCtx.Provider>
  )
}

export function useProfile() { return useContext(ProfileCtx) }
