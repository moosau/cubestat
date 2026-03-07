// Simple in-memory auth system (temporary while Supabase is down)
type User = {
  id: string
  email: string
  user_metadata: {
    full_name: string
  }
}

type Session = {
  user: User
}

type AuthResponse = {
  data: { user: User | null; session: Session | null }
  error: Error | null
}

const users: Map<string, { email: string; password: string; fullName: string }> = new Map()
const sessions: Map<string, Session> = new Map()

export const supabase = {
  auth: {
    signUp: async (options: {
      email: string
      password: string
      options?: { data?: { full_name?: string } }
    }): Promise<AuthResponse> => {
      const { email, password, options: opts } = options
      const fullName = opts?.data?.full_name || ""

      if (users.has(email)) {
        return {
          data: { user: null, session: null },
          error: new Error("User already exists"),
        }
      }

      const userId = Math.random().toString(36).substring(7)
      users.set(email, { email, password, fullName })

      const user: User = {
        id: userId,
        email,
        user_metadata: { full_name: fullName },
      }

      const session: Session = { user }
      sessions.set(userId, session)

      return { data: { user, session }, error: null }
    },

    signInWithPassword: async (options: {
      email: string
      password: string
    }): Promise<AuthResponse> => {
      const { email, password } = options
      const userData = users.get(email)

      if (!userData || userData.password !== password) {
        return {
          data: { user: null, session: null },
          error: new Error("Invalid email or password"),
        }
      }

      const userId = Math.random().toString(36).substring(7)
      const user: User = {
        id: userId,
        email,
        user_metadata: { full_name: userData.fullName },
      }

      const session: Session = { user }
      sessions.set(userId, session)

      return { data: { user, session }, error: null }
    },

    getSession: async (): Promise<{ data: { session: Session | null } }> => {
      // Get the first session (simplified)
      const session = sessions.values().next().value || null
      return { data: { session } }
    },

    onAuthStateChange: (
      callback: (event: string, session: Session | null) => void
    ): { data: { subscription: { unsubscribe: () => void } } } => {
      const unsubscribe = () => {}
      return { data: { subscription: { unsubscribe } } }
    },

    signOut: async () => {
      sessions.clear()
      return { error: null }
    },
  },
}
