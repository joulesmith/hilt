"use strict";

import http from 'axios';
import * as journal from '../journal';

export default function upload (data) {
  var form = new FormData();

  form.append('file', data.file);

  return http({
    url: '/api/file/',
    headers: {'Content-Type' : undefined}, // will be set automatically?
    data: data.file
  })
  .then(function(res){
      return res.data.file;
  }, function(res){
      // TODO this doesn't seem right, maybe use Error somehow?
      throw res.data.error;
  });
}

journal.report({
  action: '#/file/upload',
  definition: upload
});
