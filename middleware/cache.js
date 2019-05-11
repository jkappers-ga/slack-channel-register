import cache from 'memory-cache'

export default (req, res, next) => {
  const key = `__cache__${req.originalUrl || req.url}`
  const cached = cache.get(key)

  if (cached) {
    res.send(cached)
    return
  }

  res.__send = res.send
  res.send = body => {
    cache.put(key, body, 5 * 1000)
    res.__send(body)
  }
  next()
}
