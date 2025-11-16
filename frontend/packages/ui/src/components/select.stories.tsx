import type { Meta, StoryObj } from "@storybook/react"
import { Select } from "@workspace/ui/components/select"

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component: "A select component built with Radix UI, used to select an option from a list.",
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <Select.Trigger>
        <Select.Trigger.Value placeholder="Select a fruit" />
      </Select.Trigger>
      <Select.Content>
        <Select.Content.Group>
          <Select.Content.Label>Fruits</Select.Content.Label>
          <Select.Content.Item value="apple">Apple</Select.Content.Item>
          <Select.Content.Item value="banana">Banana</Select.Content.Item>
          <Select.Content.Item value="orange">Orange</Select.Content.Item>
        </Select.Content.Group>
      </Select.Content>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <Select.Trigger>
        <Select.Trigger.Value placeholder="Select a fruit" />
      </Select.Trigger>
      <Select.Content>
        <Select.Content.Group>
          <Select.Content.Label>Fruits</Select.Content.Label>
          <Select.Content.Item value="apple">Apple</Select.Content.Item>
          <Select.Content.Item value="banana">Banana</Select.Content.Item>
        </Select.Content.Group>
        <Select.Content.Separator />
        <Select.Content.Group>
          <Select.Content.Label>Vegetables</Select.Content.Label>
          <Select.Content.Item value="carrot">Carrot</Select.Content.Item>
          <Select.Content.Item value="potato">Potato</Select.Content.Item>
        </Select.Content.Group>
      </Select.Content>
    </Select>
  ),
}
