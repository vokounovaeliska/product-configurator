import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@workspace/ui/components/button"
import { Popover } from "@workspace/ui/components/popover"

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          "A popover component built with Radix UI, used to display content in a floating panel.",
      },
    },
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="outline">Open Popover</Button>
      </Popover.Trigger>
      <Popover.Content>
        <div>This is the content</div>
      </Popover.Content>
    </Popover>
  ),
}

export const DifferentPositions: Story = {
  render: () => (
    <div className="grid place-content-center gap-10">
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Right</Button>
        </Popover.Trigger>
        <Popover.Content side="right">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Right Popover</h4>
            <p className="text-sm text-muted-foreground">
              This popover appears to the right of the trigger.
            </p>
          </div>
        </Popover.Content>
      </Popover>

      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Left</Button>
        </Popover.Trigger>
        <Popover.Content side="left">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Left Popover</h4>
            <p className="text-sm text-muted-foreground">
              This popover appears to the left of the trigger.
            </p>
          </div>
        </Popover.Content>
      </Popover>

      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Bottom</Button>
        </Popover.Trigger>
        <Popover.Content side="bottom">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Bottom Popover</h4>
            <p className="text-sm text-muted-foreground">This popover appears below the trigger.</p>
          </div>
        </Popover.Content>
      </Popover>

      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Top</Button>
        </Popover.Trigger>
        <Popover.Content side="top">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Top Popover</h4>
            <p className="text-sm text-muted-foreground">This popover appears above the trigger.</p>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  ),
}
