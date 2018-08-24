import pluginSettings from './pluginSettings';

document.addEventListener('DOMContentLoaded', function() {
  pluginSettings();
});

if (module.hot) {
  module.hot.accept();
}
