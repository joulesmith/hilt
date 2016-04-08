import React from 'react';
import MarkdownLatex from './markdown-latex-view';

export default React.createClass({
  render() {
    return <MarkdownLatex key={this.props.key} value={this.props.value.text} />;
  }
});
