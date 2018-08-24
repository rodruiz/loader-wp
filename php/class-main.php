<?php
/**
 * Main class for the MG2 loader.
 */

namespace MG2_Loader;

class Main {

	/**
	 * Name used internally to identify this plugin.
	 *
	 * @access protected
	 * @var string $name
	 */
	protected $name;

	/**
	 * Settings handler.
	 *
	 * @access protected
	 * @var \MG2_Loader\Settings $settings
	 */
	protected $settings;

	/**
	 * Private singleton instance.
	 *
	 * @access protected
	 * @var Main $instance
	 */
	protected static $instance;

	/**
	 * Static accessor.
	 * @return Main singleton
	 */
	public static function instance() {
		if ( ! is_object( static::$instance ) ) {
			static::$instance = new Main;
			static::$instance->setup();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @access protected
	 */
	protected function __construct() {}

	/**
	 * Initialize properties and register hooks.
	 *
	 * @access protected
	 */
	protected function setup() {
		$this->name = 'mg2_loader';

		/**
		 * Setting up Flittz layout fields for reuse.
		 */
		$fz_layout_fields = array(
			'type' => array(
				'label' => __( 'Type', 'mg2_loader' ),
				'type' => 'select',
				'options' => array(
					'modal' => __( 'Modal', 'mg2_loader' ),
					'panel' => __( 'Panel', 'mg2_loader' ),
					'inline' => __( 'Inline', 'mg2_loader' ),
				),
			),
			'options' => array(
				'label' => __( 'Options', 'mg2_loader' ),
				'type' => 'group',
				'fields' => array(
					'addMethod' => array(
						'label' => __( 'Add Method', 'mg2_loader' ),
						'type' => 'select',
						'options' => array(
							'append' => __( 'Append', 'mg2_loader' ),
							'prepend' => __( 'Prepend', 'mg2_loader' ),
							'before' => __( 'Before', 'mg2_loader' ),
							'after' => __( 'After', 'mg2_loader' ),
						),
					),
					'container' => array(
						'label' => __( 'Container', 'mg2_loader' ),
					),
				),
			),
		);

		/**
		 * Set up the settings page.
		 */
		$this->settings = new Settings(
			$this->name,
			__( 'MG2 Loader', 'mg2_loader' ),
			array(
				'loader' => array(
					'name' => __( 'Loader Settings', 'mg2_loader' ),
					'fields' => array(
						'environment' => array(
							'label' => __( 'Environment', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'prod' => __( 'Production', 'mg2_loader' ),
								'stage' => __( 'Staging', 'mg2_loader' ),
							),
						),
						'version' => array(
							'label' => __( 'Version', 'mg2_loader' ),
							'required' => true,
						),
						'loadAttempts' => array(
							'label' => __( 'Load Attempts', 'mg2_loader' ),
							'type' => 'number',
							'min' => 0,
						),
						'blockAttempts' => array(
							'label' => __( 'Block Attempts', 'mg2_loader' ),
							'type' => 'number',
							'min' => 0,
						),
						'xCode' => array(
							'label' => __( 'X Code', 'mg2_loader' ),
						),
						'randomURLChoosing' => array(
							'label' => __( 'Enable Random URL Choosing', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'Disabled', 'mg2_loader' ),
								'true' => __( 'Enabled', 'mg2_loader' ),
							),
						),
						'plugins' => array(
							'label' => __( 'Plugins', 'mg2_loader' ),
							'type' => 'checkboxes',
							'style' => 'display: block',
							'options' => array(
								'NXT' => __( 'Connext', 'mg2_loader' ),
								'FP' => __( 'Fingerprint', 'mg2_loader' ),
								'FZ' => __( 'Flittz', 'mg2_loader' ),
								'DL' => __( 'G2 Insights', 'mg2_loader' ),
							),
						),
					),
				),
				'NXT' => array(
					'name' => __( 'Connext Settings', 'mg2_loader' ),
					'fields' => array(
						'required' => array(
							'label' => __( 'Required', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'version' => array(
							'label' => __( 'Version', 'mg2_loader' ),
							'required' => true,
						),
						'environment' => array(
							'label' => __( 'Environment', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'prod' => __( 'Production', 'mg2_loader' ),
								'stage' => __( 'Staging', 'mg2_loader' ),
							),
						),
						'siteCode' => array(
							'label' => __( 'Site Code', 'mg2_loader' ),
							'required' => true,
						),
						'configCode' => array(
							'label' => __( 'Config Code', 'mg2_loader' ),
							'required' => true,
						),
						'clientCode' => array(
							'label' => __( 'Client Code', 'mg2_loader' ),
							'required' => true,
						),
						'debug' => array(
							'label' => __( 'Debug', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'silentmode' => array(
							'label' => __( 'Silent Mode', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'attr' => array(
							'label' => __( 'Attr', 'mg2_loader' ),
						),
						'settingsKey' => array(
							'label' => __( 'Settings Key', 'mg2_loader' ),
						),
					),
				),
				'FP' => array(
					'name' => __( 'Fingerprint Settings', 'mg2_loader' ),
					'fields' => array(
						'required' => array(
							'label' => __( 'Required', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'version' => array(
							'label' => __( 'Version', 'mg2_loader' ),
							'required' => true,
						),
						'environment' => array(
							'label' => __( 'Environment', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'prod' => __( 'Production', 'mg2_loader' ),
								'stage' => __( 'Staging', 'mg2_loader' ),
							),
						),
					),
				),
				'FZ' => array(
					'name' => __( 'Flittz Settings', 'mg2_loader' ),
					'fields' => array(
						'required' => array(
							'label' => __( 'Required', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'version' => array(
							'label' => __( 'Version', 'mg2_loader' ),
							'required' => true,
						),
						'environment' => array(
							'label' => __( 'Environment', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'prod' => __( 'Production', 'mg2_loader' ),
								'stage' => __( 'Staging', 'mg2_loader' ),
							),
						),
						'logLevel' => array(
							'label' => __( 'Log Level', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'LOG' => __( 'LOG', 'mg2_loader' ),
								'INFO' => __( 'INFO', 'mg2_loader' ),
								'WARN' => __( 'WARN', 'mg2_loader' ),
								'DEBUG' => __( 'DEBUG', 'mg2_loader' ),
								'FATAL' => __( 'FATAL', 'mg2_loader' ),
							),
						),
						'silentmode' => array(
							'label' => __( 'Silent Mode', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'paywall' => array(
							'label' => __( 'Paywall', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'None' => __( 'None', 'mg2_loader' ),
								'Connext' => __( 'Connext', 'mg2_loader' ),
							),
						),
						'content' => array(
							'label' => __( 'Content', 'mg2_loader' ),
							'type' => 'group',
							'fields' => array(
								'title' => array(
									'label' => __( 'Title', 'mg2_loader' ),
								),
								'category' => array(
									'label' => __( 'Category', 'mg2_loader' ),
								),
							),
						),
						'siteId' => array(
							'label' => __( 'Site ID', 'mg2_loader' ),
							'type' => 'number',
							'min' => 1,
							'required' => true,
						),
						'siteCode' => array(
							'label' => __( 'Site Code', 'mg2_loader' ),
							'required' => true,
						),
						'cost' => array(
							'label' => __( 'Cost', 'mg2_loader' ),
							'type' => 'group',
							'fields' => array(
								'display' => array(
									'label' => __( 'Display', 'mg2_loader' ),
								),
								'token' => array(
									'label' => __( 'Token', 'mg2_loader' ),
								),
							),
						),
						'layouts' => array(
							'label' => __( 'Layouts', 'mg2_loader' ),
							'type' => 'group',
							'fields' => array(
								'notPurchased' => array(
									'label' => __( 'Not Purchased', 'mg2_loader' ),
									'type' => 'group',
									'fields' => $fz_layout_fields,
								),
								'hasPurchased' => array(
									'label' => __( 'Has Purchased', 'mg2_loader' ),
									'type' => 'group',
									'fields' => $fz_layout_fields,
								),
								'loggedOut' => array(
									'label' => __( 'Logged Out', 'mg2_loader' ),
									'type' => 'group',
									'fields' => $fz_layout_fields,
								),
								'auth' => array(
									'label' => __( 'Auth', 'mg2_loader' ),
									'type' => 'group',
									'fields' => $fz_layout_fields,
								),
							),
						),
					),
				),
				'DL' => array(
					'name' => __( 'G2 Insights Settings', 'mg2_loader' ),
					'fields' => array(
						'required' => array(
							'label' => __( 'Required', 'mg2_loader' ),
							'type' => 'boolean',
							'options' => array(
								'false' => __( 'False', 'mg2_loader' ),
								'true' => __( 'True', 'mg2_loader' ),
							),
						),
						'version' => array(
							'label' => __( 'Version', 'mg2_loader' ),
							'required' => true,
						),
						'environment' => array(
							'label' => __( 'Environment', 'mg2_loader' ),
							'type' => 'select',
							'options' => array(
								'prod' => __( 'Production', 'mg2_loader' ),
								'stage' => __( 'Staging', 'mg2_loader' ),
							),
						),
						'tagManager' => array(
							'label' => __( 'Tag Manager', 'mg2_loader' ),
							'required' => true,
						),
						'collectors' => array(
							'label' => __( 'Collectors', 'mg2_loader' ),
							'description' => __( 'Comma-separated list of collectors.' ),
							'required' => true,
						),
					),
				),
			)
		);

		/**
		 * Enqueue scripts for settings page UI.
		 */
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );

		/**
		 * Enqueue scripts for the loader.
		 */
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Standardize settings to pass to the loader initialization.
	 */
	public function get_settings() {
		$input = $this->settings->get();

		$output['settings'] = $input['loader'];
		$output['settings']['plugins'] = array();

		foreach( $input['loader']['plugins'] as $plugin ) {
			$data = array(
				'name' => $plugin,
				'required' => $input[ $plugin ]['required'],
				'initOptions' => $input[ $plugin ],
			);

			unset( $data['initOptions']['required'] );

			// Handle edge cases.
			if ( 'DL' === $plugin ) {
				if ( ! empty( $data['initOptions']['collectors'] ) ) {
					$data['initOptions']['collectors'] = array_values( array_filter(
						array_map( 'trim' , explode( ',', $data['initOptions']['collectors'] ) )
					) );
				}
			}

			$output['settings']['plugins'][] = $data;
		}

		return $output;
	}

	/**
	 * Enqueue scripts for the loader.
	 */
	public function enqueue_scripts() {
		if ( ! is_admin() ) {
			wp_enqueue_script( "{$this->name}_loader", ASSET_URI . 'loader.min.js', array(), VERSION, false );
			wp_localize_script( "{$this->name}_loader", 'MG2', $this->get_settings() );

			$inline = $str = <<<'EOD'
(function( MG2, MG2Loader ) {
	if ( 'undefined' !== typeof MG2 && 'undefined' !== typeof MG2Loader) {
		MG2Loader.init( MG2.settings );
	}
})( MG2, MG2Loader );
EOD;

			wp_add_inline_script( "{$this->name}_loader", $inline );
		}
	}

	/**
	 * Enqueue scripts for settings page UI.
	 * @param string $hook
	 */
	public function admin_enqueue_scripts( $hook ) {
		if ( "settings_page_{$this->name}" == $hook ) {
			wp_enqueue_script( "{$this->name}_admin", ASSET_URI . 'admin.min.js', array(), VERSION, false );
		}
	}
}
