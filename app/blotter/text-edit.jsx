import React from 'react';
import MarkdownLatexEdit from './markdown-latex-edit';
import MarkdownLatexView from './markdown-latex-view';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  getInitialState(){
    return {
      preview: false
    };
  },
  handleDelete(event){
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },
  handleText(text) {
    if (this.props.onChange) {
      this.props.onChange({
        text: text
      });
    }
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
            value={this.props.value.text}
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
          value={this.props.value.text}
          onChange={this.handleText}
        />
      </div>
    );

  }
});
