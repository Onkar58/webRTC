const selfContainer = document.getElementById("selfVideoContainer");
const remoteContainer = document.getElementById("remoteVideoContainer");
let windowElement = document.getElementsByClassName("window")[0];
let currentFull = document.getElementsByClassName("full")[0];
const cross = document.getElementById("cross");
const toggleSize = (event) => {
  if (currentFull === event.currentTarget) {
    return;
  }
  selfContainer.classList.toggle("full");
  selfContainer.classList.toggle("window");
  remoteContainer.classList.toggle("window");
  remoteContainer.classList.toggle("full");
  currentFull = document.getElementsByClassName("full")[0];
};

const toggleChat = () => {
  box.classList.toggle("hide");
};

selfContainer.addEventListener("click", toggleSize);
remoteContainer.addEventListener("click", toggleSize);
chatBtn.addEventListener("click", toggleChat);
cross.addEventListener("click", toggleChat);
