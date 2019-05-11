import dotenv from 'dotenv'
import url from 'url'
import express from 'express'
import session from 'express-session'
import request from 'request-promise-native'
import locals from './middleware/locals'
import authorize from './middleware/authorize'
import cache from './middleware/cache'

dotenv.config()

const {
  PORT,
  SECRET_KEY_BASE,
  SLACK_APP_CLIENT_ID,
  SLACK_APP_SECRET_ID,
  SLACK_APP_REDIRECT_URI
} = process.env

const app = express()
app.set('view engine', 'ejs')
app.use(express.static(`${__dirname}/public`))
app.use(session({
  secret: SECRET_KEY_BASE,
  resave: true,
  saveUninitialized: false
}))
app.use(locals)

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

app.get('/', authorize, cache, (req, res) => {
  request({
    url: 'https://slack.com/api/conversations.list',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${req.session.accessToken}`
    }
  }).then(body => {
    const { channels } = JSON.parse(body)
    res.render('index', { channels })
  })
})

app.get('/hi', (req, res) => {
  if (res.locals.isAuthorized) {
    res.redirect('/')
  } else {
    const authUrl = url.format({
      protocol: 'https',
      hostname: 'slack.com',
      pathname: '/oauth/authorize',
      query: {
        client_id: SLACK_APP_CLIENT_ID,
        redirect_uri: SLACK_APP_REDIRECT_URI,
        scope: 'channels:read groups:read'
      }
    })

    res.render('hi', { authUrl })
  }
})

app.get('/bye', (req, res) => {
  delete req.session.accessToken
  res.locals.isAuthorized = false
  res.redirect('hi')
})

app.get('/oauth', (req, res) => {
  request({
    method: 'GET',
    url: 'https://slack.com/api/oauth.access',
    qs: {
      code: req.query.code,
      client_id: SLACK_APP_CLIENT_ID,
      client_secret: SLACK_APP_SECRET_ID
    }
  }).then(body => {
    const data = JSON.parse(body)
    req.session.accessToken = data.access_token; // eslint-disable-line
    res.redirect('/')
  })
})
