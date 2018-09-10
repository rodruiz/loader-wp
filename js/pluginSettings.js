/**
 * Handling for conditional display of settings sections for each plugin.
 */

/**
 * Track init state for event bindings.
 *
 * @var boolean initialized
 */
let initialized = false;

/**
 * Get the nodelist of plugin settings options checkboxes.
 *
 * @return NodeList
 */
function getOptions() {
  return document.getElementsByName('mg2_loader_options[loader][plugins][]');
}

/**
 * Initialize event bindings.
 */
function initialize() {
  const options = getOptions();

  if (options.length) {
    Array.prototype.forEach.call(options, (checkbox) => {
      checkbox.addEventListener('change', change);

      // Trigger an update based on initial state.
      checkbox.dispatchEvent(new Event('change'));
    });

    initialized = true;
  }
};

/**
 * Clean up event bindings.
 */
function cleanup() {
  Array.prototype.forEach.call(getOptions(), (checkbox) => {
    checkbox.removeEventListener('change', change);
  });

  initialized = false;
}

/**
 * Handle update of plugin settings states.
 */
function change() {
  const rows = document.getElementsByClassName('settings-' + this.value);

  Array.prototype.forEach.call(rows, (row) => {
    // Temporarily disable "required" for hidden settings.
    Array.prototype.forEach.call(row.getElementsByTagName('input'), (input) => {
      if (input.required || input.requiredIfActive) {
        input.requiredIfActive = true;
      }

      if (this.checked) {
        input.required = input.requiredIfActive;
      } else {
        input.required = false;
      }
    });

    // Show or hide settings rows based on plugin state.
    row.style.display = this.checked ? null : 'none';
  });

  // Show a message if the plugin is currently disabled.
  showMessage(rows[0].parentElement, !this.checked);
};

/**
 * Show a message indicating that a section can be displayed by activated the
 * plugin in the loader settings section.
 *
 * @param HTMLTableElement container
 * @param boolean show
 */
function showMessage(container, show) {
  let existing = container.querySelector('.mg2-settings-message');

  if (null !== existing) {
    container.removeChild(existing);
    existing = null;
  }

  if (show) {
    const td = document.createElement('td');
    td.innerText = 'This plugin is currently disabled in the Loader settings.';

    const message = document.createElement('tr');
    message.appendChild(td);
    message.colspan = 2;
    message.className = 'mg2-settings-message';

    container.appendChild(message);
  }
}

if (!initialized) {
  initialize();
}

export default initialize;

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => { cleanup(); });
}
