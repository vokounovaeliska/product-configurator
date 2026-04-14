import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"

type Props = {
  children: React.ReactNode
}

export default function EmbedLayout({ children }: Props) {
  return (
    <ConfiguratorQueryProvider>
      <div
        className="flex w-full flex-col bg-background"
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {children}
      </div>
    </ConfiguratorQueryProvider>
  )
}
