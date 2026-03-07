import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"

type Props = {
  children: React.ReactNode
}

export default function EmbedLayout({ children }: Props) {
  return (
    <ConfiguratorQueryProvider>
      <div className="-m-6 -mt-16 flex h-dvh min-h-[350px] flex-col overflow-hidden bg-background sm:min-h-[450px] lg:-m-12 lg:-mt-30 lg:min-h-[600px]">
        {children}
      </div>
    </ConfiguratorQueryProvider>
  )
}
