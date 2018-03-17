import {Children} from 'react'

// Children.toArray available with React 0.14.
function childrenToArray(children) {
  const array = []
  Children.forEach(
    children,
    (child) =>
      // Filter out nulls at the same time.
      child && array.push(child)
  )
  return array
}

export default childrenToArray
