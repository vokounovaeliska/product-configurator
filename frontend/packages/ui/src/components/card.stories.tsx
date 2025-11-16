import type { Meta, StoryObj } from "@storybook/react"
import { Card } from "@workspace/ui/components/card"

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: "A card component that can be used to group related content.",
      },
    },
  },
  args: {
    className: "max-w-xl",
    children: (
      <>
        <Card.Header>
          <Card.Header.Title>Card Title</Card.Header.Title>
          <Card.Description>Card Description</Card.Description>
        </Card.Header>
        <Card.Content>Card Content</Card.Content>
        <Card.Footer>Card Footer</Card.Footer>
      </>
    ),
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
