import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    docs: {
      description: {
        component: "A label component built with Radix UI, used to label form controls.",
      },
    },
  },
  argTypes: {
    htmlFor: {
      description: "The ID of the form control this label is associated with",
      control: "text",
    },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: "Email" },
}

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="input">Email</Label>
      <Input
        type="text"
        id="input"
        placeholder="email@company.com"
      />
    </div>
  ),
}
