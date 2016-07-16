import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import ErrorBody from '../error-body';
import MarkdownLatex from './markdown-latex-view';

export default React.createClass({
  render() {
    try{
      var rows = this.props.value.match(/\n/g);

      var numRows = Math.max(5, rows ? rows.length + 1 : 0);

      return (
        <textarea
          value={this.props.value}
          onChange={event => {
            if (this.props.onChange){
              this.props.onChange(event.target.value);
            }
          }}
          rows={numRows}
          style={{width:'100%'}}/>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
