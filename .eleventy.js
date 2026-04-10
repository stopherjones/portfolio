const Image = require("@11ty/eleventy-img");
const path = require("path");

module.exports = function (eleventyConfig) {
  
  // --- 1. ASSET MANAGEMENT ---
  
 // 1. Copy CSS and custom JS
eleventyConfig.addPassthroughCopy("src/assets");

// 2. Copy PhotoSwipe files from node_modules
eleventyConfig.addPassthroughCopy({ 
  "node_modules/photoswipe/dist": "assets/photoswipe" 
});

// 3. Copy site images (logo, icons) to public/img/site/
eleventyConfig.addPassthroughCopy({ 
  "src/images/Galleries/siteimages": "img/site" 
});

// 4. THE CRITICAL ADDITION: Map all gallery folders to /public/img/
// This ensures /src/images/Galleries/Arts/cover.jpg -> /public/img/Arts/cover.jpg
eleventyConfig.addPassthroughCopy({ 
  "src/images/Galleries": "img" 
});

  // --- 2. IMAGE SHORTCODE ---

  eleventyConfig.addNunjucksAsyncShortcode("galleryImage", async function (src, alt) {
    try {
      let metadata = await Image(src, {
        widths: [600, 1600],
        formats: ["webp"],
        outputDir: "./public/img/",
        urlPath: "/img/",
        filenameFormat: function (id, src, width, format) {
          const extension = path.extname(src);
          const name = path.basename(src, extension);
          // Standardize filenames to avoid issues with special characters
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

      return `<a href="${highres.url}" 
                 class="gallery-item" 
                 data-pswp-width="${highres.width}" 
                 data-pswp-height="${highres.height}" 
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
      includes: "_includes", // CRITICAL: This allows {% include "navbar.njk" %} to work
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};