import Promise from 'promise-polyfill';
import 'whatwg-fetch';
import log from "../../lib/log";

const host = (window && window.location && window.location.hostname) || '';
const parts = host.split('.');
const COOKIE_DOMAIN = parts.length > 1 ? `;domain=.${parts.slice(-2).join('.')}` : '';
const COOKIE_MAX_AGE = 33696000;
const COOKIE_NAME = 'euconsent';

function readCookieSync(name) {
  const cookie = '; ' + document.cookie;
  const parts = cookie.split('; ' + name + '=');
  var value = null;
  if (parts.length === 2) {
    value = parts.pop().split(';').shift();
  }
  return value;
}

// samesite support check
var supports_samesite = false;
try {
  document.cookie = "st_samesite=1;SameSite=None;Secure";
  if (readCookieSync("st_samesite")) {
    supports_samesite = true;
    document.cookie = "st_samesite=1;max-age=0;SameSite=None;Secure";
  }
} catch (err) {
  supports_samesite = false;
}

function readCookie(name) {
  const cookie = '; ' + document.cookie;
  const parts = cookie.split('; ' + name + '=');
  var value = null;
  if (parts.length === 2) {
    value = parts.pop().split(';').shift();
  }

  // Begin SameSite Migration: re-write cookies with SameSite=true if it's supported
  if (value) {
    writeCookie({ name, value });
  }
  // End SameSite Migration

  if (value) {
    return Promise.resolve(value);
  }
  return Promise.resolve();
}

function writeCookie({ name, value, path = '/'}) {
  if (supports_samesite) {
    document.cookie = `${name}=${value}${COOKIE_DOMAIN};path=${path};max-age=${COOKIE_MAX_AGE};SameSite=None;Secure`;
  }
  else {
    document.cookie = `${name}=${value}${COOKIE_DOMAIN};path=${path};max-age=${COOKIE_MAX_AGE}`;
  }

  return Promise.resolve();
}

const commands = {
  readVendorList: () => {
   return fetch('https://vendorlist.consensu.org/vendorlist.json')
    .then(res => res.json())
    .catch(err => {
      log.error(`Failed to load vendor list from vendors.json`, err);
    });
  },

  readVendorConsent: () => {
    return readCookie(COOKIE_NAME);
  },

  writeVendorConsent: ({encodedValue}) => {
    return writeCookie({name: COOKIE_NAME, value: encodedValue});
  }
};

window.addEventListener('message', (event) => {
  const data = event.data.vendorConsent;
  if (data && typeof commands[data.command] === 'function') {
    const { command } = data;
    commands[command](data).then(result => {
      event.source.postMessage({
        vendorConsent: {
          ...data,
          result,
          supports_samesite
        }
      }, event.origin);
    });
  }
});
window.parent.postMessage({ vendorConsent: { command: 'isLoaded' } }, '*');
