import { Plugin } from "obsidian";
import {
	TekkenNotationSettings,
	DEFAULT_SETTINGS,
	processTekkenNotation,
} from "./tekken-notation";

export default class TekkenNotation extends Plugin {
	settings: TekkenNotationSettings;

	async onload() {
		await this.loadSettings();

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
