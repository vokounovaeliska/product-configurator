import { withThemeByClassName } from "@storybook/addon-themes"
import type { Preview } from "@storybook/react"

import "@workspace/ui/globals.css"

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByClassName({
      defaultTheme: "light",
      themes: { light: "", dark: "dark" },
    }),
  ],
}

export default preview
