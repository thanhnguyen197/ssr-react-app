import express from 'express'
import compression from 'compression'
import React from 'react'
import { StaticRouter } from 'react-router-dom'
import { renderToString } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import Loadable from 'react-loadable'
import { getBundles } from 'react-loadable/webpack'
// eslint-disable-next-line import/no-unresolved
import stats from '../build/react-loadable.json'
import App from './App'

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST)

const server = express()
server
  .disable('x-powered-by')
  .use(compression())
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', async (req, res) => {
    const context = {}

    const Root = () => (
      <StaticRouter location={req.url} context={context}>
        <App />
      </StaticRouter>
    )

    if (context.url) {
      res.redirect(context.url)
    } else {
      const modules = []
      const sheet = new ServerStyleSheet()
      const markup = renderToString(
        <Loadable.Capture report={moduleName => modules.push(moduleName)}>
          {sheet.collectStyles(<Root />)}
        </Loadable.Capture>
      )
      const styleTags = sheet.getStyleTags()

      const bundles = getBundles(stats, modules)
      const chunks = bundles.filter(bundle => bundle.file.endsWith('.js'))
      const styles = bundles.filter(bundle => bundle.file.endsWith('.css'))

      res.status(200).send(
        `<!doctype html>
            <html lang="en">
            <head>
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
                <meta name="theme-color" content="#1c4448"/>
                <title>SSR REACT APP</title>
                <meta
                  name="description"
                  content="${req.url}"
                />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:site" content="${req.url}" />
                <meta name="twitter:title" content="${req.url}" />
                <meta
                  name="twitter:description"
                  content="${req.url}"
                />
                <meta property="og:url" content="${req.url}" />
                <meta property="og:type" content="article" />
                <meta property="og:title" content="${req.url}" />
                <meta
                  property="og:description"
                  content="${req.url}"
                />
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="#070707">
                <link rel=”shortcut icon” href=/favicon.ico”>
                <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
                <link rel="manifest" href="/manifest.json">
                <link rel="preconnect dns-prefetch" href="/">
                ${process.env.NODE_ENV === 'production' ? `<script src="${assets.vendor.js}" async defer></script>` : `<script src="${assets.vendor.js}" async defer crossorigin></script>`}
                ${process.env.NODE_ENV === 'production' ? `<script src="${assets.client.js}" async defer></script>` : `<script src="${assets.client.js}" async defer crossorigin></script>`}
                ${chunks.map(chunk => process.env.NODE_ENV === 'production' ? `<script async defer src="/${chunk.file}"></script>` : `<script src="http://${process.env.HOST}:${parseInt(process.env.PORT, 10) + 1}/${chunk.file}"></script>`).join('\n')}
                ${assets.client.css ? `<link rel="preload" as="style" href="${assets.client.css}" onload="this.rel='stylesheet'">` : ''}
                ${styles.map(style => `<link rel="preload" as="style" href="${style.file}" onload="this.rel='stylesheet'">`).join('\n')}
                ${styleTags}
            </head>
            <body>
                <div id="root">${markup}</div>
                <div id="modal-root"></div>
            </body>
        </html>`
      )
    }
  })

export default server
