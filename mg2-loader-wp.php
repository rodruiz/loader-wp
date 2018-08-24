<?php
/**
 * Plugin Name: MG2 Loader for WordPress
 * Version: 1.0
 * Author: Alley Interactive
 * Description: Allows configuration and use of the MG2 loader for WordPress sites.
 */
/*  This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

namespace MG2_Loader;

define( __NAMESPACE__ . '\VERSION', '1.0.0' );

define( __NAMESPACE__ . '\PATH', __DIR__ );

function is_dev_env() {
	return defined( 'WP_ENV' ) && 'production' !== WP_ENV && ( ! defined( 'WPCOM_IS_VIP_ENV' ) || false === WPCOM_IS_VIP_ENV );
}

// If not in a production environment, check for a running webpack dev server and load assets from there if available.
if ( is_dev_env() ) {
	// Define this constant if your webpack dev server is running at a different host.
	if ( ! defined( 'WEBPACK_DEV_SERVER' ) ) {
		define( 'WEBPACK_DEV_SERVER', 'https://127.0.0.1:8080/' );
	}

	// Check for a running webpack dev server.
	add_filter( 'https_ssl_verify', '__return_false' );
	if ( function_exists( 'vip_safe_wp_remote_get' ) ) {
		$test = vip_safe_wp_remote_get( \WEBPACK_DEV_SERVER );
	} else {
		$test = wp_remote_get( \WEBPACK_DEV_SERVER );
	}
	remove_filter( 'https_ssl_verify', '__return_false' );

	if ( ! is_wp_error( $test ) ) {
		define( __NAMESPACE__ . '\ASSET_URI', \WEBPACK_DEV_SERVER );
	}
}

// Otherwise, load assets from the standard compiled asset path.
if ( ! defined( __NAMESPACE__ . '\ASSET_URI' ) ) {
	define( __NAMESPACE__ . '\ASSET_URI', plugin_dir_url( __FILE__ ) . 'static/' );
}

require_once( PATH . '/php/autoload.php' );

add_action( 'after_setup_theme', [ __NAMESPACE__ . '\Main', 'instance' ], 20 );
