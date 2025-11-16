import type { Meta, StoryObj } from "@storybook/react"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: "A skeleton component used to show loading states with a pulsing animation.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Skeleton className="h-10 w-sm" />,
}

export const WithCard: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <Card.Header.Title>Static title</Card.Header.Title>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
      </Card.Content>
    </Card>
  ),
}
