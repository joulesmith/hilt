import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import blot from './blot-edit';

export default React.createClass({
  getDefaultProps() {
    return {

      }
    };
  },
  componentWillMount() {
    this.setState({

    });
  },
  handleAddList() {
    var element = this.state.element;
    var that = this;

    this.props.keygen().then(key => {
      element.child.push({
        type: 'col',
        key: key,
        child: {}
      });

      that.setState({
        element : element
      });
    });
  },
  handleAddText() {

  }
  render() {
    return (
      <div>
        <ButtonGroup>
          <Button onClick={this.handleAddList}>Add List</Button>
          <Button onClick={this.handleAddText}>Add Text</Button>
        </ButtonGroup>
      </div>
    );
  }
});
