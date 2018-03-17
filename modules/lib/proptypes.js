import PropTypes from 'prop-types'

export default {
  JSON: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
}
