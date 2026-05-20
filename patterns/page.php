<?php
/**
 * Title: page
 * Slug: slab/page
 * Inserter: no
 */
?>
<!-- wp:columns {"metadata":{"categories":["hidden"]},"align":"full","style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"margin":{"top":"0rem","bottom":"0rem"},"blockGap":{"top":"0rem","left":"0rem"}}}} -->
<div class="wp-block-columns alignfull" style="margin-top:0rem;margin-bottom:0rem;padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem"><!-- wp:column {"verticalAlignment":"stretch","width":"40%","lock":{"move":false,"remove":false},"metadata":{"name":"40"},"style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"blockGap":"0px"}}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem;flex-basis:40%"><!-- wp:group {"metadata":{"name":"Portrait Sticky Container"},"style":{"position":{"type":"sticky","top":"0px"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:cover {"url":"<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/marker-portrait-image-683x1024.jpg","dimRatio":20,"overlayColor":"contrast","isUserOverlayColor":true,"minHeight":97,"minHeightUnit":"vh","contentPosition":"top center","sizeSlug":"large","align":"full","style":{"spacing":{"margin":{"top":"0","bottom":"0"},"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}},"border":{"width":"20px"},"elements":{"link":{"color":{"text":"var:preset|color|base"}}}},"textColor":"base","borderColor":"base","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull has-custom-content-position is-position-top-center has-border-color has-base-border-color has-base-color has-text-color has-link-color" style="border-width:20px;margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50);min-height:97vh"><img class="wp-block-cover__image-background  size-large" alt="" src="<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/marker-portrait-image-683x1024.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-20 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"metadata":{"name":"Cover Fullheight Stack"},"align":"wide","style":{"dimensions":{"minHeight":"85vh"}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between","justifyContent":"stretch"}} -->
<div class="wp-block-group alignwide" style="min-height:85vh"><!-- wp:template-part {"slug":"header","area":"header"} /--></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"stretch","width":"15%","metadata":{"name":"15"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:15%"><!-- wp:group {"metadata":{"name":"Content Block"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"constrained","justifyContent":"left"}} -->
<div class="wp-block-group" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:navigation {"overlayMenu":"never","icon":"menu","layout":{"type":"flex","justifyContent":"left","orientation":"vertical"}} /-->

<!-- wp:post-title {"level":1,"style":{"layout":{"selfStretch":"fill","flexSize":null}},"fontSize":"xx-large"} /-->

<!-- wp:post-date {"format":"M j—Y","isLink":true} /--></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"stretch","width":"45%","metadata":{"name":"45"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:45%"><!-- wp:group {"tagName":"main","metadata":{"name":"Content Block"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"constrained","justifyContent":"center"}} -->
<main class="wp-block-group alignfull" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:post-content {"lock":{"move":false,"remove":false},"layout":{"type":"constrained","justifyContent":"center"}} /-->

<!-- wp:template-part {"slug":"footer","area":"footer"} /--></main>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->