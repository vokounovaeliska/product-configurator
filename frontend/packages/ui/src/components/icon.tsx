import type { ComponentType, SVGProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const iconVariantsConfig = {
  size: {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
    xl: "size-6",
    "2xl": "size-8",
  },
}

export const iconVariants = cva("", {
  variants: iconVariantsConfig,
  defaultVariants: {
    size: "md",
  },
})

type IconVariants = VariantProps<typeof iconVariants>

export type IconProps = IconVariants & {
  as: ComponentType<SVGProps<SVGSVGElement>>
} & React.HTMLAttributes<SVGSVGElement>

export const Icon = ({ as: IconComponent, size, className, ...props }: IconProps) => {
  return (
    <IconComponent
      className={cn("shrink-0", iconVariants({ size }), className)}
      {...props}
    />
  )
}
