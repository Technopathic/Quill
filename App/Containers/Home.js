// @flow

import React, { Component } from 'react'
import { ScrollView, StatusBar, Image, View, AsyncStorage, Dimensions, Modal, Share, FlatList } from 'react-native'
import { Actions as NavigationActions } from 'react-native-router-flux'

import { Header, Container, Content, Card, CardItem, Left, Body, Right, Thumbnail, Text, Button, Footer, List, ListItem, Spinner, ActionSheet, Toast} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Styles
import styles from './Styles/HomeStyle'

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topics: [],
      token:"",
      user:"",
      nextPage:1,
      currentPage:0,
      lastPage:1,
      isLoading:true,
      result:"",
      loadMode:'New',
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

  async componentWillMount() {
    await AsyncStorage.multiGet(["token", "user"], (err, stores) => {
     stores.map((result, i, store) => {
       this.setState({
         token: store[0][1],
         user: JSON.parse(store[1][1])
       });
     });
   })
    .then(() => {
      this.getTopics();
    });
  };


  getTopics = () => {
    var nextPage = this.state.nextPage;
    var topics = this.state.topics;
    if(this.state.currentPage !== this.state.lastPage)
    {
      fetch('http://quill.technopathic.me/api/getTopics?page='+this.state.nextPage+'&token=' + this.state.token, {
        headers: {
          'Authorization':'Bearer ' +this.state.token
        }
      })
       .then(function(response) {
         return response.json()
       })
       .then(function(json) {
        if(json.error) {
          NavigationActions.signin();
        }
        else {
          if(json.current_page !== json.last_page)
          {
             nextPage = nextPage + 1;
          }
          for(var i = 0; i < json.data.length; i++)
          {
            topics.push(json.data[i]);
          }
          this.setState({
            nextPage: nextPage,
            lastPage: json.last_page,
            currentPage: json.current_page,
            topics: topics,
            isLoading:false
          })
        }
       }.bind(this));
    }
  };

  getHot = () => {
    var nextPage = this.state.nextPage;
    var topics = this.state.topics;
    if(this.state.currentPage !== this.state.lastPage)
    {
      fetch('http://quill.technopathic.me/api/getHot?page='+this.state.nextPage+'&token=' + this.state.token, {
        headers: {
          'Authorization':'Bearer ' +this.state.token
        }
      })
       .then(function(response) {
         return response.json()
       })
       .then(function(json) {
        if(json.error) {
          NavigationActions.signin();
        }
        else {
          if(json.current_page !== json.last_page)
          {
             nextPage = nextPage + 1;
          }
          for(var i = 0; i < json.data.length; i++)
          {
            topics.push(json.data[i]);
          }
          this.setState({
            nextPage: nextPage,
            lastPage: json.last_page,
            currentPage: json.current_page,
            topics: topics,
            isLoading:false
          })
        }
       }.bind(this));
    }
  };

  moreTopics = () => {
    if(this.state.loadMode === 'New')
    {
      this.getTopics();
    }
    else if(this.state.loadMode === 'Best')
    {
      this.getHot();
    }
  }

  renderEnd()
  {
    const noTopics = {
      color:'#555555',
      fontSize:11,
      fontStyle:'italic',
      padding:15,
      flex:1,
      justifyContent:'center',
      alignItems:'center',
      textAlign:'center'
    };

    if(this.state.currentPage === this.state.lastPage)
    {
      return(
        <Text style={noTopics}>
          You have reached the end.
        </Text>
      );
    }
  };

 shareText = (topic) => {
   Share.share({
     message: topic.topicBody,
     url: 'http://quill.technopathic.me/share/'+topic.id,
     title: topic.topicTitle
   }, {
     dialogTitle: 'Share this Topic',
     excludedActivityTypes: [
       'com.apple.UIKit.activity.PostToTwitter'
     ],
     tintColor: 'green'
   })
   .then(this.showResult)
   .catch((error) => this.setState({result: 'error: ' + error.message}));
 };

 showResult = (result) => {
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        this.setState({result: 'shared with an activityType: ' + result.activityType});
      } else {
        this.setState({result: 'shared'});
      }
    } else if (result.action === Share.dismissedAction) {
      this.setState({result: 'dismissed'});
    }
  }

  joinGame = (id) => {
    var _this = this;
    var topics = this.state.topics;
    fetch('http://quill.technopathic.me/api/joinGame/'+id+'?token=' + this.state.token, {
      headers: {
        'Authorization':'Bearer ' +this.state.token
      }
    })
     .then(function(response) {
       return response.json()
     })
     .then(function(json) {
      if(json.error) {
        _this.showToast(json.error);
      }
      else if(json.success){
        for(var i = 0; i < topics.length; i++)
        {
          if(topics[i].id === id)
          {
            topics[i].topicGame = 1;
            this.setState({
              topics:topics
            })
          }
        }
        this.showToast(json.success);
        NavigationActions.detail({id:id});
      }
    }.bind(this));
  }

  renderStatus = (status) => {
    if(status === 'Open')
    {
      return(
        <Text style={{color:'green'}}>{status}</Text>
      )
    }
    else if(status === 'Closed')
    {
      return(
        <Text style={{color:'red'}}>{status}</Text>
      )
    }
    else if(status === 'Complete')
    {
      return(
        <Text style={{color:'blue'}}>{status}</Text>
      )
    }
  }

  renderTopics = (topic) => {
    var topic = topic.item;

    const cardStyle = {
      flex: 1,
      shadowOpacity:0,
      elevation:0,
      borderWidth:1,
      borderColor:'#EAEAEA',
      borderRadius:0,
      marginBottom:0,
      marginTop:10,
      margin:10,
      backgroundColor:"#FFFFFF"
    };

    const cardHead = {
      flex:1,
      flexDirection:'row',
      paddingLeft:10,
      paddingRight:10,
      paddingTop:5,
    };

    const cardImage = {
      flex:1,
      borderBottomWidth:0,
      borderTopWidth:0,
      paddingTop:5,
      paddingBottom:5,
    };

    const headerStyle = {
      flex:1,
      flexDirection:'column',
      paddingLeft:10
    };

    const headerText = {
      marginBottom:0,
      paddingBottom:0,
    };

    const itemStyle = {
      paddingTop:5,
      paddingBottom:10,
      paddingLeft:10,
      paddingRight:10,
    };

    const smallText = {
      fontSize:11,
      color:'#777777',
      fontFamily:'Montserrat-Regular'
    };

    const noteText = {
      fontSize:11,
      color:'#777777',
      marginTop:-12
    };

    const noGutter = {
      paddingTop:0,
      paddingBottom:0,
      marginTop:0,
      marginBottom:0
    };

    const iconStyle = {
      fontSize:20,
      color:'#666666'
    };

    const optionStyle = {
      flex:1,
      flexDirection:'row',
      justifyContent:'space-between',
      marginTop:3,
      borderTopWidth:1,
      borderTopColor:'#EAEAEA',
    };

    var joinButton = <Button style={{backgroundColor:"#6441A4", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => this.joinGame(topic.id)}><Text style={{color:"#FFFFFF"}}>JOIN</Text></Button>;
    if(topic.userID == this.state.user.user.id)
    {
      joinButton = <Button style={{backgroundColor:"#02bb75", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Text style={{color:"#FFFFFF"}}>HOST</Text></Button>;
    }
    else if(topic.topicStatus === "Closed" && topic.topicGame === 0 && topic.userID !== this.state.user.user.id)
    {
      joinButton = <Button style={{backgroundColor:"#9f162b", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Text style={{color:"#FFFFFF"}}>CLOSED</Text></Button>;
    }
    else if(topic.topicStatus === "Complete" && topic.topicGame === 0 && topic.userID !== this.state.user.user.id)
    {
      joinButton = <Button style={{backgroundColor:"#0f568f", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Text style={{color:"#FFFFFF"}}>COMPLETE</Text></Button>;
    }
    else if(topic.topicStatus === "Open" && topic.topicGame === 1 && topic.userID !== this.state.user.user.id)
    {
      joinButton = <Button style={{backgroundColor:"#02bb75", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Text style={{color:"#FFFFFF"}}>JOINED</Text></Button>;
    }
    else if(topic.topicStatus === "Complete" && topic.topicGame === 1 && topic.userID !== this.state.user.user.id)
    {
      joinButton = <Button style={{backgroundColor:"#02bb75", flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Text style={{color:"#FFFFFF"}}>JOINED</Text></Button>;
    }

    return(
      <View style={cardStyle}>
        <View style={cardHead}>
          <Thumbnail source={{uri:topic.avatar}} small onPress={() => {NavigationActions.profile({uid:topic.userID})}}/>
          <View style={headerStyle}>
            <Text style={{fontSize:14, fontFamily:'Montserrat-Regular'}}>{topic.topicTitle}</Text>
            <Text note style={{fontSize:11, fontFamily:'Montserrat-Regular'}} onPress={() => {NavigationActions.profile({uid:topic.userID})}}>{topic.profileName}</Text>
          </View>
        </View>
        <View style={itemStyle}>
          <Text onPress={() => {NavigationActions.detail({id:topic.id})}} style={{fontFamily:'Lato-Regular', fontSize:12}}>
            {topic.topicBody}
          </Text>
        </View>
        <View style={{paddingLeft:10, paddingRight:10}}>
          <Text style={smallText} onPress={() => {NavigationActions.detail({id:topic.id})}}>
            {topic.topicReplies} Replies &middot; {this.renderStatus(topic.topicStatus)}
          </Text>
        </View>
        <View style={optionStyle}>
          {joinButton}
          <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Icon name="chat-bubble-outline" style={iconStyle}/></Button>
          <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => this.shareText(topic)}><Icon name="share" style={iconStyle}/></Button>
        </View>
      </View>
    )
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
      fontFamily:'Lobster-Regular'
    };

    const mainContainer = {
      flex:1,
      flexDirection:'column',
    }

    const spinnerStyle = {
      flex:1,
      height:Dimensions.get('window').height,
      justifyContent:'center',
      alignItems:'center'
    }

    if (this.state.isLoading) {
      return (
        <View style={spinnerStyle}>
          <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
          <Spinner color="#6441A4"/>
        </View>
      )
    }
    else {
      return (
          <Container style={{backgroundColor:'#F5F5F5'}}>
            <Header style={appBar}>
              <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
              <Text style={titleStyle}> Quill </Text>
            </Header>
            <FlatList
              data={this.state.topics}
              keyExtractor={(topic, index) => index}
              renderItem={this.renderTopics}
              onEndReached={this.moreTopics}
              onEndReachedThreshold={1}
              disableVirtualization={false}
            />
            <Content>
              {this.renderEnd()}
            </Content>
          </Container>
      )
    }
  }
}
