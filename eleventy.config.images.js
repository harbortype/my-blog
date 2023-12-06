const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

// Maps a config of attribute-value pairs to an HTML string
// representing those same attribute-value pairs, like this:
// in  = {attribute1: "value1", attribute2: "value2"}
// out = attribute1="value1" attribute2="value2"
const stringifyAttributes = (attributeMap) => {
	return Object.entries(attributeMap)
		.map(([attribute, value]) => {
			if (typeof value === "undefined") return "";
			return `${attribute}="${value}"`;
		})
		.join(" ");
};

module.exports = eleventyConfig => {
	function relativeToInputPath(inputPath, relativeFilePath) {
		let split = inputPath.split("/");
		split.pop();

		return path.resolve(split.join(path.sep), relativeFilePath);
	}

	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode("image", async function imageShortcode(src, alt, widths, sizes) {
		// Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
		// Warning: Avif can be resource-intensive so take care!
		let formats = ["avif", "webp", "auto"];
		let file = relativeToInputPath(this.page.inputPath, src);
		let metadata = await eleventyImage(file, {
			widths: widths || ["auto"],
			formats,
			outputDir: path.join(eleventyConfig.dir.output, "img"), // Advanced usage note: `eleventyConfig.dir` works here because we’re using addPlugin.
		});

		// TODO loading=eager and fetchpriority=high
		let imageAttributes = {
			alt,
			sizes,
			loading: "lazy",
			decoding: "async",
		};
		return eleventyImage.generateHTML(metadata, imageAttributes);
	});

	// My custom picture shortcode
	// https://www.aleksandrhovhannisyan.com/blog/eleventy-image-plugin/#custom-image-markup
	eleventyConfig.addAsyncShortcode("customPicture", async (
		src,
		alt,
		caption = undefined,
		className = undefined,
		widths = [400, 800, 1280],
		formats = ["webp", "jpeg"],
		sizes = "100vw"
	) => {
		const imageMetadata = await eleventyImage(src, {
			widths: [...widths, null],
			formats: [...formats, null],
			outputDir: path.join(eleventyConfig.dir.output, "img"), // copied from above
			urlPath: "/img",
			// dryRun: true,
		});

		// Generate the <source> tags
		const sourceHtmlString = Object.values(imageMetadata)
			// Map each format to the source HTML markup
			.map((images) => {
				// The first image’s sourceType is the same as those of all
				// other images belonging to this format (e.g. image/webp)
				const { sourceType } = images[0];
				const sourceAttributes = stringifyAttributes({
					type: sourceType,
					// srcset needs to be a comma-separated attribute
					srcset: images.map((image) => image.srcset).join(", "),
					sizes,
				});
				// Return one <source> per format
				return `<source ${sourceAttributes}>`;
			})
			.join("\n");

		// Generate the <img> tag
		const getLargestImage = (format) => {
			const images = imageMetadata[format];
			return images[images.length - 1];
		}
		const largestUnoptimizedImg = getLargestImage(formats[0]);
		const imgAttributes = stringifyAttributes({
			src: largestUnoptimizedImg.url,
			// width: largestUnoptimizedImg.width,
			// height: largestUnoptimizedImg.height,
			alt,
			loading: "lazy",
			decoding: "async",
		});
		const imgHtmlString = `<img ${imgAttributes}>`;

		// Assemble the <picture> tag
		const pictureAttributes = stringifyAttributes({
			class: className,
		});
		// If there is a caption, assemble a <figure> tag instead,
		// otherwise, keep it as <picture>
		if (typeof caption === "undefined") {
			const picture = `<picture ${pictureAttributes}>
${sourceHtmlString}
${imgHtmlString}
</picture>`;
			return picture;
		} else {
			const picture = `<figure ${pictureAttributes}>
${sourceHtmlString}
${imgHtmlString}
<figcaption>${caption}</figcaption>
</figure>`;
			return picture;
		}

	});
};
