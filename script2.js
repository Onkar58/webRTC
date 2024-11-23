const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const endBtn = document.getElementById("endBtn");
const waitingBtn = document.getElementById("waitingBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const meetings = document.getElementById("meetings");
const defaultJoin = document.getElementById("defaultJoin");
const chatBtn = document.getElementById("chatBtn");

let peerConnection;
let dataChannel;
let localStream = new MediaStream();
let remoteStream;

const getPeerConnection = () => {
  if (peerConnection) {
    return peerConnection;
  } else {
    peerConnection = new RTCPeerConnection();
    return peerConnection;
  }
};
const getDataChannel = () => {
  if (dataChannel) {
    return dataChannel;
  } else {
    peerConnection = getPeerConnection();
    dataChannel = peerConnection.createDataChannel("channel");
    return dataChannel;
  }
};

const createOffer = async () => {
  let offer;
  peerConnection = getPeerConnection();
  dataChannel = getDataChannel();
  console.log(peerConnection, dataChannel);
  dataChannel.onopen = () => console.log("Data channel opened");
  dataChannel.onmessage = (event) => addIncomingMessage(event.data);

  const media = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  joinBtn.classList.add("hide");
  createBtn.classList.add("hide");

  localVideo.srcObject = media;
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  media.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = async (event) => {
    console.log("Getting remote track");
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onconnectionstatechange = async (e) => {
    console.log(peerConnection.connectionState);
    if (peerConnection.connectionState === "connected") {
      endBtn.classList.remove("hide");
      waitingBtn.classList.add("hide");
      chatBtn.classList.remove("hide");
      meetings.classList.add("hide");
    }
    if (peerConnection.connectionState === "connecting") {
      waitingBtn.classList.remove("hide");
      waitingBtn.innerHTML = "User 2 Joined";
    }
    if (peerConnection.connectionState === "disconnected") {
      remoteVideo.srcObject = null;
      alert("User 2 left");
    }
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      offer = peerConnection.localDescription;
      console.log("getting");
    } else {
      const userId = prompt("Enter your UserId");
      const res = await fetch("https://192.168.1.19:8001/postoffer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer, userId }),
      });
      const { url } = await res.json();
      const meet = document.createElement("p");
      meet.classList.add("meet");
      const meetLink = document.createElement("button");
      meetLink.innerHTML = "Copy URL";
      meetLink.style.marginRight = "10px";
      meetLink.addEventListener("click", async () => {
        await navigator.clipboard.writeText(url);
        alert("URL Copied to Clipboard");
      });
      const joinButton = document.createElement("button");
      joinButton.innerHTML = "Join";
      joinButton.addEventListener("click", async () => {
        const res = await fetch(`https://192.168.1.19:8001/${url}/getanswer`);
        try {
          let answer = await res.json();
          if (!peerConnection.currentRemoteDescription) {
            peerConnection.setRemoteDescription(answer);
          }
        } catch (err) {
          alert("User 2 not joined");
        }
      });
      meet.appendChild(meetLink);
      meet.appendChild(joinButton);
      meetings.append(meet);
    }
  };

  offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
};

const createAnswer = async () => {
  createBtn.classList.add("hide");
  joinBtn.classList.add("hide");
  let url = prompt("Enter URL");
  const res = await fetch(`https://192.168.1.19:8001/${url}/getoffer`);
  let offer = await res.json();
  let answer;
  peerConnection = getPeerConnection();

  peerConnection.ondatachannel = (e) => {
    console.log("Data channel received");
    peerConnection.dc = e.channel;
    peerConnection.dc.onmessage = (e) => addIncomingMessage(e.data);
    peerConnection.dc.onopen = () =>
      console.log("Data channel opened from receiver");
  };
  const media = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  peerConnection.onconnectionstatechange = async (e) => {
    console.log(peerConnection, waitingBtn);
    if (peerConnection.connectionState === "connected") {
      endBtn.classList.remove("hide");
      chatBtn.classList.remove("hide");
      waitingBtn.classList.add("hide");
    }
    if (peerConnection.connectionState === "connecting") {
      waitingBtn.classList.remove("hide");
    }
    if (peerConnection.connectionState === "disconnected") {
      remoteVideo.srcObject = null;
      alert("User 2 left");
    }
  };

  localVideo.srcObject = media;
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  media.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = async (event) => {
    console.log("Getting remote track2 ");
    console.log(event);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      answer = peerConnection.localDescription;
      console.log("getting");
    } else {
      const res = await fetch(`https://192.168.1.19:8001/${url}/postanswer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
      });
    }
  };

  peerConnection.setRemoteDescription(offer);
  answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
};

const joinCall = async () => {
  const res = await fetch(`https://192.168.1.19:8001/${url}/getanswer`);
  let answer = await res.json();
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};
const endCall = async () => {
  peerConnection = getPeerConnection();
  peerConnection.close();
  location.reload();
  console.log("refreshed");
};
createBtn.addEventListener("click", createOffer);
joinBtn.addEventListener("click", createAnswer);
endBtn.addEventListener("click", endCall);

///////////////////////////////////////////////////////////////////

const box = document.getElementById("messages");
const inputBox = document.getElementById("messageInput");
const message = document.getElementById("messageBox");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", addMessage);

message.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("sendButton").click();
  }
});

const addIncomingMessage = (message) => {
  const newMessage = document.createElement("p");
  newMessage.classList.add("message", "remote");
  const newMessageText = document.createTextNode(message);
  newMessage.appendChild(newMessageText);
  box.insertBefore(newMessage, inputBox);
};

function addMessage() {
  const newMessage = document.createElement("p");
  newMessage.classList.add("message", "self");
  const newMessageText = document.createTextNode(message.value);
  newMessage.appendChild(newMessageText);
  box.insertBefore(newMessage, inputBox);
  peerConnection = getPeerConnection();
  if (peerConnection?.localDescription?.type === "offer") {
    dataChannel = getDataChannel();
    dataChannel.send(message.value);
  } else {
    peerConnection.dc.send(message.value);
  }
  message.value = "";
}
