// Register the DevTools panel
chrome.devtools.panels.create(
  'Stylepeek',
  '', // icon path
  'src/devtools/panel.html',
);
