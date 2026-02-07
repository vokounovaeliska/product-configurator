declare module "magic-wand-tool" {
  type ImageLike = {
    data: Uint8Array
    width: number
    height: number
    bytes: number
  }

  type FloodFillResult = {
    data: Uint8Array
    width: number
    height: number
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  }

  export function floodFill(
    image: ImageLike,
    px: number,
    py: number,
    colorThreshold: number,
    mask?: Uint8Array,
    shouldIncludeBorders?: boolean,
  ): FloodFillResult | null
}
