export default class FidsPromise<T> {
  private state: "pending" | "fulfilled" | "rejected" = "pending";
  private value?: T;
  private reason?: any;

  private _thenCallbacks: ((v: T) => void)[] = [];
  private _excCallbacks: ((e: any) => void)[] = [];
  private _atEndCallbacks: (() => void)[] = [];

  constructor(
    exec: (resolve: (v: T) => void, reject: (e: any) => void) => void
  ) {
    try {
      exec(
        (v: T) => this._resolve(v),
        (e: any) => this._reject(e)
      );
    } catch (err) {
      this._reject(err);
    }
  }

  private _resolve(v: T) {
    if (this.state !== "pending") return;
    this.state = "fulfilled";
    this.value = v;

    this._thenCallbacks.forEach((cb) => cb(v));
    this._atEndCallbacks.forEach((cb) => cb());
  }

  private _reject(e: any) {
    if (this.state !== "pending") return;
    this.state = "rejected";
    this.reason = e;

    this._excCallbacks.forEach((cb) => cb(e));
    this._atEndCallbacks.forEach((cb) => cb());
  }

  then(cb: (v: T) => void): FidsPromise<T> {
    if (this.state === "fulfilled" && this.value !== undefined) {
      cb(this.value);
    } else {
      this._thenCallbacks.push(cb);
    }
    return this;
  }

  exc(cb: (e: any) => void): FidsPromise<T> {
    if (this.state === "rejected" && this.reason !== undefined) {
      cb(this.reason);
    } else {
      this._excCallbacks.push(cb);
    }
    return this;
  }

  atEnd(cb: () => void): FidsPromise<T> {
    if (this.state !== "pending") {
      cb();
    } else {
      this._atEndCallbacks.push(cb);
    }
    return this;
  }
}
