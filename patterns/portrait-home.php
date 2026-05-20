<?php
/**
 * Title: portrait-home
 * Slug: slab/portrait-home
 * Inserter: no
 */
?>
<!-- wp:cover {"url":"<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/author-portrait-slab-theme.jpg","dimRatio":20,"overlayColor":"contrast","isUserOverlayColor":true,"minHeight":97,"minHeightUnit":"vh","contentPosition":"top center","sizeSlug":"large","align":"full","style":{"spacing":{"margin":{"top":"0","bottom":"0"}},"border":{"width":"20px"},"elements":{"link":{"color":{"text":"var:preset|color|tertiary"}},"heading":{"color":{"text":"var:preset|color|tertiary"}}}},"textColor":"tertiary","borderColor":"base","layout":{"type":"default"}} -->
<div class="wp-block-cover alignfull has-custom-content-position is-position-top-center has-border-color has-base-border-color has-tertiary-color has-text-color has-link-color" style="border-width:20px;margin-top:0;margin-bottom:0;min-height:97vh"><img class="wp-block-cover__image-background size-large" alt="" src="<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/author-portrait-slab-theme.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-20 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"metadata":{"name":"Cover Fullheight Stack"},"align":"wide","style":{"dimensions":{"minHeight":"85vh"}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"space-between","justifyContent":"stretch"}} -->
<div class="wp-block-group alignwide" style="min-height:85vh"><!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"metadata":{"name":"Headline Wrapper"},"style":{"layout":{"selfStretch":"fill","flexSize":null},"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch","verticalAlignment":"bottom","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:site-logo {"width":48,"style":{"color":[]}} /-->

<!-- wp:spacer {"metadata":{"name":"M"},"style":{"layout":{"selfStretch":"fixed","flexSize":"40px"}}} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading"><?php /* Translators: 1. is the start of a 'em' HTML element, 2. is the end of a 'em' HTML element */ 
echo sprintf( esc_html__( '%1$sSlab%2$s is a publication for those who seek depth in a world of fleeting trends. Through philosophy, history, and reflection, we explore the grand ideas that shape us, and the ones we leave behind.', 'slab' ), '<em>', '</em>' ); ?></h1>
<!-- /wp:heading --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->