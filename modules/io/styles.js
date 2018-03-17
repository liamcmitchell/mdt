import {of} from 'rxjs/observable/of'
import colors from 'lib/colors'

export default () =>
  of({
    padding: '10px 20px',
    ...colors.solarizedDark,
  })
