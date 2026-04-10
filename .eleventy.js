const fs = require("fs");
const Image = require("@11ty/eleventy-img");
const path = require("path");

module.exports = function (eleventyConfig) {
  
  const pathPrefix = (process.env.ELEVENTY_PATH_PREFIX || "").replace(/\/$/, "");
  eleventyConfig.addGlobalData("pathPrefix", pathPrefix);
  const imageUrlPath = pathPrefix ? `${pathPrefix}/img/` : "/img/";

  // --- 1. ASSET MANAGEMENT ---
  
  // Copy CSS and custom JS
  eleventyConfig.addPassthroughCopy("src/assets");

  // Copy PhotoSwipe files from node_modules
  eleventyConfig.addPassthroughCopy({ 
    "node_modules/photoswipe/dist": "assets/photoswipe" 
  });

  // Copy site images (logo, icons) to public/img/site/
  eleventyConfig.addPassthroughCopy({ 
    "src/images/galleries/siteimages": "img/site" 
  });
  eleventyConfig.addPassthroughCopy({ 
    "src/images/York Minster.jpg": "img/site/personal-cover.jpg"
  });

  const galleriesLower = path.join(process.cwd(), "src/images/galleries");
  const galleriesUpper = path.join(process.cwd(), "src/images/Galleries");
  const galleriesDir = fs.existsSync(galleriesLower) ? galleriesLower : galleriesUpper;

  if (fs.existsSync(galleriesDir)) {
    fs.readdirSync(galleriesDir).forEach(folder => {
      const folderPath = path.join(galleriesDir, folder);
      if (fs.statSync(folderPath).isDirectory() && folder !== "siteimages") {
        eleventyConfig.addPassthroughCopy({
          [folderPath]: path.join("img", folder)
        });
      }
    });
  }

  // --- 2. IMAGE SHORTCODE ---

  eleventyConfig.addNunjucksAsyncShortcode("galleryImage", async function (src, alt) {
    if (src && typeof src !== "string" && src.path) {
      src = src.path;
    }

    try {
      let metadata = await Image(src, {
        widths: [600, 1600],
        formats: ["webp"],
        outputDir: "./public/img/",
        urlPath: imageUrlPath,
        filenameFormat: function (id, src, width, format) {
          const extension = path.extname(src);
          const name = path.basename(src, extension);
          return `${name}-${width}w.${format}`;
        }
      });

      if (!metadata.webp || metadata.webp.length === 0) {
        console.error(`❌ Metadata missing for image: ${src}`);
        return "";
      }

      let lowres = metadata.webp[0];
      let highres = metadata.webp[1] || metadata.webp[0]; 
      let aspectRatio = (lowres.width / lowres.height).toFixed(4);

      // The <a> tag acts as the PhotoSwipe trigger. 
      // It must contain the href to the high-res image and dimensions.
      return `<a href="${highres.url}" 
                 data-pswp-width="${highres.width}" 
                 data-pswp-height="${highres.height}" 
                 target="_blank"
                 style="flex-grow: ${aspectRatio}; flex-basis: ${aspectRatio * 200}px">
                <img src="${lowres.url}" 
                     alt="${alt}" 
                     loading="lazy" 
                     style="width:100%; height:100%; object-fit:cover;">
              </a>`;
    } catch (e) {
      console.error(`❌ Failed to process image [${src}]:`, e.message);
      return ``;
    }
  });

  eleventyConfig.addNunjucksAsyncShortcode("coverImage", async function (src, alt, width = 480) {
    if (src && typeof src !== "string" && src.path) {
      src = src.path;
    }

    try {
      let metadata = await Image(src, {
        widths: [width],
        formats: ["webp", "jpeg"],
        outputDir: "./public/img/",
        urlPath: imageUrlPath,
        filenameFormat: function (id, src, width, format) {
          const extension = path.extname(src);
          const name = path.basename(src, extension);
          return `${name}-${width}w.${format}`;
        }
      });

      const webp = metadata.webp && metadata.webp[0];
      const jpeg = metadata.jpeg && metadata.jpeg[0];
      const imgUrl = jpeg ? jpeg.url : webp.url;

      return `<picture>
                ${webp ? `<source type="image/webp" srcset="${webp.url}">` : ""}
                <img src="${imgUrl}" alt="${alt}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
              </picture>`;
    } catch (e) {
      console.error(`❌ Failed to process cover image [${src}]:`, e.message);
      return `<img src="${src}" alt="${alt}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">`;
    }
  });

  // --- 3. CONFIGURATION ---

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};