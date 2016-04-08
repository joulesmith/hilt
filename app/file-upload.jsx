"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from './journal';


export default React.createClass({
  getInitialState: function(){
    return {
      file: null,
      loading: false
    };
  },
  handleFile: function(event) {
    this.setState({
      file: event.target.files[0]
    });
  },
  handleUpload: function(event) {
    if (this.state.file) {
      this.setState({loading: true});

      var form = new FormData();

      form.append('file', this.state.file);

      journal.report({
        action: '/api/file',
        data: form
      })
      .then(result => {
        this.setState({loading: false});

        if (this.props.onUpload) {
          this.props.onUpload(result);
        }
      })
      .catch(function(error){
        journal.report({
          action: '#/error',
          data: error
        });
      })
    }
  },
  render: function() {
    return (
      <div>
        <input onChange={this.handleFile} type="file" />
        <Bootstrap.Button
          bsStyle="primary"
          disabled={!this.state.file || this.state.loading}
          onClick={this.handleUpload}>
          {this.state.loading ? 'Uploading...' : 'Upload'}
        </Bootstrap.Button>
      </div>
    );
  }
});
