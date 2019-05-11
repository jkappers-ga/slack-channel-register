export default (req, res, next) => {
  res.locals.isAuthorized = Boolean(req.session.accessToken)
  next()
}
