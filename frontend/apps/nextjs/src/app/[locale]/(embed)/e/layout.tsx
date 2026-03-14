import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"

type Props = {
  children: React.ReactNode
}

export default function EmbedLayout({ children }: Props) {
  return (
    <ConfiguratorQueryProvider>
      <div
        className="-m-6 -mt-16 flex min-h-dvh flex-col overflow-y-auto bg-background sm:min-h-[450px] lg:-m-12 lg:-mt-30 lg:h-dvh lg:min-h-[600px] lg:overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {children}
      </div>
    </ConfiguratorQueryProvider>
  )
}
