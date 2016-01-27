import express from 'express'
import api from 'api'

export default function(req, res, next) {
  console.log(req)
  res.end('"yo"')
}
