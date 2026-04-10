const fs = require("fs");
const path = require("path");

module.exports = function() {
  const galleryDir = path.join(process.cwd(), "src/images/galleries");
  const folders = fs.readdirSync(galleryDir).filter(f => {
    const fullPath = path.join(galleryDir, f);
    return fs.statSync(fullPath).isDirectory() && f !== "siteimages";
  });

  const personalSlugs = ["londonunderground", "monopoly", "drone", "off-camera-flash", "drawings"];
  const displayNames = {
    LondonUnderground: "London Underground",
    Monopoly: "London Monopoly"
  };
  const personalOrder = ["londonunderground", "monopoly", "drone", "off-camera-flash", "drawings"];

  return folders.map(folder => {
    const slug = folder.toLowerCase().replace(/\s+/g, '-');
    const galleryName = displayNames[folder] || folder.replace(/([a-z])([A-Z])/g, '$1 $2');
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
  name: galleryName,
  slug: slug,
  images: allFiles.map(p => {
    const fileName = path.basename(p, path.extname(p));
    return {
      path: path.join("src/images/galleries", folder, p),
      // Only generate a title if it's one of your two specific galleries
      title: (slug === "londonunderground" || slug === "monopoly") 
             ? fileName.replace(/-/g, ' ').replace(/_/g, ' ') 
             : null
    };
  }),
  cover: coverFile ? `/img/${folder}/${coverFile}`.replace(/\\/g, '/') : null,
  isPersonal: personalSlugs.includes(slug)
};
  }).sort((a, b) => {
    if (a.isPersonal && b.isPersonal) {
      return personalOrder.indexOf(a.slug) - personalOrder.indexOf(b.slug);
    }
    return 0;
  });
};