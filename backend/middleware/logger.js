export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const userAgent = req.get('User-Agent') || 'Unknown'
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`)
  
  next()
}

export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ERROR: ${err.message}`)
  console.error(err.stack)
  
  next(err)
}