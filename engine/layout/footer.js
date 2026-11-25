/**
 * @file footer.js
 * Site footer: copyright line, optional note, social links, back-to-top.
 */
import { html } from '../core/html.js';
import { renderSocials } from './socials.js';

export function renderFooter(ctx) {
  const { site } = ctx;
  return html`<footer class="site-footer">
    <div class="container site-footer__inner">
      <div class="site-footer__text">
        <p class="site-footer__copy">© ${ctx.year} ${site.title}</p>
        ${site.footer ? html`<p class="site-footer__note">${ctx.mdInline(site.footer)}</p>` : ''}
      </div>
      ${renderSocials(site.socials, ctx, { size: 18 })}
      <a class="back-to-top" href="#top">Back to top ${ctx.icon('arrow-up', { size: 14 })}</a>
    </div>
  </footer>`;
}
