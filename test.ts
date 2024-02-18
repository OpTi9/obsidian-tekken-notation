import { App } from "obsidian";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

interface CanvasDimensions {
	totalWidth: number;
	height: number;
}

interface NameEndTextSource {
	name: string;
	endText: string;
	modifiedSource: string;
}

async function processTekkenNotation(
	source: string,
	el: HTMLElement,
	app: App
) {
	const { name, endText, modifiedSource } = extractNameAndEndText(source);
	const moves = parseMoves(modifiedSource);
	const canvasDimensions = calculateCanvasDimensions(
		moves.length,
		name,
		endText
	);
	const canvas = createCanvas(canvasDimensions);
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		console.error("Unable to get canvas context");
		return;
	}

	await drawBackground(ctx, app, canvasDimensions);
	await drawNameAndEndText(ctx, name, endText, canvasDimensions);
	await drawMoves(ctx, app, moves);
	appendCanvasToElement(el, canvas);
}

function extractNameAndEndText(source: string): NameEndTextSource {
	let name = "",
		endText = "",
		modifiedSource = source;

	if (source.startsWith('"')) {
		const endIndex = source.indexOf('"', 1);
		if (endIndex !== -1) {
			name = source.substring(1, endIndex);
			modifiedSource = source.substring(endIndex + 2).trim();
		}
	}

	if (modifiedSource.endsWith('"')) {
		const startIndex = modifiedSource.lastIndexOf(
			'"',
			modifiedSource.length - 2
		);
		if (startIndex !== -1) {
			endText = modifiedSource.substring(
				startIndex + 1,
				modifiedSource.length - 1
			);
			modifiedSource = modifiedSource.substring(0, startIndex).trim();
		}
	}

	return { name, endText, modifiedSource };
}

function parseMoves(source: string): string[] {
	return source.split(",").filter((move) => move.trim() !== "");
}

function calculateCanvasDimensions(
	totalMoves: number,
	name: string = "",
	endText: string = ""
) {
	const startWidth = 110,
		middleWidth = 50,
		endWidth = 10;
	const nameWidth = estimateTextWidth(name, 22);
	const endTextWidth = estimateTextWidth(endText, 18);
	const gap = 100; // Minimum gap between name and endText
	const movesWidth = middleWidth * Math.ceil(totalMoves);

	// Calculate total width to accommodate name, endText, and the gap between them
	let totalWidth =
		startWidth + movesWidth + endWidth + nameWidth + endTextWidth + gap;

	return { totalWidth, startWidth, middleWidth, endWidth, height: 121 };
}

function createCanvas({
	totalWidth,
	height,
}: CanvasDimensions): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = totalWidth;
	canvas.height = height;
	return canvas;
}

async function drawBackground(
	ctx: CanvasRenderingContext2D,
	app: App,
	{
		totalWidth,
		height,
		startWidth,
		middleWidth,
		endWidth,
	}: {
		totalWidth: number;
		height: number;
		startWidth: number;
		middleWidth: number;
		endWidth: number;
	}
) {
	// Draw the start section
	const startImage = await loadImage(app, "background/start.png");
	ctx.drawImage(startImage, 0, 0, startWidth, height);

	// Calculate the total space available for middle sections
	const totalMiddleWidth = totalWidth - (startWidth + endWidth);

	// Calculate the number of middle images to fit in the available space
	const middleImagesCount = Math.floor(totalMiddleWidth / middleWidth);

	// Draw middle sections
	for (let i = 0; i < middleImagesCount; i++) {
		const middleImage = await loadImage(app, "background/middle.png");
		const xPos = startWidth + i * middleWidth;
		ctx.drawImage(middleImage, xPos, 0, middleWidth, height);
	}

	// Draw the end section
	// Adjust the X position of the end image based on the total width of the canvas minus the endWidth
	const endXPos = totalWidth - endWidth;
	const endImage = await loadImage(app, "background/end.png");
	ctx.drawImage(endImage, endXPos, 0, endWidth, height);
}

async function drawMoves(
	ctx: CanvasRenderingContext2D,
	app: App,
	moves: string[]
) {
	let xPos = 0; // Start position for the first move

	for (let i = 0; i < moves.length; i++) {
		const move = moves[i].trim();
		const imagePath = determineImagePathForMove(move);
		console.log("imagePath:", imagePath);
		if (imagePath === null) {
			drawErrorMessageOnCanvas(ctx, `Invalid: ${move}`);
			return; // Abort further drawing
		}

		try {
			const image = await loadImage(app, imagePath);
			if (i > 0) {
				xPos += 50; // Adjust position for subsequent moves
			}
			ctx.drawImage(image, xPos, 0); // Draw the image at the current position
		} catch (error) {
			drawErrorMessageOnCanvas(ctx, `Invalid: ${move}`);
			// Optionally, handle error by drawing a generic error message or specific error related to loading images
			return; // Abort further drawing
		}
	}
}

async function drawNameAndEndText(
	ctx: CanvasRenderingContext2D,
	name: string,
	endText: string,
	{ totalWidth }: CanvasDimensions
) {
	const nameMaxWidth = totalWidth;
	const endTextMaxWidth = totalWidth;

	if (name) {
		drawTextOnCanvas(ctx, name, 22, 20, 35, nameMaxWidth, "left");
	}
	if (endText) {
		const endTextStartX = totalWidth - endTextMaxWidth;
		drawTextOnCanvas(
			ctx,
			endText,
			18,
			endTextStartX,
			35,
			endTextMaxWidth,
			"right"
		);
	}
}

function appendCanvasToElement(el: HTMLElement, canvas: HTMLCanvasElement) {
	const img = document.createElement("img");
	img.src = canvas.toDataURL("image/png");
	img.alt = "Tekken notation visualization";
	el.innerHTML = ""; // Clear existing content
	el.appendChild(img);
}

// Utility function to load images
function loadImage(app: App, fileName: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		// Corrected path that includes the `.obsidian/plugins` segment
		const filePath = `obsidian-sample-plugin/images/${fileName}`;

		app.vault.adapter
			.readBinary(`.obsidian/plugins/${filePath}`)
			.then((data) => {
				const blob = new Blob([data], { type: "image/png" }); // Assuming PNG images
				const url = URL.createObjectURL(blob);

				const img = new Image();
				img.onload = () => {
					URL.revokeObjectURL(url); // Clean up the URL object
					resolve(img);
				};
				img.onerror = () => {
					URL.revokeObjectURL(url); // Clean up the URL object
					reject(new Error(`Failed to load image: ${fileName}`));
				};

				img.src = url;
			})
			.catch((error) => {
				reject(error);
			});
	});
}

// Utility function to estimate text width based on font size and text length
function estimateTextWidth(text: string, fontSize: number) {
	const averageCharacterWidth = fontSize * 0.6; // This factor can be adjusted based on the actual font used
	return text.length * averageCharacterWidth;
}

function determineImagePathForMove(move: string): string | null {
	let imagePath = "";

	if (/\d/.test(move)) {
		imagePath = `/attack-buttons/${move}.png`;
	} else if (/^[A-Z]+$/.test(move)) {
		imagePath = `/hold-direction/${move.toLowerCase()}.png`;
	} else if (/^[a-z]+$/.test(move)) {
		imagePath = `/press-direction/${move}.png`;
	} else if (["-", "[", "]"].includes(move)) {
		imagePath = `/misc/${move}.png`;
	} else {
		console.warn(`Unrecognized move: ${move}`);
		return null; // Skip drawing this move
	}

	return imagePath;
}

function drawErrorMessageOnCanvas(
	ctx: CanvasRenderingContext2D,
	message: string
) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas before showing the error
	ctx.font = "bold 17px Arial";
	ctx.fillStyle = "red";
	ctx.fillText(message, 10, 50); // Position the text appropriately
}

function drawTextOnCanvas(
	ctx: CanvasRenderingContext2D,
	text: string,
	size: number,
	x: number,
	y: number,
	maxWidth: number,
	align: "left" | "right" = "left"
) {
	let fontSize = size;
	ctx.font = `bold ${fontSize}px Verdana`;
	ctx.fillStyle = "white";

	// Reduce the font size until the text fits the maxWidth
	while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
		fontSize--;
		ctx.font = `bold ${fontSize}px Verdana`;
	}

	// Adjust x position based on alignment
	const textWidth = ctx.measureText(text).width;
	if (align === "right") {
		x = maxWidth - textWidth - 20; // 20 is the right padding
	} else {
		// Ensure that x position is not too close to the canvas edge
		x = Math.max(x, 20); // 20 is the left padding
	}

	ctx.fillText(text, x, y); // Draw the text with the adjusted font size or position
}
