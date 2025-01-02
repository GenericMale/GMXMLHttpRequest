# GMXMLHttpRequest
Simple XMLHttpRequest wrapper for userScripts

# Usage

```JavaScript
// ==UserScript==
// @name        Intercept XMLHttpRequest
// @match       https://example.url/*
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @run-at      document-body
// @require     https://raw.githubusercontent.com/GenericMale/GMXMLHttpRequest/refs/heads/main/GMXMLHttpRequest.js
// ==/UserScript==
unsafeWindow.XMLHttpRequest = GMXMLHttpRequest;

GMXMLHttpRequest.requestInterceptors.push((req, xhr) => {
  if(req.url.match('/user$')) {
    req.skip = true;
  }
});

GMXMLHttpRequest.eventInterceptors.push((type, data, req, xhr) => {
  if(type === 'onloadend' && req.url.match('/data.json$')) {
    xhr.response = JSON.stringify({
      user: "John Doe"
    });
  }
});

```
