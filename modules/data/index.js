import Router from './router'

// Top level API
export default function Data(sources) {
  this.router = new Router(sources)

  this.observable = url => {
    return this.router.handle({
      url: url,
      method: 'OBSERVABLE'
    })
  }

  this.set = (url, data) => {
    return this.router.handle({
      url: url,
      method: 'SET',
      data: data
    })
  }
}
