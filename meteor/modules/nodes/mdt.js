/* global mdt */

export default {
  key: "mdt",
  item: () => "mdt",
  children: () => [
    mdt.require("/config").mdtVersion
  ]
}
