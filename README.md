# abstract-app

An Abstract Application Class that handles kill signals (SIGINT and SIGTERM) and enforces stop timeout

# Installation

```sh
npm i --save abstract-app
```

# Usage

#### Supports both ESM and CommonJS

```js
// esm
import AbstractStartable from 'abstract-startable`
// commonjs
const AbstractStartable = require('abstract-startable')
```

#### Define a AppClass and start the app

```js
import { createServer } from 'http'

class MyApp extends AbstractApp {
  constructor() {
    super({
      // required opts
      logger: console,
      stopTimeout: 15*1000
    })
    this.handle
    this.server = createServer((req, res) => {
      res.statusCode = 200;
      res.end('Hello World');
    })
  }
  protected async _start() {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(3000, () => {
        this.server.removeListener('error', reject)
        resolve()
      })
    })
  }
  protected async _stop() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }
}

const app = new MyApp()
await app.start()
console.log(`app pid: ${process.pid}`)
```

#### Stop the app

```js
/* ... see example above ... */
const app = new MyApp()
await app.start()
console.log(`app pid: ${process.pid}`)
await app.stop()
```

#### Stop failures

- If the app fails to stop the app will be forced to shutdown (force: true)
- If the app fails to stop within the `stopTimeout` it will be force shutdown

### Signals and Logging

Start the app

```sh
> node app.js
starting app...
app started
app started with pid: 98850
```

Send the app SIGINT

```sh
> kill -SIGINT 98850
```

App logs after stop

```sh
stopping app...
app stopped
```

App logs if stop errors

```sh
stopping app...
error stopping app {
  err: Error: boom
      at filename:10:17
}
```

# License

MIT
