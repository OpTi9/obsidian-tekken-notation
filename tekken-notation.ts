import { App } from "obsidian";

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

const inputs = new Set([
	// attacks
	"1",
	"2",
	"3",
	"4",
	"1+2",
	"1+3",
	"1+4",
	"2+3",
	"2+4",
	"3+4",
	"1+2+3",
	"1+2+4",
	"1+3+4",
	"2+3+4",
	"1+2+3+4",
	// hold moves
	"U",
	"D",
	"F",
	"B",
	"UF",
	"DF",
	"UB",
	"DB",
	// press moves
	"u",
	"d",
	"f",
	"b",
	"uf",
	"df",
	"ub",
	"db",
	"n",
	"comboArrow",
	"[",
	"]",
]);

export async function processTekkenNotation(
	source: string,
	el: HTMLElement,
	app: App
) {
	const { name, modifiedSource } = parseNameFromSource(source);
	const moves = modifiedSource.split(",");

	const canvasDimensions = calculateCanvasDimensions(moves.length);
	const canvas = createCanvasElement(canvasDimensions);
	const ctx = canvas.getContext("2d");
	if (!ctx) return console.error("Unable to get canvas context");

	console.log(canvasDimensions);
	await drawBackground(ctx, app, canvasDimensions);

	if (name) drawTextOnCanvas(ctx, name);

	await drawMoves(ctx, app, moves);

	appendImageToElement(el, canvas);
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

function drawErrorMessageOnCanvas(
	ctx: CanvasRenderingContext2D,
	message: string
) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas
	ctx.font = "bold 17px Arial";
	ctx.fillStyle = "red";
	ctx.fillText(message, 10, 50); // Adjust text position as needed
}

function determineImagePathForMove(move: string) {
	let imagePath = "";

	// Attack moves: Contain numbers (e.g., "1", "2+3")
	if (/\d/.test(move)) {
		imagePath = `/attack-buttons/${move}.png`;
	}
	// Hold moves: Capital letters without numbers (e.g., "F", "D")
	else if (/^[A-Z]+$/.test(move)) {
		imagePath = `/hold-direction/${move.toLowerCase()}.png`; // Assuming image names are lowercase
	}
	// Press moves: Lowercase letters (e.g., "a", "b")
	else if (/^[a-z]+$/.test(move)) {
		imagePath = `/press-direction/${move}.png`;
	}
	// Misc symbols: "-", "[", "]"
	else if (["-", "[", "]"].includes(move)) {
		imagePath = `/misc/${move}.png`;
	}
	// Provide a fallback for unrecognized moves, or handle them as needed
	else {
		console.warn(`Unrecognized move: ${move}`);
		// Optionally return a default image path or null if you want to skip drawing
		// imagePath = `$/misc/default.png`; // Example default path
		return null; // Skip drawing this move
	}

	return imagePath;
}

function parseNameFromSource(source: string) {
	let name = "";
	if (source.startsWith('"')) {
		const endIndex = source.indexOf('"', 1);
		if (endIndex !== -1) {
			name = source.substring(1, endIndex);
			source = source.substring(endIndex + 2).trim();
		}
	}
	return { name, modifiedSource: source };
}

function calculateCanvasDimensions(totalMoves: number) {
	const startWidth = 110,
		middleWidth = 50,
		endWidth = 10;
	const totalWidth =
		startWidth + middleWidth * Math.ceil(totalMoves) + endWidth;
	return { totalWidth, startWidth, middleWidth, endWidth, height: 121 };
}

function createCanvasElement({
	totalWidth,
	height,
}: {
	totalWidth: number;
	height: number;
}): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = totalWidth;
	canvas.height = height;
	return canvas;
}

// Utility function to load images
export function loadImage(
	app: App,
	fileName: string
): Promise<HTMLImageElement> {
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

function drawTextOnCanvas(ctx: CanvasRenderingContext2D, text: string) {
	ctx.font = "bold 24px Verdana";
	ctx.fillStyle = "white";
	ctx.fillText(text, 20, 35); // Consider making these values configurable or calculated
}

async function appendImageToElement(
	el: HTMLElement,
	canvas: HTMLCanvasElement
) {
	const img = document.createElement("img");
	img.src = canvas.toDataURL();
	img.alt = "Tekken notation";
	el.empty();
	el.appendChild(img);
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
