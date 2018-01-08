// @flow

import React from 'react'
import { View, ScrollView, StatusBar, Text, AsyncStorage, TextInput, TouchableOpacity, Image } from 'react-native'
import Autocomplete from 'react-native-autocomplete-input'
import { Container, Header, Content, InputGroup, List, ListItem, Button, Toast, Picker} from 'native-base';
import { Actions as NavigationActions } from 'react-native-router-flux';
import ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Styles
import styles from './Styles/CreateTopicStyle'

class CreateTopic extends React.Component {
  constructor(props) {
   super(props);
   this.state = {
     token:"",
     autoTags:[],
     autoMentions:[],
     tags:"",
     topicTags:[],
     body_left: 600,
     topicBody:"",
     topic_left: 100,
     topicTitle:"",
     topicMembers:1,
     disableSubmit: false,
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

  async componentWillMount() {
    await AsyncStorage.getItem("token")
    .then((value) => {
      this.setState({token: value});
    })
    .then(() => {
      fetch('http://quill.technopathic.me/api/getTaggable?token=' + this.state.token, {
        headers:{
          'Authorization': 'Bearer ' + this.state.token
        }
      })
      .then(function(response) {
        return response.json()
      })
      .then(function(json) {
        this.setState({
          autoTags: json
        })
      }.bind(this));
    })
  };

  handleTopicBody = (event) => {
   var input = event.nativeEvent.text;
   this.setState({
     topicBody: input,
     body_left: 600 - input.length
   })
  };

  handleTopicTitle = (event) => {
   var input = event.nativeEvent.text;
   this.setState({
     topicTitle: input,
     title_left: 100 - input.length
   })
  };

  handleTopicTags = (event) => {
    this.setState({
      tags: event.nativeEvent.text
    })
  };

  handleTopicMembers = (value) => {
    this.setState({
      topicMembers: value
    })
  };

  setTopicTags = (event, chosenRequest) => {
    var tags = this.state.topicTags;
    var tag = null;
    if(chosenRequest === undefined && event !== 0)
    {
      chosenRequest = event.nativeEvent.text;
    }
    if(chosenRequest.tagName)
    {
      tag = chosenRequest;
    }
    else if(chosenRequest.trim().length != 0){
      tag = {tagName:chosenRequest};
    }
    else {
      return;
    }

    var dup = false;
    for(var i = 0; i < tags.length; i++)
    {
      if(tags[i].tagName === tag.tagName)
      {
        dup = true;
      }
    }
    if(dup === true)
    {
      this.showToast('You cannot add this tag again.');
    }
    else {
      tags.push(tag);
      this.setState({
        topicTags:tags,
        tags:""
      });
    }
  };

  findTags(query) {
   if (query === '') {
     return [];
   }

   const { autoTags } = this.state;
   const regex = new RegExp(`${query.trim()}`, 'i');
   return autoTags.filter(tag => tag.tagName.search(regex) >= 0);
  };

  handleTagDelete = (index) => {
    this.topicTags = this.state.topicTags;
    this.topicTags.splice(index, 1);
    this.setState({topicTags: this.topicTags});
  };

  storeTopic() {
    var _this = this;

    var data = new FormData();
    data.append('topicTitle', this.state.topicTitle);
    data.append('topicBody', this.state.topicBody);
    data.append('topicMembers', this.state.topicMembers);
    data.append('topicTags', JSON.stringify(this.state.topicTags));

    fetch('http://quill.technopathic.me/api/storeTopic?token=' + this.state.token, {
      method: 'POST',
      body:data,
      headers: {
        'Authorization': 'Bearer ' + this.state.token
      }
    }).then(function(response) {
        return response.json()
    })
    .then(function(json) {
      if(json.error)
      {
        _this.showToast('There was a problem posting this.');
      }
      else {
        if(json === 0)
        {
          _this.showToast('You cannot make an empty post.');
        }
        else if(json === 2)
        {
          _this.showToast('You do not have permission.');
        }
        else if(json === 3)
        {
          _this.showToast('You can only have 3 mentions.');
        }
        else if(json === 4)
        {
          _this.showToast('Your post is too long.');
        }
        else if(json === 5)
        {
          _this.showToast('Your image is too big.');
        }
        else if(json === 6)
        {
          _this.showToast('Not a valid PNG/JPG/GIF image.');
        }
        else if(json === 7)
        {
          _this.showToast('You can only have 10 tags.');
        }
        else if(json === 8)
        {
          _this.showToast("Slow down, you've already posted in the last 2minutes");
        }
        else {
          _this.setState({
            disableSubmit:true
          })
          _this.showToast('Successfully Added!.');
          setTimeout(function(){NavigationActions.root({refresh: {index:0}})}, 3000);
        }
      }
    }.bind(this));
  };

  render () {

    const smallText = {
      fontSize:11,
      marginLeft:5,
      fontFamily:'Montserrat-Regular'
    };

    const topicOptions = {
      flex:1,
      flexDirection:'row',
      justifyContent:'space-between'
    };

    const iconStyle = {
      color:'#666666',
      fontSize:22
    };

    const inputStyle = {
      marginTop:15
    };

    const chipStyle = {
      flex:1,
      flexDirection:'row'
    };

    const singleChip = {
      backgroundColor:'#EEEEEE',
      borderRadius:25,
      paddingTop:2,
      paddingBottom:2,
      paddingLeft:10,
      paddingRight:10,
      margin:3,
    };

    const tagIcon = {
      fontSize:16,
    };

    const autoInputStyle = {
      backgroundColor:'transparent',
      borderWidth:0,
      margin:0,
      marginTop:5,
      marginBottom:5,
    };

    const autoStyle = {
      paddingLeft:10,
      paddingRight:10,
      paddingTop:3,
      paddingBottom:3,
      margin:0
    };

    const buttonStyleOne = {
      margin:15,
      elevation:0,
      backgroundColor:'#6441A4',
    };

    const autocompleteContainerOne = {
      flex: 1,
      left: 0,
      position: 'absolute',
      right: 0,
      top: -200,
      zIndex: 1
    };

    const autocompleteContainerTwo = {
      flex: 1,
      left: 0,
      position: 'absolute',
      right: 0,
      top: -400,
      zIndex: 1
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
      fontFamily:"Lobster-Regular"
    };

    const contentStyle = {
      padding:10
    }

    const { tags } = this.state;
    const autoTags = this.findTags(tags);
    const comp = (s, s2) => s.toLowerCase().trim() === s2.toLowerCase().trim();

    return (
      <ScrollView>
        <Header style={appBar}>
          <StatusBar backgroundColor="#6441A4" barStyle='light-content' />
          <Text style={titleStyle}> New Campaign </Text>
        </Header>
        <Content style={contentStyle}>
          <TextInput style={{fontFamily:'Lato-Regular'}} value={this.state.topicTitle} onChange={this.handleTopicTitle} placeholder='Campaign Title' selectionColor="#6441A4" underlineColorAndroid="#6441A4"/>
          <View style={topicOptions}>
            <Text style={smallText}>{this.state.title_left}</Text>
          </View>
          <TextInput style={{fontFamily:'Lato-Regular'}} multiline={true} numberOfLines={4} value={this.state.topicBody} onChange={this.handleTopicBody} placeholder='Campaign Description' selectionColor="#6441A4" underlineColorAndroid="#6441A4"/>
          <View style={topicOptions}>
            <Text style={smallText}>{this.state.body_left}</Text>
          </View>
          <Picker
            supportedOrientations={['portrait','landscape']}
            iosHeader="Number of Players"
            mode="dropdown"
            selectedValue={this.state.topicMembers}
            onValueChange={this.handleTopicMembers}>
              <Picker.Item label="1 Player" value="1" />
              <Picker.Item label="2 Players" value="2" />
              <Picker.Item label="3 Players" value="3" />
              <Picker.Item label="4 Players" value="4" />
              <Picker.Item label="5 Player" value="5" />
              <Picker.Item label="6 Players" value="6" />
              <Picker.Item label="7 Players" value="7" />
              <Picker.Item label="8 Players" value="8" />
              <Picker.Item label="9 Players" value="9" />
              <Picker.Item label="10 Players" value="10" />
          </Picker>
          <Autocomplete
            style={autoInputStyle}
            listStyle={autoStyle}
            inputContainerStyle={autoInputStyle}
            autoCapitalize="none"
            autoCorrect={false}
            defaultValue={tags}
            onChangeText={text => this.setState({ tags: text })}
            data={autoTags.length === 1 && comp(tags, autoTags[0].tagName) ? [] : autoTags}
            placeholder="Add your tags"
            renderItem={({ id, tagName }) => (
              <TouchableOpacity onPress={() => this.setTopicTags(0, {id, tagName})}>
                <Text>
                  {tagName}
                </Text>
              </TouchableOpacity>
            )}
            onSubmitEditing={this.setTopicTags}
            selectionColor="#6441A4" underlineColorAndroid="#6441A4"
          />
          <View style={chipStyle}>
            {this.state.topicTags.map((topicTag, i) => (
              <Text key={i} onPress={() => this.handleTagDelete(i)} style={singleChip}>
                {topicTag.tagName}
              </Text>
            ))}
          </View>
        </Content>
        <Button block style={buttonStyleOne} onPress={() => this.storeTopic()} disabled={this.state.disableSubmit}><Text style={{color:'#FFFFFF', fontWeight:'bold'}}>Done</Text></Button>
      </ScrollView>
    )
  }
}

export default CreateTopic
