import type { Meta, StoryObj } from "@storybook/react"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

import { Button } from "./button"
import { Icon, type IconProps } from "./icon"

const meta = {
  title: "UI/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A flexible icon component that can use any Lucide icon. Add link to Figma?",
      },
    },
  },
  argTypes: {
    as: {
      control: "select",
      options: ["AlertCircle", "CheckCircle", "Info", "XCircle"],
      mapping: {
        AlertCircle,
        CheckCircle,
        Info,
        XCircle,
      },
      description: "The Lucide icon component to use",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the icon",
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply",
    },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: Partial<IconProps>
}

export const Default: Story = {
  args: {
    as: Info,
    size: "md",
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon
        as={Info}
        size="sm"
      />
      <Icon
        as={Info}
        size="md"
      />
      <Icon
        as={Info}
        size="lg"
      />
    </div>
  ),
}

export const StatusIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Icon
        as={CheckCircle}
        className="text-green-500"
      />
      <Icon
        as={AlertCircle}
        className="text-yellow-500"
      />
      <Icon
        as={XCircle}
        className="text-red-500"
      />
      <Icon
        as={Info}
        className="text-blue-500"
      />
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
      >
        <Icon as={Info} />
      </Button>
      <Button
        variant="outline"
        size="icon"
      >
        <Icon as={AlertCircle} />
      </Button>
      <Button
        variant="outline"
        size="icon"
      >
        <Icon as={CheckCircle} />
      </Button>
    </div>
  ),
}
