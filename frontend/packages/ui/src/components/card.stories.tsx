import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

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

export const LoginForm: Story = {
  render: () => (
    <Card className="max-w-sm">
      <Card.Header>
        <Card.Header.Title>Sign in</Card.Header.Title>
        <Card.Description>Enter your credentials to access your account.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
          />
        </div>
      </Card.Content>
      <Card.Footer>
        <Button className="w-full">Sign in</Button>
      </Card.Footer>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Header>
        <Card.Header.Title>Notifications</Card.Header.Title>
        <Card.Description>You have 3 unread messages.</Card.Description>
        <Card.Header.Action>
          <Button
            variant="ghost"
            size="sm"
          >
            Mark all as read
          </Button>
        </Card.Header.Action>
      </Card.Header>
      <Card.Content>
        <p className="text-sm text-muted-foreground">
          Your notifications will appear here. Check back regularly for updates.
        </p>
      </Card.Content>
    </Card>
  ),
}
