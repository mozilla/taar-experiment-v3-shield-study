document.addEventListener("click", (e) => {

  function handleResponse(message) {
    console.log(`Message from the privileged script: ${message.response}`);
    browser.storage.local.set({ sawPopup: true });
  }

  function handleError(error) {
    console.log(error);
  }

  function tellBackground(message) {
    const sending = browser.runtime.sendMessage(message);
    sending.then(handleResponse, handleError);
  }

  if (e.target.id === "browse-addons-button") {
    console.log("routing to about:addons...");
    tellBackground({ "clicked-disco-button": true });
  } else if (e.target.id === "close-button") {
    tellBackground({ "clicked-close-button": true });
  }

  // Ensure that the popup closes after button click
  window.close();

});
