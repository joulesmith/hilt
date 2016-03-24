import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';

export default React.createClass({
  getDefaultProps() {
    return {
      parent: null,
      element : {
        type: 'row',
        key: 0,
        child: []
      }
    };
  },
  componentWillMount() {
    this.setState({
      parent: this.props.parent,
      element: this.props.element
    });
  },
  handleAddColumn(event) {

    var element = this.state.element;
    var that = this;

    this.props.keygen().then(key => {
      element.child.push({
        type: 'col',
        key: key,
        width: 1,
        child: {}
      });

      that.setState({
        element : element
      });
    });
  },
  handleMoveUp(event) {
    if (this.props.onMoveUp) {
      this.props.onMoveUp(event);
    }
  },
  handleMoveDown(event) {
    if (this.props.onMoveDown) {
      this.props.onMoveDown(event);
    }
  },
  handleMoveLeft(key) {

  },
  handleMoveRight(key) {

  },
  handleDeleteColumn(key) {

  },
  handleDeleteRow (event) {
    if (this.props.onDelete) {
      this.props.onDelete(event);
    }
  },
  render() {
    return (
      <div key={this.props.element.key}>
        <table>
          <tbody>
          <tr>
            <td>
              <Bootstrap.ButtonGroup vertical>
                <Bootstrap.Button onClick={this.handleMoveUp} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-up" /></Bootstrap.Button>
                <Bootstrap.Button onClick={this.handleMoveDown} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-down" /></Bootstrap.Button>
                <Bootstrap.Button onClick={this.handleDeleteRow} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
                <Bootstrap.Button onClick={this.handleAddColumn} bsSize="xsmall"><span className="glyphicon glyphicon-plus" /></Bootstrap.Button>
              </Bootstrap.ButtonGroup>
            </td>
            <td style={{width:'100%'}}>
              <Bootstrap.Row>
                {this.state.element.child.map(column => {
                  return <Blot
                    key={column.key}
                    element={column}
                    keygen={this.props.keygen}
                    onMoveLeft={() => {
                      this.handleMoveLeft(column.key);
                    }}
                    onMoveRight={() => {
                      this.handleMoveRight(column.key);
                    }}
                    onDelete={() => {
                      this.handleDeleteColumn(column.key);
                    }}
                  />;
                })}
              </Bootstrap.Row>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    );
  }
});
