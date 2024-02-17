import { App } from "obsidian";

export interface MyPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

const LEGAL_MOVES = new Set([
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
]);

export async function processTekkenNotation(source: string, el: HTMLElement, app: App) {
	// Split the source by commas to handle sequential inputs
	const moves = source.split(",");

	// Create a canvas element (assuming you know the dimensions of your background)
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		console.error("Unable to get canvas context");
		return;
	}

	canvas.width = 320;
	canvas.height = 121;

	try {
		// Load and draw the background image
		const backgroundImage = await loadImage(app, "background.png");
		ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

		// Start X position for the first image
		let xPos = 0;

		// Load and overlay the button images
		for (const move of moves) {
			const trimmedMove = move.trim().replace(/\s+/g, "+");

			if (!LEGAL_MOVES.has(trimmedMove)) {
				console.error(`Illegal move: ${trimmedMove}`);
				continue; // Skip illegal moves
			}

			const fileName = `/attack-buttons/${trimmedMove}.png`;
			try {
				const buttonImage = await loadImage(app, fileName);
				ctx.drawImage(buttonImage, xPos, 0);
				xPos += 50; // Increment the x position for the next image
			} catch (error) {
				console.error(
					`Error loading image for move: ${trimmedMove}`,
					error
				);
			}
		}

		// Convert the canvas to a Data URL and set it as the source for an image element
		const img = document.createElement("img");
		img.src = canvas.toDataURL();
		img.alt = "Tekken notation";

		// Clear the element and append the new image
		el.empty();
		el.appendChild(img);
	} catch (error) {
		console.error("Error loading images:", error);
	}
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
