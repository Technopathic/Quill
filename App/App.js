import React, { Component } from 'react';
import NavigationRouter from './Navigation/NavigationRouter';
console.ignoredYellowBox = ['Setting a timer'];


import OneSignal from 'react-native-onesignal';


class App extends Component {

  componentDidMount() {
    OneSignal.configure({});
  }

  render() {

    return(
      <NavigationRouter />
    )
  }

}
export default App
