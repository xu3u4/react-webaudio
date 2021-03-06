//
// Basic React Web Audio example which loads in a bunch of files and plays them

/* jshint strict: false */
/* global React : false */
/* global ReactWebAudio : false */

function onError(e) {
  window.console.log(e);
}

//
// load the given audio file and call some callback when done
//

function loadaudio(audiocontext, filename, loadcompletedcallback) {
  var request = new XMLHttpRequest();
  request.open('GET', filename, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    audiocontext.decodeAudioData(request.response, function(buffer) {
      loadcompletedcallback(filename, buffer);
    }, onError);
  };
  request.send();
}

//
// Describes the props required for both SoundInfoDisplay and AudioGraph components
//

var SoundDataShape = React.PropTypes.shape({
  filename: React.PropTypes.string,
  audiobuffer: React.PropTypes.instanceOf(AudioBuffer),
  timesplayed: React.PropTypes.number
});

var SoundDataList = React.PropTypes.arrayOf(SoundDataShape);

//
// Component that displays info about the sounds specified in props.sounds
// Pressing a 'restart' button will restart the given sound via a callback to
// the owner component.
//

var SoundInfoDisplay = React.createClass({
  displayName: 'SoundInfoDisplay',
  propTypes: {
    sounds: SoundDataList.isRequired,
    restartcallback : React.PropTypes.func.isRequired
  },
  render: function() {
    var infoElements = _.map(this.props.sounds, function(sounddata) {
      var restartthissound = function(){ this.props.restartcallback(sounddata.filename); }.bind(this);
      return React.createElement("div",
				 {key:sounddata.filename,className:'sound-item'},
				 React.createElement("div",
						     {key:sounddata.filename}, "Sound " + sounddata.filename + " playing, times played " + sounddata.timesplayed),
				 React.createElement("button",{key:sounddata.filename + 'button', onClick: restartthissound}, "Restart")
				);
    }, this);
    return React.createElement("div", null, infoElements);
  }
});

//
// mixin to
//

//
// Component that instantiates a bunch of audio nodes to play the sounds provided
//

var AudioGraph = React.createClass({
  displayName: 'AudioGraph',
  propTypes: {
    audiocontext: React.PropTypes.instanceOf(AudioContext).isRequired,
    sounds: SoundDataList.isRequired
  },
  render: function() {
    var audioElements = this.props.sounds.map(function(sounddata) {
      var soundprops = {
        key: sounddata.filename,
        buffer: sounddata.audiobuffer,
        triggerkey: sounddata.timesplayed
      };
      return React.createElement(ReactWebAudio.AudioBufferSourceNode, soundprops);
    });
    return React.createElement(ReactWebAudio.AudioContext, {audiocontext:this.props.audiocontext}, audioElements);
  }
});

//
// Dynamically load audio files (listed in an array)
// As each file is loaded it gets a GUI with start/stop buttons and begins playing
//
var LoadAndPlayBuffers = React.createClass({
  displayName: 'LoadAndPlayBuffers',
  propTypes: {
    filemanifest: React.PropTypes.arrayOf(React.PropTypes.string).isRequired
  },
  getInitialState: function() {
    return {
      loadedsounds: [],
      audiocontext: new AudioContext()
    };
  },
  addSound: function(name, buffer) {
    var sounddata = {filename:name, audiobuffer:buffer, timesplayed:1};
    this.state.loadedsounds.push(sounddata);
    var newloadedsounds = this.state.loadedsounds;
    this.setState({loadedsounds: newloadedsounds});
  },
  restartSound: function(name) {
    var oldsounds = this.state.loadedsounds;
    var incrementnamedsound = function (value) {
      if (value.filename === name) {
        var newvalue = _.clone(value);
        newvalue.timesplayed += 1;
        return newvalue;
      }
      return value;
    };
    var newsounds = _(oldsounds).map(incrementnamedsound).value();
    this.setState({loadedsounds:newsounds});
  },
  componentDidMount: function() {
    // send off requests to load each of the audio files
    this.props.filemanifest.forEach(function (filename) {
      loadaudio(this.state.audiocontext, filename, this.addSound); // yuck
    }, this);
  },
  render: function() {
    var loadedsounds = this.state.loadedsounds;
    return React.createElement("div",
			       {},
			       React.createElement(SoundInfoDisplay, {sounds:loadedsounds, restartcallback:this.restartSound}),
			       React.createElement(AudioGraph, {audiocontext:this.state.audiocontext, sounds:loadedsounds})
			      );
  }
});


/* jshint unused:false */
function playbufferstart() {
  // the app state starts out with a manifest of files to load
  // and none of them loaded.
  
  var manifest = [
    "../assets/16847__bjornredtail__vacuum-startup.wav",
    "../assets/14401__acclivity__chimebar-c-low-proc.wav",
    "../assets/Poofy Reel.mp3"
  ];

  var appstate = {filemanifest:manifest};

  var renderelement = document.getElementById("webaudio-div");

  ReactWebAudio.render(React.createElement(LoadAndPlayBuffers, appstate), renderelement);
}

