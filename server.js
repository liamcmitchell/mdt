import express from "express"
import index from "index"

const server = express()
  .get("/", index)
  .listen(3000)

// HMR support.
if (module.hot) {

  // Allow this module to reload.
  module.hot.accept()

  // Dispose handler (called when this module is being reloaded).
  // This should undo all side effects created above.
  module.hot.dispose(() => {
    server.close()
  })

}
