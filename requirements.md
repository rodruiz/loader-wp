# Requirements

This document has the goal to explain all the inputs and sections needed to create a Wordpress VIP plugin to wrap MG2 Loader.

* Admin menu to host all the mg2 plugins. Name should be MG2.
	* Submenu with the name Loader and allow to open a new page to specify all the Loader initialization settings.
* Loader settings page
	* environment: Dropdown with the following options: “stage”, “prod”. Not required. Default value is “prod”.
	* version: Text input. Required.
	* loadAttempts: Input for integer value > 0. Not required. Default value is undefined.
	* blockAttempts: Input for integer value > 0. Not required. Default value is undefined.
	* xCode: Alphanumeric input. Not required. Default value is undefined.
	* randomURLChoosing: Dropdown with the following options: true, false. Not required Default value is false.
	* Plugins: section to include plugins that will be loader. There are 4 checkboxes for Connext, Flittz, G2 Insights and Fingerprint plugins. When plugin is checked, section with plugin’s settings id shown.

Plugin settings section:
* Connext (associated plugin name is “NXT”)
	* required: Dropdown with the following values: true, false. Default value is false.
	* initOptions: section that contains plugin’s initialization options:
		* environment: Dropdown with the following options: “stage”, “prod”. Not required. Default value is “prod”.
		* siteCode: Text input. Required.
		* configCode: Text input. Required.
		* clientCode: Text input. Required.
		* debug: Dropdown with the following options: true, false. Default value is false.
		* silentmode: Dropdown with the following options: true, false. Default value is false.
		* attr: TextInput. Not required.
		* settingsKey: Text input. Not required.

* Fingerprint (associated plugin name is “FP”)
	* required: Dropdown with the following values: true, false. Default value is false.
	* initOptions: section that contains plugin’s initialization options:
		* version: Text input. Required.
		* environment: Dropdown with the following options: “stage”, “prod”. Not required. Default value is “prod”.

	* Flittz (associated plugin name is “FZ”)
	* required: Dropdown with the following values: true, false. Default value is false.
		* initOptions: section that contains plugin’s initialization options:
		* version: Text input. Required.
		* environment: Dropdown with the following options: “stage”, “prod”. Not required. Default value is “prod”.
		* Log level: Dropdown with the following options 'LOG','INFO', 'WARN', 'DEBUG', 'FATAL'
		* Silent mode: Switch or checkbox for True, False value.
		* Paywall: Dropdown with following options 'None', 'Connext'
		* Content: Here we want to have a section that group the children settings.
			* Title: Textbox to write a Jquery selector for an article title text. Ex: $('.post_title').html(),
			* Category: Textbox to write a jquery selector for an article category text. Ex: $('.detail.category a').html()
		* Site Id: We need to allow to input an integer value. Bigger than 0.
		* SiteCode: Input value that define the code. Ex: mynewskey
		* Cost: Here we want to have a section that group the children settings
			* Display: textbox to write the cost for an article. This is only to display to the user . Ex: '0.50'
			* Token: Textbox to write the token that has the real cost for the article. This is a large input value. The value will be provided as a setup from MG2.
		* Layouts: Here we want to have a section that group the children settings. There are four subsections. NotPurchased, HasPurchased, Loggedout, Auth. Each subsection will have the same properties
			* options.AddMethod: Dropdown with the following options 'append', 'prepend','before','after'
			* options.container: input text. Ex div.text, body
			* type: Dropdown with the following options 'modal', 'panel', 'inline'
		* Save: The json output should be stored as it is in the plugin settings. Later will be used in code to initialize the plugin.

	* G2 Insights (associated plugin name is “DL”)
	* required: Dropdown with the following values: true, false. Default value is false.
	* initOptions: section that contains plugin’s initialization options:
		* version: Text input. Required.
		* environment: Dropdown with the following options: “stage”, “prod”. ”. Not required. Default value is “prod”.
		* tagManager: Text input. Requried.
		* collectors: Text input. Required. Input values are coma-separated.

```
Loader initialization example:
MG2Loader.init({
	environment: 'prod',
	loadAttempts: 2,
	blockAttempts: undefined,
	randomURLChoosing: false,
	xCode: 'Code',
	plugins: [
		{
			name: 'FP',
			required: false,
			initOptions: {
				version: '1.0',
				environment: 'prod'
			}
		},
		{
			name: 'NXT',
			required: true
			initOptions: {
				environment: 'prod',
				clientCode: 'MNG',
				siteCode: 'MNG',
				configCode: 'CONFIG_CODE',
				settingsKey: 'SK,SK',
				attr: 'Attr'
				debug: false,
				silentmode: true
			}
		},
		{
			name: 'FZ',
			required: true
			initOptions: {
				version: 'MNG',
				environment: 'prod',
				siteCode: 'MNG',
				paywall: 'Connext'
				logLevel: 'INFO'
				content: {
					title: $('.title-post h1').html(),
					type: 'url'
				},
				layouts: {
					notPurchased: {
						type: 'modal',
						options: {}
					},
					hasPurchased: {
						type: 'panel',
						options: {
							container: 'body',
							addMethod: 'append'
						}
					},
					loggedOut: {
						type: 'inline',
						options: {
							container: '.flittz-container',
							addMethod: 'append'
						}
					},
					auth: {
						type: 'modal',
						options: {}
					}
				}
			}
		},
		name: 'DL',
		initOptions: {
			version: '1.15',
			environment: 'prod',
			collectors: ["connext"],
			tagManager: "GTM"
		}
	]
});
```
