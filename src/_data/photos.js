const fs = require("fs");
const path = require("path");

module.exports = function() {
  const galleryDir = path.join(process.cwd(), "src/images/Galleries");
  const folders = fs.readdirSync(galleryDir).filter(f => {
    const fullPath = path.join(galleryDir, f);
    return fs.statSync(fullPath).isDirectory() && f !== "siteimages";
  });

  const personalSlugs = ["londonunderground", "monopoly", "drone", "off-camera-flash", "drawings"];

  return folders.map(folder => {
    const slug = folder.toLowerCase().replace(/\s+/g, '-');
    const folderPath = path.join(galleryDir, folder);
    
    // Get all valid images and sort them alphabetically
    const allFiles = fs.readdirSync(folderPath)
      .filter(file => file.match(/\.(jpg|jpeg|png|webp|JPG|JPEG)$/i))
      .sort(); 

    // Find cover.jpg specifically for thumbnails
    let coverFile = allFiles.find(file => file.toLowerCase().startsWith('cover'));
    if (!coverFile && allFiles.length > 0) {
      coverFile = allFiles[0];
    }

    return {
      name: folder,
      slug: slug,
      // Strictly map images from the local folder path to prevent stray files
      images: allFiles.map(p => path.join("src/images/Galleries", folder, p)),
      cover: coverFile ? `/img/${folder}/${coverFile}`.replace(/\\/g, '/') : null,
      isPersonal: personalSlugs.includes(slug)
    };
  });
};