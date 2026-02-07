import { SetupSidebarWrapper } from "@/app/_wrappers/SetupSidebarWrapper"
import { SidebarToggle } from "@/components/SetupNavigation/SidebarToggle"
import { SidebarProvider } from "@/components/SetupNavigation/useSidebar"

type Props = {
  children: React.ReactNode
}

export default function ConfiguratorLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <div className="flex flex-1 gap-6">
        <SetupSidebarWrapper />
        <SidebarToggle />
        <div className="flex-1">{children}</div>
      </div>
    </SidebarProvider>
  )
}
