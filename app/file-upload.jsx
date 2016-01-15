"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as ReactIntl from 'react-intl';
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

      journal.report({
        action: '#/file/upload',
        data: {
          file: this.state.file
        }
      })
      .then(result => {
        this.setState({loading: false});

        if (this.props.onUpload) {
          this.props.onUpload(result);
        }
      });
    }
  },
  render: function() {
    return (
      <div>
        <input onChange={this.handleFile} type="file" />
        <Button
          bsStyle="primary"
          disabled={!this.state.file || this.state.loading}
          onClick={this.handleUpload}>
          {this.state.loading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    );
  }
});
