import axios from "axios";

export default class WordPressService {
  constructor(config) {
    this.config = config;
  }

  async getPage(slug, lang) {
    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp/v2/pages?slug=${slug}&lang=${lang}`,
      );
      return response.data.length ? response.data[0] : null;
    } catch (error) {
      console.error("Error fetching page:", error.message);
      throw error;
    }
  }

  async getMenu(lang) {
    const menuId =
      lang === "en" ? this.config.menuIds.en : this.config.menuIds.fr;

    try {
      const response = await axios.get(
        `${this.config.url}/wp-json/wp/v2/menu-items?menus=${menuId}`,
        {
          headers: {
            Authorization: `Basic ${this.config.authToken}`,
          },
        },
      );
      return this.createMenuTree(response.data);
    } catch (error) {
      console.error("Error fetching menu:", error.message);
      throw error;
    }
  }

  getPageSlugFromPath(pagePath) {
    const segments = pagePath.split("/").filter(Boolean);
    const slug = segments[segments.length - 1] || "home";
    return slug;
  }

  createMenuTree(menuItems) {
    const menuTree = [];
    const menuMap = {};

    // Create a lookup object for menu items
    menuItems.forEach((item) => {
      item.url = item.url.replace(this.config.url, "");
      menuMap[item.id] = { ...item, children: [] };
    });

    // Organize the items into a nested structure
    menuItems.forEach((item) => {
      if (item.parent === 0) {
        menuTree.push(menuMap[item.id]);
      } else if (menuMap[item.parent]) {
        menuMap[item.parent].children.push(menuMap[item.id]);
      }
    });

    return menuTree;
  }
}
