import type { Meta, StoryObj } from "@storybook/react"

import { Typography, variantOptions, weightOptions } from "./typography"

const meta = {
  title: "UI/Typography",
  component: Typography,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A typography component. Add link to Figma?",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: variantOptions,
      description: "The typography variant to use",
    },
    weight: {
      control: "select",
      options: weightOptions,
      description: "The font weight to use",
    },
    children: {
      control: "text",
      description: "The content to display",
    },
  },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog",
    variant: "body-md",
    weight: "normal",
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="body-sm">
        Body Small - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="body-md">
        Body Medium - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="body-lg">
        Body Large - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="body-xl">
        Body XL - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="body-2xl">
        Body 2XL - The quick brown fox jumps over the lazy dog
      </Typography>
      <hr />
      <Typography variant="display-sm">
        Display Small - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="display-md">
        Display Medium - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="display-lg">
        Display Large - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="display-xl">
        Display XL - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography variant="display-2xl">
        Display 2XL - The quick brown fox jumps over the lazy dog
      </Typography>
    </div>
  ),
}

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-2">
      <Typography weight="thin">Thin - The quick brown fox jumps over the lazy dog</Typography>
      <Typography weight="light">Light - The quick brown fox jumps over the lazy dog</Typography>
      <Typography weight="normal">Normal - The quick brown fox jumps over the lazy dog</Typography>
      <Typography weight="medium">Medium - The quick brown fox jumps over the lazy dog</Typography>
      <Typography weight="semibold">
        Semibold - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography weight="bold">Bold - The quick brown fox jumps over the lazy dog</Typography>
      <Typography weight="extrabold">
        Extrabold - The quick brown fox jumps over the lazy dog
      </Typography>
      <Typography weight="black">Black - The quick brown fox jumps over the lazy dog</Typography>
    </div>
  ),
}
