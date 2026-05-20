<?php declare( strict_types = 1 ); ?>
<?php
/**
 * Slab functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Slab
 * @since Slab 1.0
 */


if ( ! function_exists( 'slab_support' ) ) :

	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * @since Slab 1.0
	 *
	 * @return void
	 */
	function slab_support() {

		// Enqueue editor styles.
		add_editor_style( 'style.css' );

		// Make theme available for translation.
		load_theme_textdomain( 'slab' );
	}

endif;

add_action( 'after_setup_theme', 'slab_support' );

if ( ! function_exists( 'slab_styles' ) ) :

	/**
	 * Enqueue styles.
	 *
	 * @since Slab 1.0
	 *
	 * @return void
	 */
	function slab_styles() {

		// Register theme stylesheet.
		wp_register_style(
			'block_canvas-style',
			get_stylesheet_directory_uri() . '/style.css',
			array(),
			wp_get_theme()->get( 'Version' )
		);

		// Enqueue theme stylesheet.
		wp_enqueue_style( 'block_canvas-style' );

	}

endif;

add_action( 'wp_enqueue_scripts', 'slab_styles' );
