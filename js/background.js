/**
 * Listens for the app launching then creates the window.
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('../app.html',
    {
      id: "mainwin",
      state: "maximized"
    });
});
