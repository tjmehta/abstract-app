import AbstractStartable, { StopOptsType as StartableStopOptsType } from 'abstract-startable'

import BaseError from 'baseerr'
import timeout from 'timeout-then'

export class AppStopTimeoutError<DataType> extends BaseError<DataType> {}

export type OptsType = {
  stopTimeout: number
  logger: {
    info: (...args: Array<any>) => void
    error: (...args: Array<any>) => void
  }
}

export type StopOptsType = StartableStopOptsType

export default abstract class AbstractApp extends AbstractStartable {
  private logger: OptsType['logger']
  private stopTimeout: number

  constructor({ logger, stopTimeout }: OptsType) {
    super()
    this.logger = logger
    this.stopTimeout = stopTimeout
    process.on('SIGINT', this.handleSIGINT)
    process.on('SIGTERM', this.handleSIGTERM)
  }

  async start() {
    try {
      this.logger.info('starting app...')
      await super.start()
      this.logger.info('app started')
    } catch (err) {
      this.logger.error('error starting app', { err })
      throw err
    }
  }

  async stop(opts?: StopOptsType) {
    try {
      this.logger.info('stopping app...', { opts })
      const timeoutPromise = timeoutThenThrow(this.stopTimeout)
      await Promise.race([
        timeoutPromise,
        super.stop.call(this, opts).then(() => timeoutPromise.clear()),
      ])
      this.logger.info('app stopped', { opts })
    } catch (err) {
      if (opts?.force) {
        // force shutdown failed
        this.logger.error('error force stopping app', { opts, err })
        process.exit(1)
        return
      }
      // shutdown failed, try force shutdown
      this.logger.error('error stopping app', { opts, err })
      try {
        const timeoutPromise = timeoutThenThrow(this.stopTimeout)
        await Promise.race([
          timeoutPromise,
          super
            .stop({ ...opts, force: true })
            .finally(() => timeoutPromise.clear()),
        ])
      } catch (err) {
        // force shutdown failed
        this.logger.error('error force stopping app', { opts, err })
        process.exit(1)
      }
    }
  }

  private handleSIGINT = async () => {
    const signal = 'SIGINT'
    process.off(signal, this.handleSIGINT)
    this.logger.info('app received stop signal', { signal })
    await this.stop()
  }

  private handleSIGTERM = async () => {
    const signal = 'SIGTERM'
    process.off('SIGTERM', this.handleSIGTERM)
    this.logger.info('app received stop signal', { signal })
    await this.stop()
  }
}

function timeoutThenThrow(ms: number): Promise<void> & { clear(): void } {
  const timeoutPromise = timeout(ms)
  const timeoutThenErrorPromise = timeoutPromise.then(() => {
    throw new AppStopTimeoutError<{ ms: number }>('app stop timed out', {
      ms,
    })
  }) as Promise<void> & { clear(): void }
  // @ts-ignore
  timeoutThenErrorPromise.clear = () => timeoutPromise.clear()
  return timeoutThenErrorPromise
}
