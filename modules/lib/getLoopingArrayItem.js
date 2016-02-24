// Access items in an array as if it looped infinitely.
export default function getLoopingArrayItem(array, index) {
  if (!array) throw new Error('Array required')
  if (array.length === 0) return undefined
  // Loop to start.
  while (index >= array.length) {
    index -= array.length
  }
  // Loop to end.
  while (index < 0) {
    index += array.length
  }
  return array[index]
}
