import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from './journal';
import ErrorBody from 'error-body';

export default React.createClass({
  getInitialState(){
    return {
      processing: false,
      start: 0,
      current: 0
    };
  },
  handleReport(event) {
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true,
      start: Date.now(),
      current: Date.now()
    }, () => {
      var timer = null;
      if (typeof this.props.progressValue === 'function') {

        timer = setInterval(() =>{
          this.setState({
            current: Date.now()
          });
        }, 250);
      }

      journal.report(this.props.report)
      .then(result => {
        if (timer){
          clearInterval(timer);
        }

        that.setState({
          processing: false,
          start: 0,
          current: 0
        });

        if (this.props.resolve){
          this.props.resolve(result);
        }
      })
      .catch(err => {
        if (timer){
          clearInterval(timer);
        }

        that.setState({
          processing: false,
          start: 0,
          current: 0
        });

        if (this.props.reject){
          this.props.reject(err);
        }

      });
    });

  },
  render() {
      try{
      var value;

      if (this.state.processing) {
        if (this.props.progressValue) {
          if (typeof this.props.progressValue === 'function') {
            value = this.props.progressValue(this.state.start, this.state.current);
          }else{
            value = this.props.progressValue;
          }
        }else{
          value = 'Reporting...'
        }

      }else{
        value = this.props.value ? this.props.value : 'Report';
      }

      return (
        <Bootstrap.Button
          onClick={this.handleReport}
          bsStyle={this.props.bsStyle}
          style={{
            display: 'inline'
          }}
          disabled={this.state.processing || this.props.disabled}
        >{value}</Bootstrap.Button>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
