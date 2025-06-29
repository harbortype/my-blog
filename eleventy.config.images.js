import path from "path";
import eleventyImage from "@11ty/eleventy-img";

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

export default function (eleventyConfig) {
	function relativeToInputPath(inputPath, relativeFilePath) {
		let split = inputPath.split("/");
		split.pop();

		return path.resolve(split.join(path.sep), relativeFilePath);
	}

	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode(
		"image",
		async function imageShortcode(src, alt, widths, sizes) {
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
		},
	);

	// My custom picture shortcode
	// https://www.aleksandrhovhannisyan.com/blog/eleventy-image-plugin/#custom-image-markup
	eleventyConfig.addAsyncShortcode(
		"figure",
		async function (
			src,
			alt,
			caption = undefined,
			className = undefined,
			widths = ["auto"],
			formats = ["webp", "jpeg", "auto"],
			sizes = "100vw",
		) {
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
				.join("");

			// Generate the <img> tag
			const smallestImage = imageMetadata.jpeg[0];
			const imgAttributes = stringifyAttributes({
				src: smallestImage.url,
				width: smallestImage.width,
				height: smallestImage.height,
				alt,
				loading: "lazy",
				decoding: "async",
			});
			const imgHtmlString = `<img ${imgAttributes}>`;

			// Assemble the <picture> tag
			const figureAttributes = stringifyAttributes({
				class: className,
				style: `max-width: min(${smallestImage.width}px, var(--content-width)););`,
			});

			var figureElements = [];
			figureElements.push(`<figure ${figureAttributes}>`);
			figureElements.push(`<picture>`);
			figureElements.push(`${sourceHtmlString}`);
			figureElements.push(`${imgHtmlString}`);
			figureElements.push(`</picture>`);
			if (caption) {
				figureElements.push(`<figcaption>${caption}</figcaption>`);
			}
			figureElements.push(`</figure>`);
			const figure = figureElements.join("");
			return figure;
		},
	);
}
