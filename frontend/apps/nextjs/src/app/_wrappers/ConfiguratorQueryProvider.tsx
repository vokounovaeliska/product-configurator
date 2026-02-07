"use client"

type Props = {
  children: React.ReactNode
}

/**
 * Wrapper for configurator and protected (setup) routes.
 * QueryClient is provided by the root Providers; this can be extended
 * with configurator-specific defaults or devtools if needed.
 */
export const ConfiguratorQueryProvider = ({ children }: Props) => {
  return <>{children}</>
}
