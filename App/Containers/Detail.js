// @flow

import React from 'react';
import { ScrollView, Image, StatusBar, View, AsyncStorage, Modal, Dimensions, TextInput, FlatList } from 'react-native';
import { Actions as NavigationActions } from 'react-native-router-flux';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';

import Pusher from 'pusher-js/react-native';
var pusher = new Pusher('02d8bbd5341faf8853d4');

import { Container, Header, Content, Card, CardItem, Thumbnail, Text, Button, Left, Body, Right, List, ListItem, Footer, Input, Toast, ActionSheet, Spinner} from 'native-base';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Styles
import detailStyles from './Styles/DetailStyle'
import styles from './Styles/HomeStyle'

class Detail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      token:"",
      user:"",
      topic: null,
      player:0,
      replies:[],
      chars_left: 1000,
      replyBody:"",
      replyMentions:[],
      selectReply:0,
      shareOpen: false,
      nextPage:1,
      currentPage:0,
      lastPage:1,
      topicLoading:true,
      repliesLoading:true,
      optionsModal: false,
      reportModal: false,
      deleteModal: false,
      replyModal: false,
      reportReplyModal: false,
      deleteReplyModal: false,
      showToast:false,
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
     this.channel = pusher.subscribe('topic-'+this.props.id);
     this.channel.bind('replySend', this.updateChat);
     this.getTopic();
     this.getReplies();
     //this.getReplies();
    })
  };

  getTopic = () => {
    fetch('http://quill.technopathic.me/api/showTopic/'+this.props.id+'?token='+this.state.token, {
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      }
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(json) {
      this.setState({
        topic: json.topic,
        player: json.player,
        topicLoading:false
      })
    }.bind(this));
  };

  getReplies = () => {
    var nextPage = this.state.nextPage;
    var replies = this.state.replies;
    if(this.state.currentPage !== this.state.lastPage)
    {
      fetch('http://quill.technopathic.me/api/getReplies/'+this.props.id+'?page='+this.state.nextPage+'&token='+this.state.token, {
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
            nextPage = nextPage + 1;
         }
         for(var i = 0; i < json.data.length; i++)
         {
           replies.push(json.data[i]);
         }
         this.setState({
           nextPage: nextPage,
           lastPage: json.last_page,
           currentPage: json.current_page,
           replies: replies,
           repliesLoading:false
         })
       }.bind(this));
     }
  };

  storeReply = (messages = []) => {
    var _this = this;
    fetch('http://quill.technopathic.me/api/storeReply?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      },
      body: JSON.stringify({
        topicID: this.props.id,
        replyBody: messages[0].text
      })
    }).then(function(response) {
        return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast(json.error);
      }
      else if(json.success)
      {
        //_this.showToast(json.success);
      }
    });
  };


  updateChat = (replies = []) => {
    this.setState((previousState) => {
      return {
        replies: GiftedChat.append(previousState.replies, replies),
      };
    });
  }

  handleShareOpen = () => {
    this.setState({shareOpen: true});
  };

  handleShareClose = () => {
    this.setState({shareOpen: false});
  };

  showReport(visible) { this.setState({optionsModal:false, reportModal: visible}); }
  showDelete(visible) { this.setState({optionsModal:false, deleteModal: visible}); }

  showReplyReport(visible) { this.setState({replyModal:false, reportReplyModal: visible}); }
  showReplyDelete(visible) { this.setState({replyModal:false, deleteReplyModal: visible}); }

  deleteTopic() {
    var _this = this;

    fetch('http://quill.technopathic.me/api/deleteTopic/'+this.props.id+'?token=' + this.state.token, {
      method: 'POST',
      headers:{
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
        return response.json();
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast('There was a problem posting this.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showDelete(!this.state.deleteModal)
          _this.showToast('Topic was deleted.');
          setTimeout(function(){NavigationActions.pop({refresh: {index:0}})}, 2000);
        }
      }
    });
  };

  leaveTopic() {
    var _this = this;

    fetch('http://quill.technopathic.me/api/leaveGame/'+this.props.id+'?token=' + this.state.token, {
      headers: {
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast(json.error);
      }
      else if(json.success){
        _this.showToast(json.success);
        NavigationActions.root({refresh: {index:0}});
      }
    })
  }

  closeGame() {
    var _this = this;
    var topic = this.state.topic;
    fetch('http://quill.technopathic.me/api/closeGame/'+this.props.id+'?token=' + this.state.token, {
      headers: {
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast(json.error);
      }
      else if(json.success){
        topic.topicStatus = "Closed";
        _this.setState({
          topic:topic
        })
        _this.showToast(json.success);
      }
    })
  }

  completeGame() {
    var _this = this;
    var topic = this.state.topic;
    fetch('http://quill.technopathic.me/api/completeGame/'+this.props.id+'?token=' + this.state.token, {
      headers: {
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast(json.error);
      }
      else if(json.success){
        topic.topicStatus = "Complete";
        _this.setState({
          topic:topic
        })
        _this.showToast(json.success);
      }
    })
  }

  reportTopic(id)
  {
    var _this = this;

    fetch('http://quill.technopathic.me/api/reportTopic/'+id+'?token=' + this.state.token, {
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
        _this.showToast('There was a problem reporting this topic.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showReport(!this.state.reportModal);
          _this.showToast('Topic was reported.');
        }
        else if(json === 2)
        {
          _this.showReport(!this.state.reportModal);
          _this.showToast('You cannot report yourself.');
        }
      }
    });
  };

  unReportTopic(id)
  {
    var _this = this;

    fetch('http://quill.technopathic.me/api/unReportTopic/'+id+'?token=' + this.state.token, {
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
        _this.showToast('There was a problem clearing this topic.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showToast('Topic was cleared');
        }
      }
    });
  };

  deleteReply(id) {
    var _this = this;

    fetch('http://quill.technopathic.me/api/deleteReply/'+id+'?token=' + this.state.token, {
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
        _this.showToast('There was a problem deleting this.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showReplyDelete(!this.state.deleteReplyModal);
          _this.showToast('Reply was deleted.');
        }
      }
    });
  }

  reportReply(id) {
    var _this = this;

    fetch('http://quill.technopathic.me/api/reportReply/'+id+'?token=' + this.state.token, {
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
        _this.showToast('There was a problem reporting this reply.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showReplyReport(!this.state.reportReplyModal);
          _this.showToast('Reply was reported.');
        }
        else if(json === 2)
        {
          _this.showReplyReport(!this.state.reportReplyModal);
          _this.showToast('You cannot report yourself.');
        }
      }
    });
  };

  unReportReply(id)
  {
    var _this = this;

    fetch('http://quill.technopathic.me/api/unReportReply/'+id+'?token=' + this.state.token, {
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
        _this.showToast('There was a problem clearing this reply.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 1)
        {
          _this.showReplyReport(!this.state.reportReplyModal);
          _this.showToast('Reply was cleared.');
        }
      }
    });
  };

  optionPanel = () => {

    if(this.state.user.user.role == 1 || this.state.user.user.id == this.state.topic.userID)
    {
      if(this.state.topic.topicStatus === 'Open')
      {
        return(
          <Button transparent onPress={() => ActionSheet.show(
            {
            options: ['Report', 'Close', 'Delete'],
            cancelButtonIndex:4,
            title:'Options'
            },
            (buttonIndex) => {
              if(buttonIndex == 0)
              {
                this.showReport(!this.state.reportModal);
              }
              else if(buttonIndex == 1)
              {
                this.closeGame();
              }
              else if(buttonIndex == 2)
              {
                this.showDelete(!this.state.deleteModal);
              }
            }
          )}>
            <Icon name='more-vert' size={26} style={{color:'#EEEEEE'}} />
          </Button>
        );
      }
      else if(this.state.topic.topicStatus === 'Closed'){
        return(
          <Button transparent onPress={() => ActionSheet.show(
            {
            options: ['Report', 'Complete', 'Delete'],
            cancelButtonIndex:4,
            title:'Options'
            },
            (buttonIndex) => {
              if(buttonIndex == 0)
              {
                this.showReport(!this.state.reportModal);
              }
              else if(buttonIndex == 1)
              {
                this.completeGame();
              }
              else if(buttonIndex == 2)
              {
                this.showDelete(!this.state.deleteModal);
              }
            }
          )}>
            <Icon name='more-vert' size={26} style={{color:'#EEEEEE'}} />
          </Button>
        );
      }
    }
    else if(this.state.player === 1)
    {
      return(
        <Button transparent onPress={() => ActionSheet.show(
          {
          options: ['Report', 'Leave'],
          cancelButtonIndex:3,
          title:'Options'
          },
          (buttonIndex) => {
            if(buttonIndex == 0)
            {
              this.showReport(!this.state.reportModal);
            }
            else if(buttonIndex == 1)
            {
              this.leaveTopic();
            }
          }
        )}>
          <Icon name='more-vert' size={26} style={{color:'#EEEEEE'}} />
        </Button>
      );
    }
    else if(this.state.player === 0)
    {
      return(
        <Button transparent onPress={() => ActionSheet.show(
          {
          options: ['Report'],
          cancelButtonIndex:1,
          title:'Options'
          },
          (buttonIndex) => {
            if(buttonIndex == 0)
            {
              this.showReport(!this.state.reportModal);
            }
          }
        )}>
          <Icon name='more-vert' size={26} style={{color:'#EEEEEE'}} />
        </Button>
      );
    }
  }

  optionReplyPanel = () => {

    if(this.state.user.user.id == this.state.topic.userID &&| this.state.user.user.role == 1)
    {
      return (
        ActionSheet.show(
        {
          options: ['Report', 'Ban User'],
          cancelButtonIndex:3,
          title:'Options'
          },
          (buttonIndex) => {
            if(buttonIndex == 0)
            {
              this.showReplyReport(!this.state.reportReplyModal);
            }
            else if(buttonIndex == 1)
            {
              this.showBanUser(!this.state.banUserModel);
            }
          }
        )
      );
    }
    else if(this.state.user.user.id != this.state.topic.userID && this.state.user.user.role == 1)
    {
      return (
        ActionSheet.show(
        {
          options: ['Report', 'Ban User', 'Delete'],
          cancelButtonIndex:4,
          title:'Options'
          },
          (buttonIndex) => {
            if(buttonIndex == 0)
            {
              this.showReplyReport(!this.state.reportReplyModal);
            }
            else if(buttonIndex == 1)
            {
              this.showBanUser(!this.state.banUserModel);
            }
            else if(buttonIndex == 2)
            {
              this.showReplyDelete(!this.state.deleteReplyModal);
            }
          }
        )
      );
    }
    else {
      return (
        ActionSheet.show(
        {
          options: ['Report'],
          cancelButtonIndex:4,
          title:'Options'
          },
          (buttonIndex) => {
            if(buttonIndex == 0)
            {
              this.showReplyReport(!this.state.reportReplyModal);
            }
          }
        )
      );
    }
  }

  renderBubble = (props) => {
     var nameStyle = {
      fontSize:11,
      color:'#888888',
      marginTop:-20,
      marginLeft:10,
      fontFamily:'Montserrat-Regular'
    }

    const wrapperStyle = {
      left: {
        alignSelf: 'stretch',
        marginRight: 0,
        borderRadius:0,
        backgroundColor:'transparent',
      }
    }

    var textStyle = {
      right: {
        color: '#222222',
      }
    }

    var chatStyle = {
      flex:1,
      borderBottomWidth:1,
      borderBottomColor:'#FFFFFF',
      borderRadius:0,
      padding:10,
      backgroundColor:'#FAFAFA',
      borderTopLeftRadius:5,
      borderBottomLeftRadius:5
    }

    if(props.currentMessage.user._id === this.state.topic.userID)
    {
      chatStyle = {
        flex:1,
        borderBottomWidth:1,
        borderBottomColor:'#FFFFFF',
        borderRadius:0,
        padding:10,
        backgroundColor:'#6441a4',
        borderTopLeftRadius:5,
        borderBottomLeftRadius:5
      }

      nameStyle = {
       fontSize:11,
       color:'#FFFFFF',
       marginTop:-20,
       marginLeft:10,
       fontFamily:'Montserrat-Regular'
     }

      textStyle = {
        left: {
          color: '#FFFFFF',
        }
      }

    }
    return (
      <View style={chatStyle}>
  			<Bubble
  				{...props}
          touchableProps={{
            onPress: () => {
              this.setState({
                selectReply:props.currentMessage._id
              });
              this.optionReplyPanel()
            }
          }}
  				wrapperStyle={wrapperStyle}
          textStyle={textStyle}
  			/>
        <Text style={nameStyle}>{props.currentMessage.user.name}</Text>
      </View>
		);
	}

  renderLoading = () => {
    const spinnerStyle = {
      flex:1,
      height:Dimensions.get('window').height,
      justifyContent:'center',
      alignItems:'center'
    };

    return (
      <View style={spinnerStyle}>
        <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
        <Spinner color="#6441A4"/>
      </View>
    );
  }

  renderMore = () => {
    if(this.state.currentPage === this.state.lastPage) {
      return true;
    } else {
      return false;
    }
  }

  render() {

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
      fontFamily:'Lobster-Regular',
      flex:1,
      justifyContent:"center",
      alignItems:"center"
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

    if (this.state.topicLoading || this.state.repliesLoading) {
      return(
        this.renderLoading()
      )
    }
    else {
      return (
        <Container>
            <Header style={appBar}>
              <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
              <Left>
                <Button transparent onPress={() => NavigationActions.pop({refresh: {index:0}})}>
                  <Icon name='chevron-left' size={35} style={{color:'#EEEEEE'}} />
                </Button>
              </Left>
              <Text style={titleStyle} numberOfLines={1} ellipsizeMode="tail"> {this.state.topic.topicTitle} </Text>
              <Right style={{flex:1, flexDirection:'column'}}>
                {this.optionPanel()}
              </Right>
            </Header>
            <GiftedChat
              messages={this.state.replies}
              onSend={this.storeReply}
              renderBubble={this.renderBubble}
              alwaysRenderAvatar={true}
              renderLoading={this.renderLoading}
              loadEarlier={this.renderMore()}
              onLoadEarlier={this.getReplies}
            />

          <Modal animationType={"slide"} transparent={false} visible={this.state.reportModal}  onRequestClose={() => {}}>
            <View style={{padding:15}}>
              <Text style={{fontFamily:'Lato-Regular', fontSize:14, color:'#555555'}}>Are you sure you want to report this topic?</Text>

              <Button block style={buttonStyleOne} onPress={() => this.reportTopic()}><Text>Confirm</Text></Button>
              <Button block style={buttonStyleTwo} textStyle={styles.textStyleTwo} onPress={() => { this.showReport(!this.state.reportModal)}}><Text>Cancel</Text></Button>
            </View>
          </Modal>

          <Modal animationType={"slide"} transparent={false} visible={this.state.deleteModal}  onRequestClose={() => {}}>
            <View style={{padding:15}}>
              <Text style={{fontFamily:'Lato-Regular', fontSize:14, color:'#555555'}}>Are you sure you want to delete this game?</Text>

              <Button block style={buttonStyleOne} onPress={() => this.deleteTopic()}><Text>Confirm</Text></Button>
              <Button block style={buttonStyleTwo} textStyle={styles.textStyleTwo} onPress={() => { this.showDelete(!this.state.deleteModal)}}><Text>Cancel</Text></Button>
            </View>
          </Modal>

          <Modal animationType={"slide"} transparent={false} visible={this.state.reportReplyModal}  onRequestClose={() => {}}>
            <View style={{padding:15}}>
              <Text style={{fontFamily:'Lato-Regular', fontSize:14, color:'#555555'}}>Are you sure you want to report this reply?</Text>

              <Button block style={buttonStyleOne} onPress={() => this.reportReply()}><Text>Confirm</Text></Button>
              <Button block style={buttonStyleTwo} textStyle={styles.textStyleTwo} onPress={() => { this.showReplyReport(!this.state.reportReplyModal)}}><Text>Cancel</Text></Button>
            </View>
          </Modal>

          <Modal animationType={"slide"} transparent={false} visible={this.state.deleteReplyModal}  onRequestClose={() => {}}>
            <View style={{padding:15}}>
              <Text style={{fontFamily:'Lato-Regular', fontSize:14, color:'#555555'}}>Are you sure you want to delete this reply?</Text>

              <Button block style={buttonStyleOne} onPress={() => this.deleteReply()}><Text>Confirm</Text></Button>
              <Button block style={buttonStyleTwo} textStyle={styles.textStyleTwo} onPress={() => { this.showReplyDelete(!this.state.deleteReplyModal)}}><Text>Cancel</Text></Button>
            </View>
          </Modal>
        </Container>
      );
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

export default Detail
