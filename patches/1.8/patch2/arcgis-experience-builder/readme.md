This patch fixes Edit widget fails when selecting a feature that has related records to the child table.

Steps:
  1. [Download](https://github.com/Esri/arcgis-experience-builder-sdk-resources/archive/refs/heads/master.zip) the repository code and unzip it.
  2. Browse to the patch directory (`patches/1.8/patch2/arcgis-experience-builder`)
  3. Replace the files in the `client` folder with the files in the `client` folder on your Experience Builder installation.
  4. Run `npm ci` in the `client` folder
  5. Restart the node server in both `client` and `server` folders
