# MDT
MDT yo

## Philosophy
- **Config is always preferred to code.** Config is declarative, static, constrained, dependable, migratable.
- **URLs for everything.** Urls are well understood and work. Accessing and manipulating data through a unified URL system means we can take advantage of existing architecture like caching, routing and access control.
- **JSON everywhere.** JSON is the lowest common denominator data format. Embrace it. Everything should read and write pure JSON. An exception being locally executable code.

## TODO
- Data should accept arrays as urls
- Combine path and editing into cursor
- Rename item to value, values come first. Override with view function if necessary
- Data fn should be passed as prop

Put everything into data
allow the following API:
data('/user')
data(['user', 'login'])
data(['/user', '/user/login'])
data([['user'], ['user', 'login']])
data({
  user: '/user',
  userLogin: '/user/login'
})
data({
  user: ['user'],
  userLogin: ['user', 'login']
})

combineLatest as expected
renderLatest like combinelatest but returns react component, optional loading component
