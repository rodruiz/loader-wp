<?php
/**
 * Main class for the settings handler.
 */

namespace MG2_Loader;

class Settings {

	/**
	 * Name used internally to identify this settings instance.
	 *
	 * @access protected
	 * @var string $name
	 */
	protected $name;

	/**
	 * Label shown in the UI to identify elements of this plugin.
	 *
	 * @access protected
	 * @var string $name
	 */
	protected $label;

	/**
	 * @var array Associative array of settings fields.
	 */
	protected $sections;

	/**
	 * Configuration loaded from options.
	 *
	 * @access protected
	 * @var string $option_data
	 */
	protected $option_data;

	/**
	 * Constructor.
	 *
	 * @access public
	 */
	public function __construct( $name, $label, $sections ) {
		$this->name = $name;
		$this->label = $label;
		$this->sections = $sections;

		$this->options_key = "{$this->name}_options";

		/**
		 * Register the option page link.
		 */
		add_action( 'admin_menu', array( $this, 'add_options_page' ) );

		/**
		 * Register the settings page.
		 */
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Set option data.
	 *
	 * @param array $data
	 */
	public function set( $data ) {
		$this->option_data = wp_parse_args(
			// Remove empty options to replace with defaults.
			array_filter( $data ),
			apply_filters(  "{$this->options_key}_default", array() )
		);
	}

	/**
	 * Get option data.
	 *
	 * @return array
	 */
	public function get() {
		if ( ! isset( $this->option_data ) ) {
			$this->set( get_option( $this->options_key, array() ) );
		}

		return $this->option_data;
	}

	/**
	 * Add the settings page.
	 */
	public function add_options_page() {
		add_options_page(
			$this->label,
			$this->label,
			'manage_options',
			$this->name,
			array( $this, 'create_admin_page' )
		);
	}

	/**
	 * Display the settings page.
	 */
	public function create_admin_page() {
		?>
		<div class="wrap">
			<?php screen_icon(); ?>
			<h2><?php echo esc_html( $this->label ); ?></h2>
			<form method="post" action="options.php">
				<?php
				settings_fields( "{$this->name}-options-group" );
				do_settings_sections( "{$this->name}-section" );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Register the settings sections and fields.
	 */
	public function register_settings() {
		register_setting(
			"{$this->name}-options-group",
			$this->options_key,
			array( $this, 'sanitize' )
		);

		foreach ( $this->sections as $id => $section ) {
			add_settings_section(
				"{$this->name}-section-{$id}",
				$section['name'],
				array( $this, 'show_section' ),
				"{$this->name}-section"
			);

			foreach ( $section['fields'] as $name => $field ) {
				add_settings_field(
					$name,
					$field['label'],
					array( $this, 'show_settings_field' ),
					"{$this->name}-section",
					"{$this->name}-section-{$id}",
					array(
						'section_id' => $id,
						'name' => $name,
						'field' => $field,
						'label_for' => sanitize_title( "{$this->options_key}[{$id}][{$name}]" ),
						'class' => "settings-{$id}",
					)
				);
			}
		}
	}

	/**
	 * Print the section text.
	 */
	public function show_section( $args ) {
		if ( ! empty( $args['id'] ) ) {
			$id = str_replace( "{$this->name}-section-", '', $args['id'] );

			if ( ! empty( $this->sections[ $id ]['description'] ) ) {
				echo esc_html( $this->sections[ $id ]['description'] );
			}
		}
	}

	/**
	 * Output the form field for the requested field
	 * @param string $field
	 */
	public function show_settings_field( $args ) {
		$section_id = $args['section_id'];
		$name = $args['name'];
		$field = $args['field'];

		if ( empty( $name ) ) {
			return;
		}

		$option_data = $this->get();
		$param_base = "{$this->options_key}[{$section_id}]";
		$data = isset( $option_data[ $section_id ] ) ? $option_data[ $section_id ] : array();

		$this->show_field( $param_base, $data, $name, $field );
	}

	/**
	 * Display a field.
	 *
	 * @param string $param_base
	 * @param mixed $data
	 * @param string $name
	 * @param array $field
	 */
	public function show_field( $param_base, $data, $name, $field ) {
		$param_name = "{$param_base}[{$name}]";
		$value = isset( $data[ $name ] ) ? $data[ $name ] : '';

		$field = wp_parse_args( $field, array(
			'type' => 'text',
			'style' => 'width: 100%',
		) );

		if ( 'select' === $field['type'] || 'boolean' === $field['type'] ) {
			$this->show_select( $field, $param_name, $value );
		} elseif ( 'checkboxes' === $field['type'] ) {
			$this->show_checkboxes( $field, $param_name, $value );
		} elseif ( 'group' === $field['type'] ) {
			$this->show_group( $field, $param_name, $value );
		} else {
			$this->show_input( $field, $param_name, $value );
		}
	}

	/**
	 * Display a group of fields.
	 *
	 * @param array $field
	 * @param string $name
	 * @param string $value
	 */
	public function show_group( $field, $name, $value ) {
		foreach ( $field['fields'] as $child_name => $child_field ) {
			?>
			<dl style="<?php echo esc_attr( $field['style'] ); ?>">
				<dt>
					<label for="<?php echo sanitize_title( "{$name}[{$child_name}]" ); ?>">
						<?php echo esc_html( $child_field['label'] ); ?>
					</label>
				</dt>
				<dd>
					<?php
					$this->show_field(
						$name,
						$value,
						$child_name,
						$child_field
					);
					?>
				</dd>
			</dl>
			<?php
		}
	}

	/**
	 * Display a basic input field.
	 *
	 * @param array $field
	 * @param string $name
	 * @param string $value
	 */
	public function show_input( $field, $name, $value ) {
		?>
		<input type="<?php echo esc_attr( $field['type'] ); ?>"
			style="<?php echo esc_attr( $field['style'] ); ?>"
			id="<?php echo sanitize_title( $name ); ?>"
			name="<?php echo esc_attr( $name ); ?>"
			value="<?php echo esc_attr( $value ); ?>"
			<?php if ( isset( $field['min'] ) ): ?>
				min="<?php echo intval( $field['min'] ); ?>"
			<?php endif; ?>
			<?php if ( ! empty( $field['required'] ) ): ?>required<?php endif; ?> />
		<?php
	}

	/**
	 * Display a select field.
	 *
	 * @param array $field
	 * @param string $name
	 * @param string $value
	 */
	public function show_select( $field, $name, $value ) {
		if ( 'boolean' === $field['type'] ) {
			$value = $value ? 'true' : 'false';
		}
		?>
		<select style="<?php echo esc_attr( $field['style'] ); ?>"
			id="<?php echo sanitize_title( $name ); ?>"
			name="<?php echo esc_attr( $name ); ?>">
			<?php foreach ( $field['options'] as $option => $label ) : ?>
				<option value="<?php echo esc_attr( $option ); ?>"
					<?php if ( $value === $option ) : ?>selected<?php endif; ?>>
					<?php echo esc_html( $label ); ?>
				</option>
			<?php endforeach; ?>
		</select>
		<?php
	}

	/**
	 * Display a set of checkboxes.
	 *
	 * @param array $field
	 * @param string $name
	 * @param string $value
	 */
	public function show_checkboxes( $field, $name, $value ) {
		foreach ( $field['options'] as $option => $label ) :
		?>
			<label style="<?php echo esc_attr( $field['style'] ); ?>"
				for="<?php echo sanitize_title( $name . $option ); ?>"
				>
				<input type="checkbox"
					id="<?php echo sanitize_title( $name . $option ); ?>"
					name="<?php echo esc_attr( $name ); ?>[]"
					value="<?php echo esc_attr( $option ); ?>"
					<?php if ( in_array( $option, $value ) ) : ?>checked<?php endif; ?>
				/>
				<?php echo esc_html( $label ); ?>
			</label>
		<?php
		endforeach;
	}

	/**
	 * Sanitize an individual field.
	 *
	 * @param string $name
	 * @param array $field
	 * @param mixed $input
	 *
	 * @return mixed $output
	 */
	public function sanitize_field( $name, $field, $input ) {
		$output = null;

		if ( empty( $field['type'] ) ) {
			$field['type'] = 'text';
		}

		if ( 'number' === $field['type'] ) {
			$output = ( ! empty( $input ) || '0' === $input ) ? intval( $input ) : null;
		} elseif ( 'boolean' === $field['type'] ) {
			$output = 'true' === $input;
		} elseif ( 'checkboxes' === $field['type'] ) {
			$output = array_map( 'sanitize_text_field', $input );
		} elseif ( 'group' === $field['type'] ) {
			$output = array();

			foreach ( $field['fields'] as $child_name => $child_args ) {
				$output[ $child_name ] = $this->sanitize_field( $child_name, $child_args, $input[ $child_name ] );
			}
		} else {
			$output = sanitize_text_field( $input );
		}

		return $output;
	}

	/**
	 * Sanitize each setting field as needed.
	 *
	 * @param array $input Contains all settings fields as array keys
	 * @return array
	 */
	public function sanitize( $input ) {
		$output = array();

		foreach ( $this->sections as $id => $section ) {
			$output[ $id ] = array();

			foreach ( $section['fields'] as $name => $field ) {
				if ( isset( $input[ $id ][ $name ] ) ) {
					$output[ $id ][ $name ] = $this->sanitize_field( $name, $field, $input[ $id ][ $name ] );
				}
			}
		}

		return $output;
	}
}
