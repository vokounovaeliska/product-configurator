import type { Meta, StoryObj } from "@storybook/react"
import { Button, sizeOptions, variantOptions } from "@workspace/ui/components/button"

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "A button component. Add link to Figma?",
      },
    },
  },
  args: {
    variant: "default",
    children: "Button",
    size: "default",
    asChild: false,
    disabled: false,
  },
  argTypes: {
    children: {
      description: "Text to display inside the button",
    },
    variant: {
      description: "The variant of the button",
      control: "select",
      options: variantOptions,
    },
    size: {
      description: "The size of the button",
      control: "radio",
      options: sizeOptions,
    },
    disabled: {
      description: "Whether the button is disabled",
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: "default" },
}

export const Destructive: Story = {
  args: { variant: "destructive" },
}

export const Outline: Story = {
  args: { variant: "outline" },
}

export const Secondary: Story = {
  args: { variant: "secondary" },
}

export const Ghost: Story = {
  args: { variant: "ghost" },
}

export const Link: Story = {
  args: { variant: "link" },
}

export const SizeSM: Story = {
  args: { size: "sm" },
}

export const SizeMD: Story = {
  args: { size: "default" },
}

export const SizeLG: Story = {
  args: { size: "lg" },
}

export const SizeIcon: Story = {
  args: { size: "icon", children: "🚀" },
}

export const Disabled: Story = {
  args: { disabled: true },
}
