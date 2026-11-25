# Admin guide

Everything about your site can be changed from **https://ssmith46.github.io/admin/** without touching code.

## Signing in

Only GitHub accounts that can edit the `ssmith46/ssmith46.github.io` repository can publish. That check is enforced by GitHub itself, so nobody else can change your site, even though anyone can see the sign-in page.

**First time on a device:**

1. Click **Open GitHub**. GitHub's "new access key" (fine-grained personal access token) form opens, with a name and description filled in.
   - Under **Repository access**, choose **Only select repositories**, then pick `ssmith46.github.io`.
   - Check that the permissions include **Contents: Read and write**. **Actions: Read** is optional; it lets the admin show when a deploy finishes.
   - Click **Generate token** and copy it.
2. Paste the key into the admin and choose a **password for this device**.

The key is stored encrypted on that device. Next time you only type your password. To switch accounts, or if you forget the password, choose *Use a different account* on the sign-in screen and connect a new key.

> The key expires after a year (you can choose a different expiry on GitHub). When it expires, the admin will ask you to connect a new one.

## How editing works

- **Every edit saves automatically as a draft** on this device. Closing the tab or refreshing never loses work.
- Edited items show an orange **Draft** badge, and the sidebar shows a dot next to sections with changes.
- **Publish** (top right, or ⌘/Ctrl + S) shows every change, lets you undo any single one, and puts them all online together. The top bar shows *Publishing… → Live* while the site rebuilds, which takes about a minute.
- **Photos and files are the exception.** Uploads and deletions happen immediately, because pages can only use a file once it exists.

## Pages

Pages are built from **sections** (hero, text, project lists, call to action, gallery, space scene…).

- **Add section** at the bottom, or hover between two sections and click the **+** that appears.
- Drag the ⋮⋮ handle (or use the ⋯ menu) to reorder sections. The 👁 icon hides a section without deleting it.
- **Click anything in the preview** to jump to that section's settings.
- Each section has a **Section style** group: background, spacing, an anchor name for `#links`, and *hide*.
- **Page settings** covers the title, web address, the intro shown under the title, and the description used by Google and link previews.
- The ⋯ menu at the top adds or removes the page from the menu, duplicates it, or deletes it.

The **Not-found page** (404) is the "Lost in space" page visitors see on a broken link. You can edit it like any other page.

## Projects, experience, education, write-ups

Each collection in the sidebar works the same way: **New …**, fill in the form, and watch the preview.

- **Projects** get their own write-up page. Toggle **Feature on the home page** to show one in the home page's "Selected work". Drag projects to set their order.
- **Experience** and **Education**: leave the *Ended* date empty for something current, and it shows as *Present* with a glowing marker.
- **Write-ups** are articles. The *Writing* page is hidden until you are ready: open **Pages → Writing**, turn off *Hide this page*, and add it to the menu.
- Any item can be hidden without deleting it.

Rich text fields support **bold**, *italic*, links, lists, quotes and images. Use the toolbar, or the **Preview** tab to check your formatting.

## Résumé

**Settings → Résumé** holds one PDF. Every button or menu item that links to *My résumé* opens it. To update it, use **Overview → Update your résumé**, or **Media → your PDF → Replace**. Every link updates at once.

*Old résumé addresses* keeps links you shared before (like `/sullivanSmithResume.pdf`) working. Those addresses always serve the current file.

## Media

Drop files anywhere on the **Media** screen. Photos are resized and converted to a compact format automatically. Select a file to copy its link, see where it's used, replace it with a new version (links keep working), or delete it.

## Design

**Design** changes the whole site with a live preview:

- **Color theme.** Each theme has a matching light and dark version.
- **Accent color.** Pick a preset or any custom color. The dark-mode version is adjusted automatically so it stays readable.
- **Fonts**, **corner style**, **what visitors see first** (their system setting, light, or dark), and **scroll animations**.

Visitors can always switch between light, system and dark with the toggle in the header.

## Settings

Site name, tagline, description, sharing image, browser-tab icon, **menu**, **social links**, footer note, **collections** (add new lists such as "Talks" or "Publications"), and address and search-engine visibility.

## More sites (running log, movie journal…)

Click your site name at the top left → **New site…**, choose a template (*Running log*, *Movie journal*, *Portfolio* or *Blank*), and give it a name and an address such as `/running/`.

Each site is completely separate: its own pages, menu, theme and address. Nothing links between sites, so visitors of one never see the other. Switch between sites from the same menu. Nothing goes online until you publish.

> Privacy note: this repository is public on GitHub, so its files, including content for every site, can be browsed there. If you ever want a site to be truly private, make the repository private. GitHub Pages works on private repositories with GitHub Pro, which is free for students through the GitHub Student Developer Pack.

## If something goes wrong

- **"Someone changed these files elsewhere"**: the files were edited in another tab, on another device, or in code. You can publish anyway, which keeps your version, or discard your draft to keep theirs.
- **Deploy failed**: click the red status to open the log on GitHub. Your content is safe; usually re-running the workflow, or publishing again, fixes it.
- **Undo a published change**: every publish is a commit in GitHub's history (*Overview → Recent activity*). Any version can be restored from there.
