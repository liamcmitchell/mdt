import {PropTypes} from 'react'
import {contextProviderComponent, withContextFunction} from 'provide-context'

const types = {
  io: PropTypes.func.isRequired
}

export const IOProvider = contextProviderComponent(types, 'IOProvider')

export const withIO = withContextFunction(types, 'withIO')
