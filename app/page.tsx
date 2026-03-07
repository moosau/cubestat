"use client"

import RubiksTimer from "../rubiks-timer"

export default function Page() {
  // Temporary: bypass auth while Supabase is down
  const mockUser = {
    id: "temp-user",
    email: "user@example.com",
    user_metadata: {
      full_name: "User",
    },
  }

  return <RubiksTimer user={mockUser} />
}
