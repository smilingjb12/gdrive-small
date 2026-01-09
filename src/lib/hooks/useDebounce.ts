import { useState, useEffect } from 'react'

/**
 * A hook that debounces a value by a specified delay.
 * Returns the debounced value which only updates after the delay has passed
 * without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 300)
 *
 * // Use debouncedSearchTerm for API calls
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     fetchResults(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if value changes before delay completes
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
