import React from 'react';
import MarkdownLatex from './markdown-latex-edit';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  getDefaultProps() {
    return {
      parent: null,
      element : {
        type: 'text',
        key: 0,
        child: ""
      }
    };
  },
  componentWillMount() {
    this.setState({
      parent: this.props.parent,
      element: this.props.element
    });
  },
  handleDelete(event){
    if (this.props.onDelete) {
      this.props.onDelete(event);
    }
  },
  handleText(event) {
    this.state.element.child = event.target.value;
    this.setState({
      element: this.state.element
    });
  },
  render() {
    return (
      <div key={this.props.key}>
        <Bootstrap.ButtonGroup>
          <Bootstrap.Button onClick={this.handleDelete}>Delete Text</Bootstrap.Button>
        </Bootstrap.ButtonGroup>
        <MarkdownLatex
          value={this.state.element.child}
          onChange={this.handleText}
        />
      </div>
    );
  }
});
