const box = document.getElementById("messages");
const inputBox = document.getElementById("messageInput");
const message = document.getElementById("messageBox");

message.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("sendButton").click();
  }
});

function addMessage() {
  const newMessage = document.createElement("p");
  newMessage.classList.add("message", "self");
  const newMessageText = document.createTextNode(message.value);
  newMessage.appendChild(newMessageText);
  box.insertBefore(newMessage, inputBox);
  if (localConnection) {
    const dataChannel = getDataChannel();
    dataChannel.send(message.value);
  } else {
    const remoteConnection = getRemoteConnectionObject();
    remoteConnection.dc.send(message.value);
  }
  message.value = "";
}

const addIncomingMessage = (message) => {
  const newMessage = document.createElement("p");
  newMessage.classList.add("message", "remote");
  const newMessageText = document.createTextNode(message);
  newMessage.appendChild(newMessageText);
  box.insertBefore(newMessage, inputBox);
};

document.getElementById("sendButton").addEventListener("click", addMessage);

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const meetings = document.getElementById("meetings");
const selfVideo = document.getElementById("selfVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localConnection;
let dataChannel;
let remoteConnection;
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Google's public STUN server
    },
  ],
};

const getLocalConnectionObject = () => {
  if (localConnection) {
    return localConnection;
  } else {
    localConnection = new RTCPeerConnection(configuration);
    localConnection.ontrack = (event) => {
      console.log("Track added");
      remoteVideo.srcObject = event.streams[0]; // Set remote video
    };
    return localConnection;
  }
};

const getRemoteConnectionObject = () => {
  if (remoteConnection) {
    return remoteConnection;
  } else {
    remoteConnection = new RTCPeerConnection(configuration);
    remoteConnection.ontrack = (event) => {
      console.log("Track added to remote connection");
      remoteVideo.srcObject = event.streams[0]; // Set remote video
    };
    return remoteConnection;
  }
};

const getDataChannel = () => {
  if (dataChannel) {
    return dataChannel;
  } else {
    const localConnection = getLocalConnectionObject();
    dataChannel = localConnection.createDataChannel("channel");
    dataChannel.onopen = () => console.log("Data channel opened");
    dataChannel.onmessage = (event) => addIncomingMessage(event.data);
    return dataChannel;
  }
};

let localStream = new MediaStream();
let remoteStream = new MediaStream();

const startStreaming = async () => {
  const localConnection = getLocalConnectionObject();
  const dataChannel = getDataChannel();
  const media = await navigator.mediaDevices.getUserMedia({
    audio: true, // Enable both audio and video
    video: true,
  });
  selfVideo.srcObject = media;
  localStream = media;
  // Add all tracks (video and audio)
  localStream.getTracks().forEach((track) => {
    localConnection.addTrack(track, localStream);
  });
  console.log("Added tracks to local connection");
};

createBtn.addEventListener("click", async () => {
  const localConnection = getLocalConnectionObject();
  const dataChannel = getDataChannel();

  localConnection.onicecandidate = async (e) => {
    console.log("ICE Candidate found");

    if (e.candidate) {
      console.log("Candidate Found");
    }

    const res = await fetch("http://localhost:8001", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offer: SDP, userId: "1234" }),
    });
    const { url } = await res.json();
    const meet = document.createElement("p");
    meet.classList.add("meet");
    const meetLink = document.createTextNode(url);
    const joinButton = document.createElement("button");
    joinButton.innerHTML = "Join";
    joinButton.addEventListener("click", async () => {
      const res = await fetch(`http://localhost:8001/${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: "1234" }),
      });
      const answer = await res.json();
      console.log(answer);
      localConnection.setRemoteDescription(answer);
      console.log("Answer set");
      await startStreaming();
    });
    meet.appendChild(meetLink);
    meet.appendChild(joinButton);
    meetings.append(meet);
  };

  const localSDP = await localConnection.createOffer();
  localConnection.setLocalDescription(localSDP);
});

joinBtn.addEventListener("click", async () => {
  const link = prompt("Enter URL");
  const userId = prompt("Enter userId");
  const res = await fetch(`http://localhost:8001/${link}`, {
    method: "POST",
    body: JSON.stringify({ userId: userId ?? "" }),
  });
  const { offer } = await res.json();
  const rc = getRemoteConnectionObject();
  console.log(offer);
  rc.onicecandidate = async (e) => {
    console.log("New Ice Candidate", rc.localDescription);
    const SDP = rc.localDescription.toJSON();
    await fetch(`http://localhost:8001/${link}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(SDP),
    });
  };

  rc.ondatachannel = (e) => {
    console.log("Data channel received");
    rc.dc = e.channel;
    rc.dc.onmessage = (e) => addIncomingMessage(e.data);
    rc.dc.onopen = () => console.log("Data channel opened");
  };

  rc.setRemoteDescription(offer).then(() => {
    console.log("Offer set");
    rc.createAnswer()
      .then((answer) => rc.setLocalDescription(answer))
      .then(() => console.log("Answer created"))
      .catch((err) => console.error("Error creating answer:", err));
  });
});
