import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import blot from './blot-edit';
import ErrorBody from '../error-body';

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
    try{
      return (
        <div>
          <ButtonGroup>
            <Button onClick={this.handleAddList}>Add List</Button>
            <Button onClick={this.handleAddText}>Add Text</Button>
          </ButtonGroup>
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
