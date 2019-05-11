export default (req, res, next) => {
  if (req.session.accessToken) {
    next()
  } else {
    res.redirect('/hi')
  }
}
