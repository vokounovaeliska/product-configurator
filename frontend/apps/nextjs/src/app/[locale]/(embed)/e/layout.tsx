import { ConfiguratorQueryProvider } from "@/app/_wrappers/ConfiguratorQueryProvider"

type Props = {
  children: React.ReactNode
}

export default function EmbedLayout({ children }: Props) {
  return (
    <ConfiguratorQueryProvider>
      <div className="-m-6 -mt-16 min-h-screen bg-background lg:-m-12 lg:-mt-30">{children}</div>
    </ConfiguratorQueryProvider>
  )
}
