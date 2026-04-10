const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/cf-api',
    createProxyMiddleware({
      target: 'https://api.cloudflare.com',
      changeOrigin: true,
      pathRewrite: { '^/cf-api': '' },
    })
  );
};
