import { App } from "obsidian";

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

interface CanvasDimensions {
	totalWidth: number;
	height: number;
	startWidth: number; // Add this line
	middleWidth: number; // Add this line
	endWidth: number; // Add this line
}


interface NameEndTextSource {
	name: string;
	endText: string;
	modifiedSource: string;
}

export async function processTekkenNotation(
	source: string,
	el: HTMLElement,
	app: App
) {
	const { name, endText, modifiedSource } = extractNameAndEndText(source);

	const moves = parseMoves(modifiedSource);

	const processedMoves: Promise<[string, boolean][]> = processMoves(
		app,
		moves
	);

	const canvasDimensions = await calculateCanvasDimensions(
		processedMoves,
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

	await drawMoves(ctx, app, processedMoves);

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
	const shortcuts: { [key: string]: string[] } = {
		qcf: ["d", "df", "f"],
		qcb: ["d", "db", "b"],
		hcf: ["b", "db", "d", "df", "f"],
		hcb: ["f", "df", "d", "db", "b"],
	};

	// Split the source string into individual moves
	let moves = source.split(",").filter((move) => move.trim() !== "");

	// Expand any shortcut inputs into their full sequences
	moves = moves.flatMap((move) => {
		move = move.trim();
		if (Object.hasOwnProperty.call(shortcuts, move)) {
			return shortcuts[move];
		} else {
			return [move];
		}
	});

	return moves;
}

async function calculateCanvasDimensions(
	processedMovesPromise: Promise<[string, boolean][]>,
	name = "",
	endText = ""
): Promise<CanvasDimensions> {
	const processedMoves = await processedMovesPromise; // Ensure processedMoves is resolved
	const startWidth = 110,
		endWidth = 10,
		middleWidth = 50;
	const nameWidth = estimateTextWidth(name, 22);
	const endTextWidth = estimateTextWidth(endText, 18);
	const gap = endText ? 30 : 0; // Add a gap between name and endText if both are present

	let movesWidth = 0;
	for (const [move, isProcessed] of processedMoves) {
		if (isProcessed) {
			movesWidth += middleWidth; // Each processed move takes up one middleWidth
		} else {
			// For unprocessed moves, estimate text width and convert to equivalent middleWidths
			const textWidth = estimateTextWidth(move, 20); // Assuming the same font size as in drawUnrecognizedMoveAsText
			movesWidth += Math.ceil(textWidth / middleWidth) * middleWidth; // Round up to the nearest middleWidth
		}
	}

	const totalWidth =
		startWidth + movesWidth + endWidth + nameWidth + endTextWidth + gap;

	return { totalWidth, startWidth, middleWidth, endWidth, height: 121 };
}

async function processMoves(
	app: App,
	moves: string[]
): Promise<[string, boolean][]> {
	const processedMoves: [string, boolean][] = [];
	for (let i = 0; i < moves.length; i++) {
		const move = moves[i].trim();
		const imagePath = determineImagePathForMove(move);
		try {
			await loadImage(app, imagePath);
			processedMoves.push([move, true]);
		} catch (error) {
			processedMoves.push([move, false]);
		}
	}
	return processedMoves;
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
	for (let i = 0; i <= middleImagesCount; i++) {
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
	processedMovesPromise: Promise<[string, boolean][]>
) {
	const processedMoves = await processedMovesPromise; // Wait for the promise to resolve
	let xPos = 0; // Adjusted start position for the first move, assuming some initial offset

	for (const [move, moveProcessed] of processedMoves) {
		const imagePath = determineImagePathForMove(move);

		if (moveProcessed) {
			try {
				const image = await loadImage(app, imagePath);
				ctx.drawImage(image, xPos, 0);
				// if imagePath contains [.png or ].png, then add 25 instead of 50
				if (imagePath.includes("/[.png") || imagePath.includes("/].png") || imagePath.includes("/-.png")) {
					xPos += 25;
				} else {
					xPos += 50;
				}
			} catch (error) {
				console.error(`Error loading image for move: ${move}`, error);
				drawErrorMessageOnCanvas(ctx, `Error loading image for move: ${move}`);
			}
		} else {
			// For unrecognized or failed moves, draw the move as text
			drawUnrecognizedMoveAsText(ctx, move, xPos + 50);
			// Measure the width of the drawn text to update xPos correctly for the next move
			const textWidth = ctx.measureText(move).width;
			xPos += textWidth + 30; // Add some padding after the text
		}
	}
}

function drawUnrecognizedMoveAsText(
	ctx: CanvasRenderingContext2D,
	move: string,
	x: number
) {
	ctx.font = `bold 20px Arial`;
	ctx.fillStyle = "white"; // Set text color
	const y = 90; // Fixed y position for drawing text
	ctx.fillText(move, x, y); // Draw the text
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
		const filePath = `obsidian-tekken-notation/images/${fileName}`;

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

function determineImagePathForMove(move: string): string {
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
		return move; // return without any image path
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
