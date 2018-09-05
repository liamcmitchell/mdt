import {of} from 'rxjs'
import colors from 'lib/colors'

export default () =>
  of({
    padding: '10px 20px',
    ...colors.solarizedDark,
  })
