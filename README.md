# MDT
MDT yo

## Philosophy
- **Config is always preferred to code.** Config is declarative, static, constrained, dependable, migratable.
- **URLs for everything.** Urls are well understood and work. Accessing and manipulating data through a unified URL system means we can take advantage of existing architecture like caching, routing and access control.
- **JSON everywhere.** JSON is the lowest common denominator data format. Embrace it. Everything should read and write pure JSON. An exception being locally executable code.
- **Javascript only.** With React and inline styles, there is no more need for writing separate HTML or CSS. Shed a tear and move on with life.
- **Synchronous and reactive.**

## Components

### Meteor App
`meteor/`
The MDT app/service/UI to be run locally.
Built with MDT.

### Meteor MDT Package
`packages/mdt/`
Required for MDT to be used in a Meteor app.
Provides runtime functionality through the `mdt` object.

### MDT Runtime API
Used to interact with MDT sources.

### Source
Single source for data of the same type. Similar to Flux stores.
As well as handling read/write operations, sources also contain schema describing the data and data operations.

### Input Components
Takes in schema, value...
