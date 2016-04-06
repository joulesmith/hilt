import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';

import MarkdownLatex from './markdown-latex-view';

export default React.createClass({
  render() {

    var rows = this.props.value.match(/\n/g);

    var numRows = Math.max(5, rows ? rows.length + 1 : 0);

    return (
      <textarea value={this.props.value} onChange={this.props.onChange} rows={numRows} style={{width:'100%'}}/>
    );

  }
});
