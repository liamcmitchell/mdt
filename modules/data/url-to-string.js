export default function urlToString(url) {
  return typeof url === 'string' ?
    url :
    '/' + url.join('/')
}
