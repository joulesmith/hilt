import React from 'react';
import MarkdownLatex from './markdown-latex-view';
import ErrorBody from '../error-body';

export default React.createClass({
  render() {
    try{
      return <MarkdownLatex key={this.props.key} value={this.props.value.text} />;
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
