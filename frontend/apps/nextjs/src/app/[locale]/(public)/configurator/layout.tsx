import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"
import { SetupSidebarWrapper } from "@/app/_wrappers/SetupSidebarWrapper"
import { SidebarToggle } from "@/components/SetupNavigation/SidebarToggle"
import { SidebarProvider } from "@/components/SetupNavigation/useSidebar"

type Props = {
  children: React.ReactNode
}

export default function ConfiguratorLayout({ children }: Props) {
  return (
    <ConfiguratorQueryProvider>
      <SidebarProvider>
        <div className="flex flex-1 gap-6">
          <SetupSidebarWrapper />
          <SidebarToggle />
          <div className="flex-1">{children}</div>
        </div>
      </SidebarProvider>
    </ConfiguratorQueryProvider>
  )
}
