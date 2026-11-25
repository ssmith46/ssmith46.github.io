/**
 * @file config.js
 * Which repository the admin edits. The defaults are inferred from the
 * address the admin is served from (owner.github.io → owner/owner.github.io),
 * so most people never need to touch this file.
 */
function inferOwner() {
  const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
  return m ? m[1] : 'ssmith46';
}

export default {
  repo: {
    owner: inferOwner(),
    name: `${inferOwner()}.github.io`,
    branch: 'main',
  },
  /** Folder that holds all editable content (must match engine/core/bundle.js). */
  contentRoot: 'content',
};
