import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import { hashHistory } from 'react-router';
import ReportButton from '../report-button';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState: function(){
    return {
      data: {},
      text: '',
      error: ''
    };
  },
  handleData(event){

    var obj;

    try{
      obj = JSON.parse(event.target.value);
console.log(obj);
      this.setState({
        data: obj,
        text: event.target.value,
        error: ''
      });
    }catch(error){
      this.setState({
        text: event.target.value,
        error: error
      });
    }


  },
  render() {

    return (
      <div>
        <Bootstrap.Input type='textarea' value={this.state.text} onChange={this.handleData} />
        <ReportButton
          disabled={!!this.state.error}
          value={'Create'}
          progressValue={'Creating...'}
          bsStyle={'default'}
          report={{
            action: 'api/crud/',
            data: {
              data: this.state.data
            }
          }}
          resolve={crud => {
            hashHistory.push("/crud/" + crud._id + "/update");
          }}
        />
        <ErrorBody error={this.state.error} />
      </div>
    );
  }
});
