// The libraries a React example can import when it runs in a chapter's preview.
// Bundled into public/vendor/react-runtime.js by scripts/build-vendor.mjs.
// The development builds are used on purpose: their warnings (a missing `key`,
// a hook called in the wrong place) are part of what the chapters teach.
import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as JSXRuntime from 'react/jsx-runtime';
import * as JSXDevRuntime from 'react/jsx-dev-runtime';
import * as Router from 'react-router';

(window as unknown as { __zteModules: Record<string, unknown> }).__zteModules = {
  react: React,
  'react-dom/client': ReactDOMClient,
  'react/jsx-runtime': JSXRuntime,
  'react/jsx-dev-runtime': JSXDevRuntime,
  'react-router': Router,
};
