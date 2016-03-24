import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';

import MarkdownLatex from './markdown-latex-view';

export default React.createClass({
  getInitialState(){
    return {
      preview: false
    };
  },
  handlePreview(event) {
    this.setState({
      preview: true
    });
  },
  handleEdit(event) {
    this.setState({
      preview: false
    });
  },
  render() {

    if (this.state.preview) {

      return (
        <div>
          <Bootstrap.Button onClick={this.handleEdit} bsSize="xsmall">Edit</Bootstrap.Button>
          <MarkdownLatex value={this.props.value} />
        </div>
      );
    }

    var rows = this.props.value.match(/\n/g);

    var numRows = Math.max(5, rows ? rows.length + 1 : 0);

    return (
      <div>
        <Bootstrap.Button onClick={this.handlePreview} bsSize="xsmall">Preview</Bootstrap.Button>
        <textarea value={this.props.value} onChange={this.props.onChange} rows={numRows} style={{width:'100%'}}/>
      </div>
    );

  }
});
