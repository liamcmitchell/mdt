const node = {
  key: "dummy",
  depth: 0,
  item: "dummy",
  handlers() {
    return {
      enter: () => console.log("yo, this is " + this.key)
    }
  },
  nodes() {
    if (this.depth < 10) {
      var newDepth = this.depth + 1
      return "abcde".split("").map(letter =>
        Object.assign({}, node, {
          key: letter,
          depth: newDepth,
          item: () => letter
        })
      ).concat("I'm a plain string.")
    }
    else {
      return []
    }
  }
}

export default node
