<?php
/**
 * Title: index
 * Slug: slab/index
 * Inserter: no
 */
?>
<!-- wp:columns {"metadata":{"categories":["hidden"]},"align":"full","style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"margin":{"top":"0rem","bottom":"0rem"},"blockGap":{"top":"0rem","left":"0rem"}}}} -->
<div class="wp-block-columns alignfull" style="margin-top:0rem;margin-bottom:0rem;padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem"><!-- wp:column {"verticalAlignment":"stretch","width":"40%","lock":{"move":false,"remove":false},"metadata":{"name":"40"},"style":{"spacing":{"padding":{"top":"0rem","right":"0rem","bottom":"0rem","left":"0rem"},"blockGap":"0px"}},"layout":{"type":"default"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="padding-top:0rem;padding-right:0rem;padding-bottom:0rem;padding-left:0rem;flex-basis:40%"><!-- wp:group {"metadata":{"name":"Portrait Sticky Container"},"style":{"position":{"type":"sticky","top":"0px"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:template-part {"slug":"portrait-home"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"top","width":"15%","metadata":{"name":"15"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:15%"><!-- wp:group {"metadata":{"name":"Central Container"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|20","right":"var:preset|spacing|20"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"constrained","justifyContent":"left"}} -->
<div class="wp-block-group" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--20)"><!-- wp:paragraph -->
<p><?php esc_html_e('Margot Linwood is a writer and independent scholar whose work revolves around philosophy, cultural memory, and the architecture of thought. With a background in literature and archival studies, she writes to explore how ideas take shape and how some outlast the people who create them.', 'slab');?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"stretch","width":"45%","metadata":{"name":"45"},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:45%"><!-- wp:group {"tagName":"main","lock":{"move":false,"remove":false},"metadata":{"name":"Content Block"},"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|60","right":"var:preset|spacing|60"},"margin":{"top":"20px","bottom":"20px"}}},"layout":{"type":"constrained","justifyContent":"center"}} -->
<main class="wp-block-group alignfull" style="margin-top:20px;margin-bottom:20px;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--60)"><!-- wp:query {"queryId":0,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":true,"taxQuery":null,"parents":[]},"enhancedPagination":true,"layout":{"type":"constrained","justifyContent":"center"}} -->
<div class="wp-block-query"><!-- wp:post-template {"align":"wide","style":{"spacing":{"blockGap":"20px"}},"layout":{"type":"constrained"}} -->
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top" style="margin-top:0;margin-bottom:0"><!-- wp:column {"verticalAlignment":"top","width":"15%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:15%"><!-- wp:post-featured-image {"isLink":true,"aspectRatio":"3/4","overlayColor":"base","dimRatio":20} /--></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"top","width":"85%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:85%"><!-- wp:group {"metadata":{"name":"Post Template Info"},"style":{"spacing":{"blockGap":"0","padding":{"top":"0","bottom":"var:preset|spacing|30"}}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
<div class="wp-block-group" style="padding-top:0;padding-bottom:var(--wp--preset--spacing--30)"><!-- wp:post-title {"isLink":true,"fontSize":"medium"} /-->

<!-- wp:post-date {"format":"M j—Y","isLink":true} /--></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
<!-- /wp:post-template -->

<!-- wp:group {"metadata":{"name":"Pagination Block"},"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:query-pagination {"align":"wide"} -->
<!-- wp:query-pagination-previous {"label":""} /-->

<!-- wp:query-pagination-numbers /-->

<!-- wp:query-pagination-next {"label":""} /-->
<!-- /wp:query-pagination -->

<!-- wp:query-no-results {"align":"wide"} -->
<!-- wp:paragraph {"placeholder":"Add text or blocks that will display when a query returns no results."} -->
<p><?php esc_html_e('Sorry, but nothing matched your search terms. Please try again with some different keywords.', 'slab');?></p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results --></div>
<!-- /wp:group --></div>
<!-- /wp:query -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /--></main>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->