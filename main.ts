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
import {
	TekkenNotationSettings,
	DEFAULT_SETTINGS,
	processTekkenNotation,
} from "./tekken-notation";

export default class TekkenNotation extends Plugin {
	settings: TekkenNotationSettings;

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
		this.addSettingTab(new TekkenNotationSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);

		this.registerMarkdownCodeBlockProcessor("tekken", (source, el) => {
			processTekkenNotation(source, el, this.app);
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

class TekkenNotationSettingTab extends PluginSettingTab {
	plugin: TekkenNotation;

	constructor(app: App, plugin: TekkenNotation) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Wiki")
			.setDesc("Learn more about how to use the Tekken Notation plugin.")
			.addButton((button) => {
				button.setButtonText("Open Wiki").onClick(() => {
					window.open(
						"https://github.com/OpTi9/obsidian-tekken-notation/wiki",
						"_blank"
					);
				});
			});

		new Setting(containerEl)
			.setName("Support")
			.setDesc(
				"If you like this Plugin and want to tip the creator, use the button below!"
			);

		// Instead of adding the button directly to the setting, create a container for custom layout
		const customContainer = containerEl.createDiv();
		customContainer.addClass("custom-container"); // Optional: Add a class for potential styling

		// Add the Buy Me A Coffee button to the custom container
		const buyMeACoffeeLink = "https://www.buymeacoffee.com/OpTi9";
		const buyMeACoffeeButton = this.buyMeACoffeeButton(buyMeACoffeeLink);

		// Append the button to the custom container
		customContainer.appendChild(buyMeACoffeeButton);
	}

	// Function to create a Buy Me A Coffee button
	buyMeACoffeeButton(link: string): HTMLElement {
		const a = document.createElement("a");
		a.setAttribute("href", link);
		a.classList.add("buymeacoffee-OpTi9-img");

		const img = document.createElement("img");
		img.setAttribute(
			"src",
			"https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=OpTi9&button_colour=e3e7ef&font_colour=262626&font_family=Poppins&outline_colour=262626&coffee_colour=ff0000"
		);
		img.setAttribute("height", "30px");
		img.setAttribute("width", "150px");

		a.appendChild(img); // Append the image to the link element

		return a;
	}
}
