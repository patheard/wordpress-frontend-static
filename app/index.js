import fs from "fs";
import path from "path";
import config from "./config/index.js";
import WordPressService from "./services/wordpress.js";
import HandlebarsHelper from "./utils/handlebars-helper.js";

async function setup(rootDir) {
  await fs.promises.rm(path.join(rootDir, config.site.dist), {
    recursive: true,
    force: true,
  });
  await fs.promises.cp(
    path.join(rootDir, "public"),
    path.join(rootDir, config.site.dist, "public"),
    { recursive: true },
  );
}

async function build(rootDir, langs) {
  const wordPressService = new WordPressService(config.wordpress);
  const handlebarsHelper = new HandlebarsHelper(config, rootDir);
  await handlebarsHelper.setup();

  langs.forEach(async (lang) => {
    const menuRaw = await wordPressService.getMenu(lang);
    const menuTree = wordPressService.createMenuTree(menuRaw);

    menuRaw.forEach(async (menuItem) => {
      const slug = wordPressService.getPageSlugFromUrl(menuItem.url);
      const page = await wordPressService.getPage(slug, lang);
      await handlebarsHelper.renderPage(page, menuTree, menuItem, lang);
    });
  });
}

await setup(import.meta.dirname);
await build(import.meta.dirname, ["en", "fr"]);
