const fs = require("fs");
const Image = require("@11ty/eleventy-img");
const path = require("path");

module.exports = function (eleventyConfig) {
  
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
        urlPath: "/img/",
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