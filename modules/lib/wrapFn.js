// Output a single wrapper function which delegates to the latest fn.
// For use with .scan()
export default function wrapFn(wrapper, fn) {
  if (wrapper.state) {
    wrapper.state.fn = fn
    return wrapper
  }
  else {
    const state = {fn}
    wrapper = function() {
      return state.fn.apply(this, arguments)
    }
    wrapper.state = state
    return wrapper
  }
}
