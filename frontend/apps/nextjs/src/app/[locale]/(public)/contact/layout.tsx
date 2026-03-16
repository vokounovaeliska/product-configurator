import { SetupSidebarWrapper } from "@/app/_wrappers/SetupSidebarWrapper"
import { getSession } from "@/lib/auth/session"

type Props = {
  children: React.ReactNode
}

/**
 * Layout for contact page: when user is logged in, show sidebar.
 * Hamburger toggle is in the header (mobile only).
 */
export default async function ContactLayout({ children }: Props) {
  const { session } = await getSession()
  const isLoggedIn = session?.isValid ?? false

  if (!isLoggedIn) {
    return <>{children}</>
  }

  return (
    <div className="relative flex gap-6">
      <SetupSidebarWrapper />
      <div className="flex-1">{children}</div>
    </div>
  )
}
