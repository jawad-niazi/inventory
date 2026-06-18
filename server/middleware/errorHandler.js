// Error handling middleware
module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 5MB)' })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: err.message || 'Internal Server Error' })
}
