/**
 * @file tools/config.mjs
 * Build settings for the whole repository.
 *
 * Change a value here, commit, and the next deploy applies it.
 */
export default {
  /**
   * Where the admin lives on the published site: https://<your-site>/<adminPath>/
   *
   * It is never linked from the public site. A less obvious name keeps casual
   * visitors from stumbling on the sign-in screen, but it is not what keeps the
   * admin safe: GitHub only lets your own account publish. Use one URL-safe
   * word (letters, numbers, dashes) that no page or site address uses.
   */
  adminPath: 'edit-da-website',
};
