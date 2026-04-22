import {
  createElement,
  type ElementType,
  type FC,
  type HTMLAttributes,
  type HTMLProps,
  type ReactNode,
} from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const typographyVariantsConfig = {
  variant: {
    "body-sm": "text-sm",
    "body-md": "text-base",
    "body-lg": "text-lg",
    "body-xl": "text-xl",
    "body-2xl": "text-2xl",
    "display-sm": "font-display text-lg",
    "display-md": "font-display text-xl",
    "display-lg": "font-display text-2xl",
    "display-xl": "font-display text-3xl",
    "display-2xl": "font-display text-4xl",
    "display-3xl": "font-display text-5xl",
  },
  weight: {
    thin: "font-thin",
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    extrabold: "font-extrabold",
    bold: "font-bold",
    black: "font-black",
  },
}

const typographyVariants = cva("", {
  variants: typographyVariantsConfig,
  defaultVariants: {
    variant: "body-md",
    weight: "normal",
  },
})

export type TypographyProps = HTMLProps<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    asChild?: boolean
    as?: ElementType
    children?: ReactNode
    className?: string
  }

const typographyClass = (
  weight?: TypographyProps["weight"],
  variant?: TypographyProps["variant"],
) => cn(typographyVariants({ weight, variant }))

const Typography: FC<TypographyProps> = ({
  asChild,
  as,
  weight,
  variant,
  children,
  className,
  ...props
}) => {
  const computedClassName = cn(typographyClass(weight, variant), className)

  if (asChild) {
    return (
      <Slot
        {...props}
        className={computedClassName}
      >
        {children}
      </Slot>
    )
  }

  const rest = { ...props, className: computedClassName }
  if (as) {
    return createElement(as, rest, children)
  }
  return <p {...(rest as HTMLAttributes<HTMLParagraphElement>)}>{children}</p>
}

const variantOptions = Object.keys(typographyVariantsConfig.variant)
const weightOptions = Object.keys(typographyVariantsConfig.weight)

export { Typography, typographyVariants, variantOptions, weightOptions }
