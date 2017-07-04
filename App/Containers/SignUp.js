// @flow

import React from 'react'
import { View, ScrollView, StatusBar, Text, Image, Modal, AsyncStorage, Dimensions } from 'react-native'
import { Actions as NavigationActions } from 'react-native-router-flux'

import { Container, Content, Header, InputGroup, Input, List, ListItem, Button, Icon, Toast } from 'native-base';
import MyCon from 'react-native-vector-icons/MaterialCommunityIcons';

// Styles
import styles from './Styles/SignUpStyle'

class SignUp extends React.Component {
  constructor(props) {
   super(props);
   this.state = {
     email:"",
     name:"",
     password:"",
     disableSubmit:false,
     showToast: false
   };
  };

  showToast = (text) => {
    Toast.show({
     text: text,
     position: 'bottom',
     buttonText:'OK',
     duration:3000
    });
  };

  handleEmail = (event) => this.setState({email: event.nativeEvent.text});
  handleName = (event) => this.setState({name: event.nativeEvent.text});
  handlePassword = (event) => this.setState({password: event.nativeEvent.text});

  signIn() {
    var _this = this;
    fetch('http://quill.technopathic.me/api/signIn', {
      method: 'POST',
      body: JSON.stringify({
        email: this.state.email,
        password: this.state.password
      })
    }).then(function(response) {
      return response.json()
    })
    .then(function(json) {
      if(json == 2) {
        _this.showToast('Wrong E-mail.');
      }
      else if(json == 0) {
        _this.showToast('Looks like you were banned.');
      }
      else if(json.error) {
        _this.showToast('Wrong Password.');
      }
      else if(json.token) {
        AsyncStorage.setItem('token', json.token);
        fetch('http://quill.technopathic.me/api/authenticate/user?token='+ json.token, {
          headers:{
            'Authorization': 'Bearer ' + json.token
          }
        })
        .then(function(userResponse) {
          return userResponse.json()
        })
        .then(function(userJson) {
          _this.setState({disableSubmit:true});
          AsyncStorage.setItem('user', JSON.stringify(userJson.user));
          _this.showToast('Hey there, '+userJson.profile.profileName+'!');
          setTimeout(function(){NavigationActions.root()}, 3000);
        })
      }
    })
  };

  signUp() {
    var _this = this;
    fetch('http://quill.technopathic.me/api/signUp', {
      method: 'POST',
      body: JSON.stringify({
        email: this.state.email,
        username: this.state.name,
        password: this.state.password
      })
    }).then(function(response) {
      return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast(json.error);
      }
      else if(json === 1)
      {
        _this.signIn();
      }
    });
  }

  render () {

    const appBar = {
      backgroundColor:"#263238",
      justifyContent:'center',
      alignItems:'center',
      height:55,
      borderBottomWidth:1,
      borderBottomColor:'#6441A4'
    };

    const titleStyle = {
      textAlign:"center",
      fontSize:28,
      color:"#EEEEEE",
      fontFamily:"Lobster-Regular"
    };

    const backgroundContainer = {
      flex:1,
      minHeight:Dimensions.get('window').height,
      width:null,
      height:null,
      paddingTop:15,
      paddingBottom:15,
      backgroundColor:'#444444'
    };

    const logoContainer = {
      resizeMode: 'cover',
      width:150,
      height:150,
      alignSelf:'center',
    };

    const titleContainer = {
      alignSelf:'center',
      color:'#FFFFFF',
      fontSize:32,
      marginBottom:15,
      fontFamily:'Lobster-Regular'
    };

    const inputContainer = {
      backgroundColor:'rgba(0, 0, 0, 0.3)',
      padding:15,
      borderTopWidth:1,
      borderTopColor:'#888888',
      borderBottomWidth:1,
      borderBottomColor:'#888888'
    };

    const inputStyle = {
      color:'#EEEEEE'
    };

    const iconStyle = {
      color:'#CCCCCC'
    };

    const buttonStyleOne = {
      marginTop:15,
      elevation:0,
      backgroundColor:'#6441A4'
    };

    const buttonStyleTwo = {
      marginLeft:30,
      marginRight:30,
      elevation:0,
      backgroundColor:'#CCCCCC'
    };

    const textStyleTwo = {
      color:'#222222'
    };

    const facebookButton = {
      backgroundColor:'#3b5998',
      marginTop:10,
      marginLeft:15,
      marginRight:15,
      elevation:0
    };

    const twitterButton = {
      backgroundColor:'#1dcaff',
      marginTop:10,
      marginLeft:15,
      marginRight:15,
      elevation:0
    };

    const googleButton = {
      backgroundColor:'#EA4335',
      marginTop:10,
      marginLeft:15,
      marginRight:15,
      elevation:0
    };

    const resetText = {
      marginTop:15,
      alignSelf:'center',
      color:'#CCCCCC',
      fontSize:11
    };

    const buttonText = {
      color:"#EEEEEE",
      fontWeight:"bold",
      fontSize:16,
    };

    return (
      <Container>
          <Header style={appBar}>
            <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
            <Text style={titleStyle}> Sign Up </Text>
          </Header>
          <Content>
            <View style={backgroundContainer}>
              <Image style={logoContainer} source={require('../Images/quilllogo512.png')} />
              <Text style={titleContainer}> Quill </Text>

              <View style={inputContainer}>
                <InputGroup borderType='underline' >
                  <Icon name='md-mail' style={iconStyle}/>
                  <Input style={inputStyle} value={this.state.email} onChange={this.handleEmail} placeholder='E-Mail' placeholderTextColor="#AAAAAA" selectionColor="#6441A4" underlineColorAndroid="#6441A4"/>
                </InputGroup>

                <InputGroup>
                  <Icon name='md-person' style={iconStyle}/>
                  <Input placeholder='Username' style={inputStyle} value={this.state.name} onChange={this.handleName} placeholderTextColor="#AAAAAA" selectionColor="#6441A4" underlineColorAndroid="#6441A4"/>
                </InputGroup>

                <InputGroup>
                  <Icon name='md-lock' style={iconStyle}/>
                  <Input placeholder='Password' secureTextEntry={true} style={inputStyle} value={this.state.password} onChange={this.handlePassword} placeholderTextColor="#AAAAAA" selectionColor="#6441A4" underlineColorAndroid="#6441A4"/>
                </InputGroup>
                <Button block style={buttonStyleOne} disabled={this.state.disableSubmit} onPress={() => this.signUp()}><Text style={buttonText}>Sign Up</Text></Button>
              </View>
              <Text style={resetText} onPress={() => { NavigationActions.signin()}}>Already have an Account? Sign In!</Text>
            </View>
          </Content>
      </Container>
    )
  }
}

export default SignUp
