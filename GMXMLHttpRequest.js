class GMXMLHttpRequest extends EventTarget {

  static requestInterceptors = [];
  static eventInterceptors = [];

  readyState = 0;
  response = null;
  responseText = null;
  responseType = "";
  responseURL = null;
  responseXML = null;
  status = 0;
  statusText = "";
  timeout = 0;
  upload = new EventTarget();
  withCredentials = false;

  #req = null;
  #responseHeaders = null;
  #xhr = null;
  #xhrEvents = [
    "onabort",
    "onerror",
    "onload",
    "onloadend",
    "onloadstart",
    "onprogress",
    "onreadystatechange",
    "ontimeout"
  ];

  abort() {
    if (this.#xhr) this.#xhr.abort();
  }

  getAllResponseHeaders() {
    this.#responseHeaders ? this.#responseHeaders : "";
  }

  getResponseHeader(header) {
    if (!this.#responseHeaders) return null;
    const m = this.#responseHeaders.match(
      new RegExp(`${header}: ([^\r\n]*)`, "i")
    );
    return m ? m[1] : null;
  }

  open(method, url, async, user, password) {
    const base = document.querySelector('base');
    this.#req = {
      method,
      url: new URL(url, base ? base.href : window.location.href).href,
      async,
      user,
      password,
      headers: {
        origin: window.location.origin,
      },
    };
    this.readyState = 1;
  }

  overrideMimeType(overrideMimeType) {
    if (this.#req) this.#req.overrideMimeType = overrideMimeType;
  }

  send(data) {
    if (this.readyState != 1)
      throw new DOMException(
        "XMLHttpRequest.send: XMLHttpRequest state must be OPENED."
      );

    this.#req.data = data;
    this.#req.timeout = this.timeout;
    this.#req.responseType = this.responseType;
    this.#req.upload = this.upload;
    this.#req.anonymous = !this.withCredentials && new URL(this.#req.url, window.location).origin !== window.location.origin;
    this.#xhrEvents.forEach((e) => (this.#req[e] = (r) => this.dispatchXHREvent(e, r)));

    GMXMLHttpRequest.requestInterceptors.forEach((interceptor) => {
      try {
        interceptor(this.#req, this);
      } catch(e) {
        console.error(e);
      }
    });

    if(this.#req.skip !== true) {
      this.#xhr = GM_xmlhttpRequest(this.#req);
    }
  }

  setRequestHeader(name, value) {
    if (this.readyState != 1)
      throw new DOMException(
        "XMLHttpRequest.send: XMLHttpRequest state must be OPENED."
      );

    this.#req.headers[name] = value;
  }

  dispatchXHREvent(type, data) {
    GMXMLHttpRequest.eventInterceptors.forEach((interceptor) => {
      try {
        interceptor(type, data, this.#req, this);
      } catch(e) {
        console.error(e);
      }
    });

    if(type === 'onload') {
      if(data.response) this.response = (this.response || '') + data.response;
      if(data.responseText) this.responseText = (this.responseText || '') + data.responseText;
      if(data.responseXML) this.responseXML = (this.responseXML || '') + data.responseXML;
    } else if(data.skip !== true) {
      if(type === 'onloadend') {
        type = 'onload';
        console.groupCollapsed(this.#req.method, data.finalUrl, data.status);
        if(this.#req.data) console.log(this.#req.data);
        if(this.response) console.log(this.response);
        console.groupEnd();
      }
      this.readyState = data.readyState;
      this.responseURL = data.finalUrl;
      this.status = data.status;
      this.statusText = data.statusText;
      this.#responseHeaders = data.responseHeaders;

      const event = new CustomEvent(type.substr(2), {
        lengthComputable: data.lengthComputable,
        loaded: data.loaded,
        total: data.total,
      });
      this.dispatchEvent(event);

      if (this[type]) this[type](event);
    }
  }
}
