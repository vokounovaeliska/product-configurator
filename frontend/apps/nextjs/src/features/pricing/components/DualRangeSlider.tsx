"use client"

import { useCallback, useMemo, useState } from "react"
import { Input } from "@workspace/ui/components/input"

type Props = {
  min: number
  max: number
  step: number
  fromValue: number
  toValue: number
  onFromChange: (value: number) => void
  onToChange: (value: number) => void
}

export const DualRangeSlider = ({
  min,
  max,
  step,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
}: Props) => {
  const [fromInput, setFromInput] = useState(String(fromValue))
  const [toInput, setToInput] = useState(String(toValue))

  const clampedFrom = useMemo(
    () => Math.min(Math.max(Number(fromValue) || min, min), max),
    [fromValue, min, max],
  )
  const clampedTo = useMemo(() => {
    const n = Number(toValue)
    const v = Number.isNaN(n) ? max : n
    return Math.min(Math.max(v, min), max)
  }, [toValue, min, max])

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

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label
          htmlFor="dual-range-from"
          className="text-sm font-medium"
        >
          From
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
          To
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
  )
}
