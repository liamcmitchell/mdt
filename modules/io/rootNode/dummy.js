const node = {
  key: "dummy",
  depth: 0,
  item: "dummy",
  handlers: function() {
    return [{
      key: 'enter',
      fn: () => console.log("yo, this is " + this.key + " from level " + this.depth)
    }]
  },
  children() {
    if (this.depth < 100) {
      var newDepth = this.depth + 1
      return ["one", "two", "three", "four", "five"].map(text => ({
        ...node,
        key: text,
        depth: newDepth,
        item: text,
        focusable: text === "five" ? false : true
      }))
    }
    else {
      return []
    }
  }
}

export default node
