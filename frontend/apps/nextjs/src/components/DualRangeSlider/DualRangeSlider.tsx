"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Input } from "@workspace/ui/components/input"

type Props = {
  min: number
  max: number
  step: number
  fromValue: number
  toValue: number
  onFromChange: (value: number) => void
  onToChange: (value: number) => void

  isSliderOnly?: boolean

  minLabel?: string

  maxLabel?: string
}

export const DualRangeSlider = ({
  min,
  max,
  step,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  isSliderOnly = false,
  minLabel = "Min",
  maxLabel = "Max",
}: Props) => {
  const clampedFrom = useMemo(
    () => Math.min(Math.max(Number(fromValue) || min, min), max),
    [fromValue, min, max],
  )
  const clampedTo = useMemo(() => {
    const n = Number(toValue)
    const v = Number.isNaN(n) ? max : n
    return Math.min(Math.max(v, min), max)
  }, [toValue, min, max])

  const [value, setValue] = useState<[number, number]>([clampedFrom, clampedTo])
  useEffect(() => {
    setValue([clampedFrom, clampedTo])
  }, [clampedFrom, clampedTo])

  const handleValueChange = useCallback(
    (v: number[]) => {
      const from = v[0] ?? clampedFrom
      const to = v[1] ?? clampedTo
      setValue([from, to])
      onFromChange(from)
      onToChange(to)
    },
    [clampedFrom, clampedTo, onFromChange, onToChange],
  )

  const [fromInput, setFromInput] = useState(String(clampedFrom))
  const [toInput, setToInput] = useState(String(clampedTo))
  useEffect(() => setFromInput(String(clampedFrom)), [clampedFrom])
  useEffect(() => setToInput(String(clampedTo)), [clampedTo])

  const handleFromBlur = useCallback(() => {
    const n = Number.parseFloat(fromInput)
    const v = Number.isNaN(n) ? min : Math.min(Math.max(n, min), clampedTo)
    setFromInput(String(v))
    onFromChange(v)
  }, [fromInput, min, clampedTo, onFromChange])

  const handleToBlur = useCallback(() => {
    const n = Number.parseFloat(toInput)
    const v = Number.isNaN(n) ? max : Math.min(Math.max(n, clampedFrom), max)
    setToInput(String(v))
    onToChange(v)
  }, [toInput, max, clampedFrom, onToChange])

  const rangeSpan = max - min || 1
  const minStepsBetweenThumbs = step > 0 ? Math.max(0, Math.ceil(step / rangeSpan) - 1) : 0

  return (
    <div className="space-y-4">
      {!isSliderOnly && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="dual-range-from"
              className="text-sm font-medium"
            >
              {minLabel}
            </label>
            <Input
              id="dual-range-from"
              type="number"
              min={min}
              max={max}
              step={step}
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              onBlur={handleFromBlur}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="dual-range-to"
              className="text-sm font-medium"
            >
              {maxLabel}
            </label>
            <Input
              id="dual-range-to"
              type="number"
              min={min}
              max={max}
              step={step}
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onBlur={handleToBlur}
            />
          </div>
        </div>
      )}

      <SliderPrimitive.Root
        className="relative flex w-full touch-none items-center select-none"
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minStepsBetweenThumbs={minStepsBetweenThumbs}
        aria-label={`${minLabel} – ${maxLabel}`}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary/30" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  )
}
