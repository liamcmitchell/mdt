import createRouter from './createRouter'

// Top level API
export default function Data(sources) {
  const route = createRouter(sources)

  this.observable = url => {
    return route({
      url: url,
      method: 'OBSERVE'
    })
  }

  this.set = (url, data) => {
    return route({
      url: url,
      method: 'SET',
      data: data
    })
  }

  this.call = req => {
    if (!req.method) {
      throw new Error('Method name is required')
    }

    return route(req)
  }
}
