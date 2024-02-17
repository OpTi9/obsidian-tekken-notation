import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
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

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);

		this.registerMarkdownCodeBlockProcessor("tekken", (source, el, ctx) => {
			this.processTekkenNotation(source, el);
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async processTekkenNotation(source: string, el: HTMLElement) {
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
			const backgroundImage = await this.loadImage("background.png");
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
					const buttonImage = await this.loadImage(fileName);
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
	loadImage(fileName: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			// Corrected path that includes the `.obsidian/plugins` segment
			const filePath = `obsidian-sample-plugin/images/${fileName}`;

			this.app.vault.adapter
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
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
