// @flow

import React from 'react'
import { ScrollView, StatusBar, AsyncStorage, View, Image, Modal, Dimensions, TouchableHighlight } from 'react-native'
import { Actions as NavigationActions } from 'react-native-router-flux'

import { Container, Header, Content, Card, CardItem, Thumbnail, List, ListItem, Text, Button, Right, Left, Body, ActionSheet, Toast, Spinner, Badge } from 'native-base'
import Icon from 'react-native-vector-icons/MaterialIcons';

// Styles
import Styles from './Styles/ProfileStyle'

class Profile extends React.Component {
  constructor(props) {
   super(props);
   this.state = {
     user: "",
     token: "",
     reportOpen: false,
     notifs:0,
     profile:"",
     topics:[],
     replies:[],
     isProfileLoading:true,
     isTopicsLoading:true,
     isRepliesLoading:true,
     isNotifsLoading:true,
     showToast:false,
     nextPage:1,
     currentPage:0,
     lastPage:1,
     nextReplyPage:1,
     currentReplyPage:0,
     lastReplyPage:1,
     follow:"",
     activeTab:0,
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

showReport(visible) { this.setState({ reportOpen: visible}); }

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
     this.getProfile();
     this.getNotifs();
     this.getTopics();
     this.getReplies();
   })
 };

 getProfile = () => {
   fetch('http://quill.technopathic.me/api/getProfile/'+this.props.uid+'?token='+this.state.token, {
     headers:{
       'Authorization': 'Bearer ' + this.state.token
     }
   })
   .then(function(response) {
     return response.json()
   })
   .catch((error) => console.warn("fetch error:", error))
   .then(function(json) {
     if(json.error === "token_not_provided")
     {
        //NavigationActions.signin();
     }
     else {
       this.setState({
         profile: json,
         follow:json.follow,
         isProfileLoading:false
       })
     }
   }.bind(this))
 };

 getTopics = () => {
   var nextPage = this.state.nextPage;
   var topics = this.state.topics;
   if(this.state.currentPage !== this.state.lastPage)
   {
     fetch('http://quill.technopathic.me/api/getGames/'+this.props.uid+'?page='+this.state.nextPage+'&token=' + this.state.token, {
       headers:{
         'Authorization': 'Bearer ' + this.state.token
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
           isTopicsLoading:false
         })
       }
      }.bind(this));
   }
 };

 getReplies = () => {
   var nextReplyPage = this.state.nextReplyPage;
   var replies = this.state.replies;
   if(this.state.currentReplyPage !== this.state.lastReplyPage)
   {
     fetch('http://quill.technopathic.me/api/getJoins/'+this.props.id+'?page='+this.state.nextReplyPage+'&token='+this.state.token, {
       headers:{
         'Authorization': 'Bearer ' + this.state.token
       }
     })
      .then(function(response) {
        return response.json()
      })
      .then(function(json) {
        if(json.current_page !== json.last_page)
        {
           nextReplyPage = nextReplyPage + 1;
        }
        for(var i = 0; i < json.data.length; i++)
        {
          replies.push(json.data[i]);
        }
        this.setState({
          nextReplyPage: nextReplyPage,
          lastReplyPage: json.last_page,
          currentReplyPage: json.current_page,
          replies: replies,
          isRepliesLoading:false
        })
      }.bind(this));
    }
 };

 getNotifs = () => {
   fetch('http://quill.technopathic.me/api/getNotifCount?token='+this.state.token, {
     headers:{
       'Authorization': 'Bearer ' + this.state.token
     }
   })
   .then(function(response) {
     return response.json()
   })
   .catch((error) => console.warn("fetch error:", error))
   .then(function(json) {
     if(json.error === "token_not_provided")
     {
        //NavigationActions.signin();
     }
     else {
       this.setState({
         notifs: json,
         isNotifsLoading:false
       })
     }
   }.bind(this))
 };

 reportProfile() {
    var _this = this;

    fetch('http://quill.technopathic.me/api/reportProfile/'+this.props.uid+'?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
        return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast('There was a problem reporting this profile.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.handleReportClose();
          _this.showToast('Profile was reported.');
        }
        else if(json === 2)
        {
          _this.handleReportClose();
          _this.showToast('You cannot report yourself.');
        }
      }
    });
  };

  unReportProfile(id) {
    var _this = this;

    fetch('http://quill.technopathic.me/api/unReportProfile/'+id+'?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
        return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast('There was a problem clearing this profile.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showToast('Profile was cleared.');
        }
      }
    });
  };

  banUser(id) {
    var _this = this;

    fetch('http://quill.technopathic.me/api/banUser/'+id+'?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
        return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast('There was a problem banning this user.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('User is unbanned.');
        }
        else if(json === 1)
        {
          _this.showToast('User is banned.');
        }
      }
    });
  };

  storeFollow(id) {
    var _this = this;
    fetch('http://quill.technopathic.me/api/storeFollower?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      },
      body: JSON.stringify({
        userID: id
      })
    }).then(function(response) {
        return response.json()
    }).then(function(json) {
      if(json.error)
      {

      }
      else {
        if(json === 0)
        {
          _this.showToast('Could not find user.');
        }
        else if(json === 3)
        {
          _this.showToast('You cannot follow yourself.');
          _this.setState({
            follow:4
          })
        }
        else if(json === 1)
        {
          _this.showToast('Now following.');
          _this.setState({
            follow:1
          })
        }
        else if(json === 4)
        {
          _this.showToast('A request has been sent.');
          _this.setState({
            follow:2
          })
        }
        else if(json === 5)
        {
          _this.showToast('You were denied.');
          _this.setState({
            follow:3
          })
        }
        else if(json === 2)
        {
          _this.showToast('Unfollowed.');
          _this.setState({
            follow:0
          })
        }
      }
    }.bind(this))
  };

  renderFollow()
  {

    const followButton = {
      flex:1,
      borderWidth:1,
      borderColor:'#CCCCCC',
      margin:10,
      backgroundColor:'#FFFFFF',
      elevation:0,
    };

    const activeButton = {
      flex:1,
      borderWidth:1,
      borderColor:'#DDDDDD',
      margin:10,
      backgroundColor:'#6441A4',
      elevation:0
    };

    const buttonColor = {
      color:'#222222'
    };

    if(this.state.follow === 0)
    {
      return(
        <Button block style={followButton} onPress={() => this.storeFollow(this.state.profile.user.id)}><Text style={{color:'#222222'}}>Follow</Text></Button>
      );
    }
    else if(this.state.follow === 1)
    {
      return(
        <Button block style={activeButton} onPress={() => this.storeFollow(this.state.profile.user.id)}><Text>Following</Text></Button>
      );
    }
    else if(this.state.follow === 2)
    {
      return(
        <Button block style={followButton} onPress={() => this.storeFollow(this.state.profile.user.id)}><Text>Request Sent</Text></Button>
      );
    }
    else if(this.state.follow == 3)
    {
      return(
        <Button block style={followButton} disabled={true}><Text style={buttonColor}>Follow</Text></Button>
      );
    }
    else if(this.state.follow === 4)
    {
      return(
        <Button block style={followButton} onPress={() => {NavigationActions.editProfile({uid:this.state.profile.user.id})}}><Text style={buttonColor}>Edit Profile</Text></Button>
      );
    }
  };

  renderProfileOptions()
  {
    const leftNav = {
      flex:1,
      flexDirection:'row'
    }

    if(this.state.user.user.id === this.props.uid)
    {
      var showNotif = <Badge style={{backgroundColor:'#6441A4', marginLeft:-10, marginTop:3}}><Text>{this.state.notifs}</Text></Badge>;
      if(this.state.notifs === 0)
      {
        showNotif = <Text> </Text>;
      }
      return(
        <Left style={leftNav}>
          <Button transparent onPress={() => NavigationActions.notifications()}>
            <Icon name='notifications' size={25} style={{color:'#EEEEEE'}} />
            {showNotif}
          </Button>
        </Left>
      );
    }
    else {
      return(
        <Left style={leftNav}>
          <Button transparent onPress={() => NavigationActions.pop()}>
            <Icon name='chevron-left' size={35} style={{color:'#EEEEEE'}} />
          </Button>
        </Left>
      );
    }
  };

  renderLoadTopics = () => {

    const buttonStyleOne = {
      margin:15,
      elevation:0,
      backgroundColor:'#6441A4'
    };

    if(this.state.lastPage !== this.state.currentPage && this.state.lastReplyPage !== 0)
    {
      return(
        <Button block style={buttonStyleOne} onPress={() => this.getTopics()}><Text>Load More</Text></Button>
      )
    }
  }

  renderLoadReplies = () => {

    const buttonStyleOne = {
      margin:15,
      elevation:0,
      backgroundColor:'#6441A4'
    };

    if(this.state.lastReplyPage !== this.state.currentReplyPage && this.state.lastReplyPage !== 0)
    {
      return(
        <Button block style={buttonStyleOne} onPress={() => this.getReplies()}><Text>Load More</Text></Button>
      )
    }
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

  changeTab(id) {
    this.setState({
      activeTab:id
    })
  }

  renderTabs = () => {

    const tabBar = {
      backgroundColor:'#263238',
      flex:1,
      flexDirection:'row',
      justifyContent:'space-between'
    };

    const tabStyle = {
      backgroundColor:'#263238',
      flex:1,
      height:40,
      flexDirection:'row',
      justifyContent:'center',
      alignItems:'center',
      borderRadius:0
    };

    const activeTab = {
      backgroundColor:'#6441A4',
      flex:1,
      height:40,
      flexDirection:'row',
      justifyContent:'center',
      alignItems:'center',
      borderRadius:0
    };

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

    if(this.state.activeTab === 0)
    {
      return(
        <View>
          <View style={tabBar}>
            <Button style={activeTab} onPress={() => this.changeTab(0)}><Text style={{color:'#FFFFFF', fontWeight:'bold'}}>Joined</Text></Button>
            <Button style={tabStyle} onPress={() => this.changeTab(1)}><Text style={{color:'#FFFFFF'}}>Hosted</Text></Button>
          </View>
          {this.state.replies.map((reply, index) => (
            <View style={cardStyle} key={index}>
              <View style={cardHead}>
                <Thumbnail source={{uri:reply.avatar}} small onPress={() => {NavigationActions.profile({uid:reply.userID})}}/>
                <View style={headerStyle}>
                  <Text style={{fontSize:14, fontFamily:'Montserrat-Regular'}}>{reply.topicTitle}</Text>
                  <Text note style={{fontSize:11, fontFamily:'Montserrat-Regular'}} onPress={() => {NavigationActions.profile({uid:reply.userID})}}>{reply.profileName}</Text>
                </View>
              </View>
              <View style={itemStyle}>
                <Text onPress={() => {NavigationActions.detail({id:reply.id})}} style={{fontFamily:'Lato-Regular', fontSize:12}}>
                  {reply.topicBody}
                </Text>
              </View>
              <View style={{paddingLeft:10, paddingRight:10}}>
                <Text style={smallText} onPress={() => {NavigationActions.detail({id:reply.id})}}>
                  {reply.topicReplies} Replies &middot; {this.renderStatus(reply.topicStatus)}
                </Text>
              </View>
              <View style={optionStyle}>
                <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:reply.id})}}><Icon name="chat-bubble-outline" style={iconStyle}/></Button>
                <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => this.shareText(topic)}><Icon name="share" style={iconStyle}/></Button>
              </View>
            </View>
          ))}
          {this.renderLoadReplies()}
        </View>
      )
    }
    else if(this.state.activeTab === 1)
    {
      return(
        <View>
          <View style={tabBar}>
            <Button style={tabStyle} onPress={() => this.changeTab(0)}><Text style={{color:'#FFFFFF'}}>Joined</Text></Button>
            <Button style={activeTab} onPress={() => this.changeTab(1)}><Text style={{color:'#FFFFFF', fontWeight:'bold'}}>Hosted</Text></Button>
          </View>
          {this.state.topics.map((topic, index) => (
            <View style={cardStyle} key={index}>
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
                <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => {NavigationActions.detail({id:topic.id})}}><Icon name="chat-bubble-outline" style={iconStyle}/></Button>
                <Button transparent style={{flex:1, justifyContent:'center', borderRadius:0}} onPress={() => this.shareText(topic)}><Icon name="share" style={iconStyle}/></Button>
              </View>
            </View>
          ))}
          {this.renderLoadTopics()}
        </View>
      )
    }
  }

  render () {

    const profileHead = {
      flex:1,
      flexDirection:'row',
      marginLeft:15,
      marginRight:15,
      marginTop:15,
      paddingBottom:15,
      borderBottomWidth:1,
      borderBottomColor:'#CCCCCC'
    };

    const profileRight = {
      flex:1,
      flexDirection:'column',
      justifyContent:'center',
    };

    const profileStats = {

    };

    const profileFollow = {
      flex:1,
      flexDirection:'row'
    };

    const followBox = {
      flex:1,
      flexDirection:'column',
      justifyContent:'center',
      alignItems:'center',
      paddingLeft:5,
      paddingRight:5,
      marginTop:5,
      marginLeft:10,
      marginRight:10,
      borderRadius:3,
    };

    const statNum = {
      color:'#333333',
      fontWeight:'bold',
      fontSize:20,
    };

    const statTitle = {
      color:'#444444',
      fontSize:9,
      fontFamily:'Montserrat-Regular'
    };

    const profileButtons = {
      flex:1,
      flexDirection:'row',
      justifyContent:'center',
    };

    const avatarStyle = {
      height:100,
      width:100,
      borderRadius:5,
    };

    const textStyle = {
      fontSize:14,
      color:'#333333',
      marginTop:-3,
      fontFamily:'Lato-Regular'
    };

    const descBody = {
      fontSize:14,
      color:'#666666',
      fontFamily:'Lato-Regular'
    };

    const appBar = {
      backgroundColor:"#263238",
      flex:1,
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
      maxWidth:200,
      fontFamily:"Lobster-Regular"
    };

    const gridContainer = {
      flex:1,
      flexDirection:'row',
      flexWrap:'wrap'
    };

    const buttonStyleOne = {
      margin:15,
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

    const cardStyle = {
      flex: 1,
      shadowOpacity:0,
      elevation:0,
      borderLeftWidth:0,
      borderRightWidth:0,
      borderTopWidth:0,
      borderBottomWidth:1,
      borderBottomColor:'#EAEAEA',
      borderRadius:0,
      marginBottom:0,
      marginTop:0,
      paddingBottom:10
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
      paddingTop:0,
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

    const spinnerStyle = {
      flex:1,
      height:Dimensions.get('window').height,
      justifyContent:'center',
      alignItems:'center'
    };

    if (this.state.isProfileLoading || this.state.isTopicsLoading || this.state.isRepliesLoading || this.state.isNotifsLoading) {
      return (
        <View style={spinnerStyle}>
          <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
          <Spinner color="#6441A4"/>
        </View>
      )
    }
    else {

      var description = <ListItem><Icon name="person" style={{fontSize:22, paddingLeft:5, paddingRight:5}}/><Text style={descBody}>{this.state.profile.profile.profileDesc}</Text></ListItem>;

      if(!this.state.profile.profile.profileDesc)
      {
        description = <ListItem><Icon name="person" style={{fontSize:22, paddingLeft:5, paddingRight:5}}/><Text style={{fontSize:14, color:'#666666', fontFamily:'Lato-Regular', fontStyle:'italic'}}>No Description</Text></ListItem>;
      }

      return (
        <ScrollView>
          <Header style={appBar}>
            <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
            {this.renderProfileOptions()}
            <Text style={titleStyle}> {this.state.profile.profile.profileName} </Text>
            <Right style={{flex:1, flexDirection:'column'}}>
              <Button transparent onPress={() => ActionSheet.show(
                {
                options: ['Settings', 'Report', 'Close'],
                cancelButtonIndex:2,
                title:'Options'
                },
                (buttonIndex) => {
                  if(buttonIndex == 0)
                  {
                    NavigationActions.settings();
                  }
                  else if(buttonIndex == 1)
                  {
                    this.showReport();
                  }
                }
              )}>
                <Icon name='more-vert' size={26} style={{color:'#EEEEEE'}} />
              </Button>
            </Right>
          </Header>
          <View style={profileHead}>
            <Image style={avatarStyle} source={{uri:this.state.profile.user.avatar}}/>
            <View style={profileRight}>
              <View style={profileStats}>
                <View style={profileFollow}>
                  <View style={followBox}>
                    <Text style={statNum}>{this.state.profile.profile.profileTopics}</Text>
                    <Text style={statTitle}>Games</Text>
                  </View>
                  <TouchableHighlight onPress={() => NavigationActions.followers({id:this.state.profile.user.id})} underlayColor='#FFFFFF'>
                    <View style={followBox}>
                      <Text style={statNum}>{this.state.profile.profile.profileFollowers}</Text>
                      <Text style={statTitle}>Followers</Text>
                    </View>
                  </TouchableHighlight>
                  <TouchableHighlight onPress={() => NavigationActions.followings({id:this.state.profile.user.id})} underlayColor='#FFFFFF'>
                    <View style={followBox}>
                      <Text style={statNum}>{this.state.profile.profile.profileFollowing}</Text>
                      <Text style={statTitle}>Following</Text>
                    </View>
                  </TouchableHighlight>
                </View>
              </View>
              <View style={profileButtons}>
                {this.renderFollow()}
              </View>
            </View>
          </View>
          <List>
            {description}
          </List>
          {this.renderTabs()}
          <Modal animationType={"slide"} transparent={false} visible={this.state.reportOpen}  onRequestClose={() => {}}>
            <View style={{padding:15}}>
              <Text style={{fontFamily:'Lato-Regular', fontSize:14, color:'#555555'}}>Are you sure you want to report this Profile?</Text>

              <Button block style={buttonStyleOne} onPress={() => this.reportProfile()}><Text>Confirm</Text></Button>
              <Button block style={buttonStyleTwo} textStyle={textStyleTwo} onPress={() => { this.showReport(!this.state.reportOpen)}}><Text>Cancel</Text></Button>
            </View>
          </Modal>
        </ScrollView>
      )
    }
  }
}

const mapStateToProps = (state) => {
  return {
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
  }
}

export default Profile
