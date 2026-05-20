<?php
/**
 * Title: header
 * Slug: slab/header
 * Inserter: no
 */
?>
<!-- wp:group {"metadata":{"name":"Header Wrapper"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"0"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:0"><!-- wp:columns {"verticalAlignment":"center","align":"wide"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"25%","metadata":{"name":"25"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20"}},"border":{"bottom":{"width":"1px","style":"dotted"},"top":[],"right":[],"left":[]}}} -->
<div class="wp-block-column is-vertically-aligned-center" style="border-bottom-style:dotted;border-bottom-width:1px;padding-top:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--20);flex-basis:25%"><!-- wp:site-title {"level":0,"textAlign":"left"} /--></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"50%","metadata":{"name":"50"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20"}},"border":{"bottom":{"width":"1px","style":"dotted"},"top":[],"right":[],"left":[]}}} -->
<div class="wp-block-column is-vertically-aligned-center" style="border-bottom-style:dotted;border-bottom-width:1px;padding-top:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--20);flex-basis:50%"><!-- wp:navigation {"overlayMenu":"never","icon":"menu","layout":{"type":"flex","justifyContent":"left","orientation":"horizontal"}} /--></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"25%","metadata":{"name":"25"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20"}},"border":{"bottom":{"width":"1px","style":"dotted"},"top":[],"right":[],"left":[]}}} -->
<div class="wp-block-column is-vertically-aligned-center" style="border-bottom-style:dotted;border-bottom-width:1px;padding-top:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--20);flex-basis:25%"><!-- wp:group {"metadata":{"name":"Contact Info"},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"metadata":{"name":"Handle"},"style":{"typography":{"textTransform":"uppercase","lineHeight":"1"}},"fontSize":"small"} -->
<p class="has-small-font-size" style="line-height:1;text-transform:uppercase"><?php esc_html_e('@Obsrvr', 'slab');?></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"metadata":{"name":"Mail"},"style":{"typography":{"textTransform":"uppercase","lineHeight":"1"}},"fontSize":"small"} -->
<p class="has-small-font-size" style="line-height:1;text-transform:uppercase"><?php esc_html_e('EMoreau@Obsrvr.com', 'slab');?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->