import React from 'react';
import Navbar from 'Navbar';
import ErrorModal from 'ErrorModal';
import RegisterModal from './user/RegisterModal';

export default React.createClass({
  render: function() {
    var brand = {
      name: 'My Site',
      url: '#'
    };
    var links = [];
    return (
      <div>
        <Navbar brand={brand} links={links}></Navbar>
        <ErrorModal></ErrorModal>
        <RegisterModal></RegisterModal>
      </div>
    );
  }
});
