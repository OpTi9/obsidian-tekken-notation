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
			let imagePath = "";

			// Check if the move is an attack move (contains numbers)
			if (/\d/.test(trimmedMove)) {
				imagePath = `/attack-buttons/${trimmedMove}.png`;
			}
			// Check if the move is a hold move (capital letter without numbers)
			else if (/^[A-Z]+$/.test(trimmedMove)) {
				imagePath = `/hold-direction/${trimmedMove.toLowerCase()}.png`; // Assuming image names are lowercase
			}
			// Check if the move is a press move (lowercase letter)
			else if (/^[a-z]+$/.test(trimmedMove)) {
				imagePath = `/press-direction/${trimmedMove}.png`;
			} else if (["-", "[", "]"].includes(trimmedMove)) {
				// Misc symbols
				// Assuming misc symbols are stored in a 'misc' directory
				imagePath = `/misc/${trimmedMove}.png`;
				// Special handling for misc symbols if necessary
				// For example, you might want to adjust xPos differently for these symbols,
				// or they might not correspond to an image at all and instead affect the layout or logic.
			}
			// Handle misc moves or provide a default case if needed
			else {
				// Example default case (adjust as necessary)
				console.error(`Unrecognized or misc move: ${trimmedMove}`);
				continue;
			}

			// Attempt to load and draw the image
			try {
				const buttonImage = await loadImage(app, imagePath);
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
