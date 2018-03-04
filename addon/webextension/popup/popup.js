document.addEventListener("click", (e) => {

  function handleResponse(message) {
    console.log(`Message from the privileged script: ${message.response}`);
    browser.storage.local.set({ sawPopup: true });
  }

  function handleError(error) {
    console.log(error);
  }

  let message = null;

  if (e.target.id === "browse-addons-button") {
    console.log("routing to about:addons...");
    message = { "clicked-disco-button": true };
  } else if (e.target.id === "close-button") {
    message = { "clicked-close-button": true };
  }

  if (message) {
    const sending = browser.runtime.sendMessage(message);
    sending.then(handleResponse, handleError);
    // Ensure that the popup closes only after button click
    window.close();
  }

});
