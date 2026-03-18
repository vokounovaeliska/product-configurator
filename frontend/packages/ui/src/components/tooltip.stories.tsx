import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@workspace/ui/components/button"
import { Tooltip } from "@workspace/ui/components/tooltip"

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          "A tooltip component for displaying additional information on hover or focus. Requires Tooltip.Provider wrapper.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button variant="outline">Hover me</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Add to library</p>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  ),
}

export const WithLongContent: Story = {
  render: () => (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button variant="outline">Hover for details</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>This is a longer tooltip that provides more context about the action.</p>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  ),
}

export const DifferentPositions: Story = {
  render: () => (
    <Tooltip.Provider>
      <div className="flex flex-wrap gap-8 p-16">
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button variant="outline">Top</Button>
          </Tooltip.Trigger>
          <Tooltip.Content side="top">
            <p>Tooltip on top</p>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button variant="outline">Right</Button>
          </Tooltip.Trigger>
          <Tooltip.Content side="right">
            <p>Tooltip on right</p>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button variant="outline">Bottom</Button>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <p>Tooltip on bottom</p>
          </Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button variant="outline">Left</Button>
          </Tooltip.Trigger>
          <Tooltip.Content side="left">
            <p>Tooltip on left</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </Tooltip.Provider>
  ),
}
