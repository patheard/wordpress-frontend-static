import dotenv from "dotenv";
dotenv.config();

const config = {
  wordpress: {
    url: process.env.WORDPRESS_URL,
    user: process.env.WORDPRESS_USER,
    password: process.env.WORDPRESS_PASSWORD,
    get authToken() {
      return Buffer.from(`${this.user}:${this.password}`).toString("base64");
    },
    menuIds: {
      en: process.env.MENU_ID_EN,
      fr: process.env.MENU_ID_FR,
    },
  },
  site: {
    dist: process.env.SITE_DIST,
    names: {
      en: process.env.SITE_NAME_EN,
      fr: process.env.SITE_NAME_FR,
    },
  },
};

export default config;
