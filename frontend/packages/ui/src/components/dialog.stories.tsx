import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          "A dialog component for displaying modal content. Built with Radix UI for accessibility.",
      },
    },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>Dialog Title</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            This is a description of the dialog content. It provides context for the user.
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>
        <Dialog.Content.Footer>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}

export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button variant="destructive">Delete</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>Are you sure?</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            This action cannot be undone. This will permanently delete the item.
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>
        <Dialog.Content.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.Close>
          <Button variant="destructive">Delete</Button>
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  ),
}
