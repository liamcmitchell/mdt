import _ from 'underscore'

export default function urlToArray(url) {
  return _.isArray(url) ?
    url :
    _.filter(url.split('/'))
}
