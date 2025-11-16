import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: "A basic input component with various states and types.",
      },
    },
  },
  args: {
    placeholder: "Enter text...",
    className: "max-w-sm",
  },
  argTypes: {
    type: {
      description: "The type of input",
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    disabled: {
      description: "Whether the input is disabled",
      control: "boolean",
    },
    readOnly: {
      description: "Whether the input is read only",
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    value: "Hello World",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Disabled input",
  },
}

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "Read only text",
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        type="email"
        id="email"
        placeholder="Enter your email"
      />
    </div>
  ),
}

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        type="email"
        id="email"
        placeholder="Enter your email"
        aria-invalid="true"
        aria-describedby="email-error"
      />
      <p
        id="email-error"
        className="text-sm text-destructive"
      >
        Please enter a valid email address
      </p>
    </div>
  ),
}
