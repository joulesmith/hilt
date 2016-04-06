import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';

export default React.createClass({
  getDefaultProps() {
    return {
      parent: null,
      element : {
        type: 'col',
        key: 0,
        width: 1,
        child: {}
      }
    };
  },
  componentWillMount() {
    this.setState({
      parent: this.props.parent,
      element: this.props.element
    });
  },
  handleMoveLeft(event) {
    if (this.props.onMoveLeft) {
      this.props.onMoveLeft(event);
    }
  },
  handleMoveRight(event) {
    if (this.props.onMoveRight) {
      this.props.onMoveRight(event);
    }
  },
  handleDeleteColumn(event) {
    if (this.props.onDelete) {
      this.props.onDelete(event);
    }
  },
  handleChange(element) {
    this.state.element.child = element;

    this.setState({
      element : this.state.element
    });
  },
  handleDeleteChild(){
    this.state.element.child = {};

    this.setState({
      element : this.state.element
    });
  },
  handleWidth(event, eventKey){
    this.state.element.width = parseInt(eventKey);
    this.setState({
      element: this.state.element
    })
  },
  handleOffset(event, eventKey){
    this.state.element.offset = parseInt(eventKey);
    this.setState({
      element: this.state.element
    })
  },
  render() {
    return (
      <Bootstrap.Col key={this.props.element.key} md={this.props.element.width} mdOffset={this.props.element.offset} style={{border: '2px dotted', 'borderRadius': '10px'}}>
        <Bootstrap.ButtonGroup>
          <Bootstrap.Button onClick={this.handleMoveLeft} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-left" /></Bootstrap.Button>
          <Bootstrap.Button onClick={this.handleMoveRight} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-right" /></Bootstrap.Button>
          <Bootstrap.DropdownButton
            title={"# " + this.state.element.width}
            id="width-menu"
            onSelect={this.handleWidth}
            bsSize="xsmall"
          >
            <Bootstrap.MenuItem eventKey="1">1</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="2">2</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="3">3</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="4">4</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="5">5</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="6">6</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="7">7</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="8">8</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="9">9</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="10">10</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="11">11</Bootstrap.MenuItem>
            <Bootstrap.MenuItem eventKey="12">12</Bootstrap.MenuItem>
          </Bootstrap.DropdownButton>
          <Bootstrap.Button onClick={this.handleDeleteColumn} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
        </Bootstrap.ButtonGroup>
        <Blot
          element={this.state.element.child}
          keygen={this.props.keygen}
          onChange={this.handleChange}
          onDelete={this.handleDeleteChild}
        />
      </Bootstrap.Col>
    );
  }
});
