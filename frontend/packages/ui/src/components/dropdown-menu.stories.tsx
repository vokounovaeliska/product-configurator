import type { Meta, StoryObj } from "@storybook/react"
import { LogOut, Settings, User } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A dropdown menu component. Add link to Figma?",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Label>My Account</DropdownMenu.Content.Label>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item>
          <User className="mr-2" />
          Profile
        </DropdownMenu.Content.Item>
        <DropdownMenu.Content.Item>
          <Settings className="mr-2" />
          Settings
        </DropdownMenu.Content.Item>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item variant="destructive">
          <LogOut className="mr-2" />
          Logout
        </DropdownMenu.Content.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
}

export const WithSubMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Label>My Account</DropdownMenu.Content.Label>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item>Profile</DropdownMenu.Content.Item>
        <DropdownMenu.Content.Sub>
          <DropdownMenu.Content.Sub.Trigger>Settings</DropdownMenu.Content.Sub.Trigger>
          <DropdownMenu.Content.Sub.Portal>
            <DropdownMenu.Content.Sub.Portal.Content>
              <DropdownMenu.Content.Item>Account Settings</DropdownMenu.Content.Item>
              <DropdownMenu.Content.Item>Preferences</DropdownMenu.Content.Item>
              <DropdownMenu.Content.Item>Notifications</DropdownMenu.Content.Item>
            </DropdownMenu.Content.Sub.Portal.Content>
          </DropdownMenu.Content.Sub.Portal>
        </DropdownMenu.Content.Sub>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item variant="destructive">
          <LogOut className="mr-2" />
          Logout
        </DropdownMenu.Content.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
}

export const WithShortcuts: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Label>Actions</DropdownMenu.Content.Label>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item>
          New Tab
          <DropdownMenu.Content.Item.Shortcut>⌘T</DropdownMenu.Content.Item.Shortcut>
        </DropdownMenu.Content.Item>
        <DropdownMenu.Content.Item>
          New Window
          <DropdownMenu.Content.Item.Shortcut>⌘N</DropdownMenu.Content.Item.Shortcut>
        </DropdownMenu.Content.Item>
        <DropdownMenu.Content.Item disabled>
          New Incognito Window
          <DropdownMenu.Content.Item.Shortcut>⇧⌘N</DropdownMenu.Content.Item.Shortcut>
        </DropdownMenu.Content.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Content.Group>
          <DropdownMenu.Content.Label>Account</DropdownMenu.Content.Label>
          <DropdownMenu.Content.Item>
            <User className="mr-2" />
            Profile
          </DropdownMenu.Content.Item>
          <DropdownMenu.Content.Item>
            <Settings className="mr-2" />
            Settings
          </DropdownMenu.Content.Item>
        </DropdownMenu.Content.Group>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Group>
          <DropdownMenu.Content.Label>Help</DropdownMenu.Content.Label>
          <DropdownMenu.Content.Item>Documentation</DropdownMenu.Content.Item>
          <DropdownMenu.Content.Item>Support</DropdownMenu.Content.Item>
        </DropdownMenu.Content.Group>
        <DropdownMenu.Content.Separator />
        <DropdownMenu.Content.Item variant="destructive">
          <LogOut className="mr-2" />
          Logout
        </DropdownMenu.Content.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
}
