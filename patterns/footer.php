<?php
/**
 * Title: footer
 * Slug: slab/footer
 * Inserter: no
 */
?>
<!-- wp:group {"metadata":{"name":"Footer Wrapper"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)"><!-- wp:paragraph {"align":"left","metadata":{"name":"Designed with WordPress"},"fontSize":"small"} -->
<p class="has-text-align-left has-small-font-size"><?php /* Translators: 1. is the start of a 'a' HTML element, 2. is the end of a 'a' HTML element */ 
echo sprintf( esc_html__( 'Designed with %1$sWordPress%2$s.', 'slab' ), '<a href="' . esc_url( 'https://wordpress.org' ) . '">', '</a>' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->
