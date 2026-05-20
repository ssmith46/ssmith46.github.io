<?php
/**
 * Title: 404
 * Slug: slab/404
 * Inserter: no
 */
?>
<!-- wp:columns {"metadata":{"categories":["hidden"]},"align":"full","style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"margin":{"top":"0rem","bottom":"0rem"},"blockGap":{"top":"0rem","left":"0rem"}}}} -->
<div class="wp-block-columns alignfull" style="margin-top:0rem;margin-bottom:0rem;padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem"><!-- wp:column {"verticalAlignment":"stretch","width":"40%","lock":{"move":false,"remove":false},"metadata":{"name":"40"},"style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"blockGap":"0px"}}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem;flex-basis:40%"><!-- wp:group {"metadata":{"name":"Portrait Sticky Container"},"style":{"position":{"type":"sticky","top":"0px"}},"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:template-part {"slug":"portrait","area":"uncategorized"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"stretch","width":"15%","metadata":{"name":"15"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:15%"><!-- wp:group {"metadata":{"name":"Central Container"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|20","right":"var:preset|spacing|20"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
<div class="wp-block-group" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--20)"><!-- wp:group {"metadata":{"name":"Title"},"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
<div class="wp-block-group"><!-- wp:heading {"level":1,"metadata":{"name":"404"},"style":{"elements":{"link":{"color":{"text":"var:preset|color|secondary"}}}},"textColor":"secondary","fontSize":"xx-large"} -->
<h1 class="wp-block-heading has-secondary-color has-text-color has-link-color has-xx-large-font-size"><?php esc_html_e('404', 'slab');?></h1>
<!-- /wp:heading -->

<!-- wp:heading {"textAlign":"left","level":1,"style":{"layout":{"selfStretch":"fill","flexSize":null}},"fontSize":"xx-large"} -->
<h1 class="wp-block-heading has-text-align-left has-xx-large-font-size"><?php /* Translators: 1. is a 'br' HTML element */ 
echo sprintf( esc_html__( 'Page%1$sNot Found.', 'slab' ), '<br>' ); ?></h1>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"0px","metadata":{"name":"XS"},"style":{"layout":{"flexSize":"clamp(0.5rem, 1vw, 1rem)","selfStretch":"fixed"}}} -->
<div style="height:0px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"stretch","width":"45%","metadata":{"name":"45"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:45%"><!-- wp:group {"tagName":"main","metadata":{"name":"Content Block"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|60","right":"var:preset|spacing|60"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"constrained","justifyContent":"center"}} -->
<main class="wp-block-group alignfull" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--60)"><!-- wp:group {"metadata":{"name":"Seacrh wrapper"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left"><?php /* Translators: 1. is a 'br' HTML element */ 
echo sprintf( esc_html__( 'It looks like nothing was found at this location.%1$sMaybe try a search?', 'slab' ), '<br>' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:search {"label":"","showLabel":false,"buttonText":"","buttonPosition":"button-inside","buttonUseIcon":true} /--></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"var:preset|spacing|40","metadata":{"name":"XS"}} -->
<div style="height:var(--wp--preset--spacing--40)" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /--></main>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->