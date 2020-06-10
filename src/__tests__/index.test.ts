import AbstractApp from '../index'
import { AppStopTimeoutError } from './../index'

const silentLogger = {
  info: (...args) => {},
  error: (...args) => {},
}
const debugLogger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.log('error:', ...args),
}
const logger = silentLogger

describe('AbstractApp', () => {
  it('should be extendable to by an App class', () => {
    class App extends AbstractApp {
      protected async _start() {
        return Promise.resolve()
      }
      protected async _stop() {
        return Promise.resolve()
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
  })

  it('should start', async () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
  })

  it('should fail to start (if _start rejects)', async () => {
    const startErr = new Error('boom')
    const startImpl = jest.fn().mockRejectedValue(startErr)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await expect(app.start()).rejects.toThrow(startErr)
    expect(startImpl).toHaveBeenCalledTimes(1)
  })

  it('should stop (stopped)', async () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.stop()
    expect(stopImpl).not.toHaveBeenCalled()
  })

  it('should force stop (stopped)', async () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.stop({ force: true })
    expect(stopImpl).not.toHaveBeenCalled()
  })

  it('should stop (started)', async () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
    await app.stop()
    expect(stopImpl).toHaveBeenCalledTimes(1)
  })

  it('should force stop (started)', async () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
    await app.stop({ force: true })
    expect(stopImpl).toHaveBeenCalledTimes(1)
    expect(stopImpl).toHaveBeenCalledWith({ force: true })
  })

  it('should exit process if force stop fails (started)', async () => {
    // @ts-ignore
    process.exit = jest.fn()
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockRejectedValue(new Error('boom'))
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
    await app.stop({ force: true })
    expect(stopImpl).toHaveBeenCalledTimes(1)
    expect(stopImpl).toHaveBeenCalledWith({ force: true })
    expect(process.exit).toHaveBeenCalledTimes(1)
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should attempt force stop (and succeed) if stop fails (started)', async () => {
    // @ts-ignore
    process.exit = jest.fn()
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
    await app.stop()
    expect(stopImpl).toHaveBeenCalledTimes(2)
    expect(stopImpl).toHaveBeenCalledWith(undefined)
    expect(stopImpl).toHaveBeenCalledWith({ force: true })
    expect(process.exit).not.toHaveBeenCalled()
  })

  it('should attempt force stop (and fail) if stop fails (started)', async () => {
    // @ts-ignore
    process.exit = jest.fn()
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockRejectedValue(new Error('boom'))
    let count = 0
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    await app.start()
    expect(startImpl).toHaveBeenCalledTimes(1)
    await app.stop()
    expect(stopImpl).toHaveBeenCalledTimes(2)
    expect(stopImpl).toHaveBeenCalledWith(undefined)
    expect(stopImpl).toHaveBeenCalledWith({ force: true })
    expect(process.exit).toHaveBeenCalledTimes(1)
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('should handle SIGINT', () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    jest.spyOn(app, 'stop')
    // @ts-ignore
    process.emit('SIGINT')
    expect(app.stop).toHaveBeenCalledTimes(1)
  })

  it('should handle SIGTERM', () => {
    const startImpl = jest.fn().mockResolvedValue(undefined)
    const stopImpl = jest.fn().mockResolvedValue(undefined)
    class App extends AbstractApp {
      protected async _start(opts) {
        return startImpl(opts)
      }
      protected async _stop(opts) {
        return stopImpl(opts)
      }
    }
    const app = new App({
      logger,
      stopTimeout: 100,
    })
    jest.spyOn(app, 'stop')
    // @ts-ignore
    process.emit('SIGTERM')
    expect(app.stop).toHaveBeenCalledTimes(1)
  })
})
