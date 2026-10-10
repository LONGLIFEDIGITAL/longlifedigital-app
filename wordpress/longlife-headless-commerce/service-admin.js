/* global wp */
/* Keep the block editor's native slug in sync with the headless URL field.
 * Otherwise a later REST save could restore the editor's previous slug.
 */
(function () {
  document.addEventListener('input', function (event) {
    if (event.target.id !== 'lld-service-slug') return;
    const slug = event.target.value.trim();
    if (!slug) return;
    const editor = wp.data.select('core/editor');
    if (editor.getCurrentPostType() !== 'lld_service') return;
    wp.data.dispatch('core/editor').editPost({ slug });
  });
})();
