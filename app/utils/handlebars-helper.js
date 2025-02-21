import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

export default class HandlebarsHelper {
  constructor(config, rootDir) {
    this.Handlebars = Handlebars;
    this.config = config;
    this.rootDir = rootDir;
  }

  async setup() {
    this.Handlebars.registerHelper(this.getTemplateHelpers());
    await this.registerPartials(path.join(this.rootDir, "views", "partials"));
  }

  async renderTemplate(templatePath, data) {
    try {
      const templateSource = await fs.promises.readFile(templatePath, "utf8");
      const template = this.Handlebars.compile(templateSource);
      return template(data);
    } catch (error) {
      console.error(`Error rendering template: ${error.message}`);
      throw error;
    }
  }

  async renderPage(page, menu, menuItem, lang) {
    try {
      if (menuItem.type === "post_type") {
        const pagePath = menuItem.url.replace(this.config.wordpress.url, "");
        const pathSegments = pagePath.split("/");
        const writePath = path.join(
          this.rootDir,
          this.config.site.dist,
          ...pathSegments,
        );

        const html = await this.renderTemplate(
          path.join(this.rootDir, "views", "layouts", "main.hbs"),
          {
            page: page,
            menu: menu,
            isHome: pagePath === "/",
            langSwap: lang === "en" ? "fr" : "en",
            langSwapSlug: lang === "en" ? page.slug_fr : page.slug_en,
            siteName: this.config.site.names[lang],
          },
        );

        console.log(`Saving page: ${pagePath}`);
        await fs.promises.mkdir(writePath, { recursive: true });
        await fs.promises.writeFile(path.join(writePath, "index.html"), html);
      }
    } catch (error) {
      console.error(`Error rendering page: ${error.message}`);
      throw error;
    }
  }

  async registerPartial(partialName, partialPath) {
    try {
      const partialSource = await fs.promises.readFile(partialPath, "utf8");
      this.Handlebars.registerPartial(partialName, partialSource);
    } catch (error) {
      console.error(`Error registering partial: ${error.message}`);
      throw error;
    }
  }

  async registerPartials(partialsDir) {
    try {
      const files = await fs.promises.readdir(partialsDir);

      for (const file of files) {
        if (path.extname(file) === ".hbs") {
          const partialName = path.basename(file, ".hbs");
          const partialPath = path.join(partialsDir, file);
          await this.registerPartial(partialName, partialPath);
        }
      }

      console.log(`Registered ${files.length} partials from ${partialsDir}`);
    } catch (error) {
      console.error(`Error registering partials: ${error.message}`);
      throw error;
    }
  }

  getTemplateHelpers() {
    return {
      dateFormat: (date) =>
        new Date(date).toLocaleDateString("en-CA", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }),
      eq: (a, b) => a == b,
      updateMarkup: (content) => {
        if (!content) return "";

        const siteUrl = new RegExp(`${this.config.wordpress.url}`, "g");

        // Updates the WordPress content to match with the expected markup
        // for the Design System components.
        return content
          .replace(
            /<details class="alert alert-([^"]+)" open><summary class="h3"><h3>([^<]+)<\/h3><\/summary>(.+)<\/details>/g,
            '<section class="mt-300 mb-300"><gcds-notice type="$1" notice-title-tag="h2" notice-title="$2"><gcds-text>$3</gcds-text></gcds-notice></section>',
          )
          .replace(
            /<div class="wp-block-button"><a class="wp-block-button__link[^"]+" href="([^"]+)">([^<]+)<\/a><\/div>/g,
            '<gcds-button type="link" href="$1">$2</gcds-button>',
          )
          .replace(
            /<details class="wp-block-cds-snc-accordion"><summary>([^<]+)<\/summary>\n*(.+)\n*<\/details>/g,
            '<gcds-details details-title="$1">$2</gcds-details>',
          )
          .replace(
            /<div class="wp-block-cds-snc-accordion__content">(.+)<\/div>/g,
            "<gcds-text>$1</gcds-text>",
          )
          .replace(siteUrl, "");
      },
    };
  }
}
