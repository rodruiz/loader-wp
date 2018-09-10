<?php
/**
 * This file contains the custom autoloader for the plugin which autoloads
 * classes named as per the WordPress Coding Standards.
 *
 * Any class sharing this namespace can be automatically loaded when used, if it
 * resides in the `php/` directory. If the class has any sub-namespaces, the
 * class must be within subdirectories of the same names (swapping underscores
 * for dashes and downcasing).
 *
 * @package MG2_Loader
 */

namespace MG2_Loader;

/**
 * Autoload classes.
 *
 * @param  string $cls Class name.
 */
function autoload( $cls ) {
	$cls = ltrim( $cls, '\\' );
	if ( strpos( $cls, __NAMESPACE__ . '\\' ) !== 0 ) {
		return;
	}

	// Outside of VIP, we need to allow drive letters because Windows hosting environments require it.
	$valid_paths = defined( 'WPCOM_IS_VIP_ENV' ) && true === WPCOM_IS_VIP_ENV ? [ 0 ] : [ 0, 2 ];

	$cls = strtolower( str_replace( [ __NAMESPACE__ . '\\', '_' ], [ '', '-' ], $cls ) );
	$dirs = explode( '\\', $cls );
	$cls = array_pop( $dirs );

	foreach ( [ 'class', 'trait' ] as $type ) {
		$filename = PATH . DIRECTORY_SEPARATOR . 'php'
			. rtrim(
				implode( DIRECTORY_SEPARATOR, $dirs ),
				DIRECTORY_SEPARATOR
			) . DIRECTORY_SEPARATOR . "{$type}-{$cls}.php";

		if (
			file_exists( $filename )
			&& in_array( validate_file( $filename ), $valid_paths, true )
		) {
			require_once( $filename );
		}
	}
}
spl_autoload_register( __NAMESPACE__ . '\autoload' );
