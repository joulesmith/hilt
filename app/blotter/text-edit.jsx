import React from 'react';
import MarkdownLatexEdit from './markdown-latex-edit';
import MarkdownLatexView from './markdown-latex-view';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  getDefaultProps() {
    return {
      parent: null,
      element : {
        type: 'text',
        key: 0,
        child: ""
      },
      preview: false
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
  handleEdit(event){
    this.setState({
      preview: false
    });
  },
  handlePreview(event){
    this.setState({
      preview: true
    });
  },
  render() {
    if (this.state.preview){
      return (
        <div key={this.props.key}>
          <Bootstrap.ButtonGroup label='Column'>
            <Bootstrap.Button onClick={this.handleEdit} bsSize="xsmall"><span className="glyphicon glyphicon-edit" /></Bootstrap.Button>
            <Bootstrap.Button onClick={this.handleDelete} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
          </Bootstrap.ButtonGroup>
          <MarkdownLatexView
            value={this.state.element.child}
          />
        </div>
      );
    }

    return (
      <div key={this.props.key}>
        <Bootstrap.ButtonGroup>
        <Bootstrap.Button onClick={this.handlePreview} bsSize="xsmall"><span className="glyphicon glyphicon-eye-open" /></Bootstrap.Button>
        <Bootstrap.Button onClick={this.handleDelete} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
        </Bootstrap.ButtonGroup>
        <MarkdownLatexEdit
          value={this.state.element.child}
          onChange={this.handleText}
        />
      </div>
    );

  }
});
