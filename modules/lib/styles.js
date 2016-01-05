// Merges styles
const styles = function(...items) {
  return Object.assign({}, ...items)
}

// Shared styles
Object.assign(styles, {
  row: {
    display: 'flex',
    flexDirection: 'row'
  },
  col: {
    display: 'flex',
    flexDirection: 'column'
  },
  flex: {
    flex: 1
  },
  defaultPadding: "10px 20px"
})

export default styles
