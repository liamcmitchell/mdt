const node = {
  key: "dummy",
  depth: 0,
  item: "dummy",
  handlers: function() {
    return {
      enter: () => console.log("yo, this is " + this.key + " from level " + this.depth)
    }
  },
  nodes() {
    if (this.depth < 100) {
      var newDepth = this.depth + 1
      return ["one", "two", "three", "four", "five"].map(text =>
        Object.assign({}, node, {
          key: text,
          depth: newDepth,
          item: text,
          focusable: text === "five" ? false : true
        })
      )
    }
    else {
      return []
    }
  }
}

export default node
