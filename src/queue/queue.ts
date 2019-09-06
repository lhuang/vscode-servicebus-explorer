import { TreeItemCollapsibleState, Command } from "vscode";
import { ExplorerItemBase, IItemData } from "../common/explorerItemBase";
import { QueueList } from "./queueList";

export class Queue extends ExplorerItemBase {

	constructor(
		public itemData: IItemData,
		title: string,
		command?: Command
	) {
		super(itemData, 0, command);
		this.label = title;
	}

	contextValue = 'queue';
}