import nodesFromValue from 'node/nodesFromValue'
import {map} from 'rxjs/operators/map'

const url = '/localStorage/json'

export default {
  key: 'json',
  item: 'json',
  children: (props) => {
    const {io} = props

    return io(url).pipe(
      map((value) =>
        nodesFromValue({
          ...props,
          value,
          onChange: (value) => io(url, 'SET', {value}),
        })
      )
    )
  },
}
