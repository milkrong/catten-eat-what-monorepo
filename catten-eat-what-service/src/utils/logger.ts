export class Logger {
  constructor(private readonly service: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.service}] INFO:`, message, ...args);
  }

  error(message: string | Error, ...args: any[]): void {
    console.error(`[${this.service}] ERROR:`, message, ...args);
    
    // TODO: Re-implement error reporting when we find a Bun-compatible solution
    if (message instanceof Error) {
      console.error(message);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.service}] WARN:`, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.service}] DEBUG:`, message, ...args);
    }
  }
} 