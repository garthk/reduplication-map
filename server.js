const express = require('express');
const path = require('path');

/**
 * Make our application
 *
 * @param {string} staticdir Where to find `index.html` and static assets
 */
function mkapp(staticdir) {
  const app = express();

  app.use(express.static(staticdir));

  app.get("/", function (request, response) {
    response.sendFile(path.join(staticdir, 'index.html'));
  });

  return app;
}

/**
 * Have an app listen on a port.
 *
 * @param {Express} app The app
 * @param {number} port The port
 */
function listen(app, port) {
  var listener = app.listen(port, function () {
    const { address, family, port } = listener.address();
    console.log(`Listening on ${family} ${address} ${port}`);
  });
}

if (!module.parent) {
  const app = mkapp(path.join(__dirname, 'docs'));
  listen(app, process.env.PORT || '8080');
}
