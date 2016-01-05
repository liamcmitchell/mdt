import Router from './router'

// Top level API
export default function Data(sources) {
  this.router = new Router(sources)

  this.observable = url => {
    return this.router.handle(url, {
      url: url,
      method: 'OBSERVABLE'
    })
  }
}
