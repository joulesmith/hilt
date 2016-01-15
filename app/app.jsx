"use strict";
// first thing to actually be run in the app
import React from 'react';
import ReactDom from 'react-dom';
import Root from 'root';
import user from 'user';
import * as fileUpload from './actions/file-upload';
import locale from './locale';

ReactDom.render(
  <Root></Root>,
  document.getElementById('react_root')
);
