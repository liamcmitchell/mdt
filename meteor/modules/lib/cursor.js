// A cursor represents the user when navigating UI.
// This module creates a cursor wrapper (cursor cursor?) that may or may not
// have the cursor but can call the cursor to itself.
// Create a node in the tree by calling createChild(childKey).
// Parents contain no references to children so children will not be updated
// when parent state changes, tree must be recreated.

// path is an array of child keys. The last child has the cursor.
// If path is null, we are not on the path.
function Cursor(path, setPath) {
  this.path = path
  this.setPath = setPath
  // Cursor is on path if we have received an array.
  this.isOnPath = !!path
  // We "have the cursor" if we have a path but no child key.
  this.isHere = path && path.length === 0
}

// Create a child with relative path and setPath.
Cursor.prototype.createChild = function(key) {
  if (!key) {
    throw new Error("Child node must have a key.")
  }

  // Only pass on child path if the child is on the path.
  var childPath = this.path && this.path[0] === key ? this.path.slice(1) : null

  // Always prepend child key before passing up.
  // A child can never push the cursor back up the tree.
  var childSetPath = function(newPath) {
    this.setPath([key].concat(newPath || []))
  }.bind(this)

  return new Cursor(childPath, childSetPath)
}

module.exports = Cursor
