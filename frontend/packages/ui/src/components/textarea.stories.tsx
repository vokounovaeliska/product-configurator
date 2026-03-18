import type { Meta, StoryObj } from "@storybook/react"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: "A textarea component for multi-line text input.",
      },
    },
  },
  args: {
    placeholder: "Type your message here...",
    className: "min-w-[320px]",
  },
  argTypes: {
    disabled: {
      description: "Whether the textarea is disabled",
      control: "boolean",
    },
    readOnly: {
      description: "Whether the textarea is read only",
      control: "boolean",
    },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    value: "This is some pre-filled content in the textarea.",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Disabled textarea content",
  },
}

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "Read only textarea content",
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea
        id="message"
        placeholder="Type your message here..."
      />
    </div>
  ),
}
