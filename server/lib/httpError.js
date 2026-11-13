/** An error with an HTTP status. Route handlers throw it and the error middleware turns it into JSON. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
