'use strict';

import * as vscode from 'vscode';
import { ServiceBusProvider, NameSpace, TopicList, QueueList } from './serviceBusProvider';
import { addNamespace } from './addNamespace';
import { editNamespace } from './editNamespace';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "service-bus-explorer" is now active!');

	const serviceBusProvider = new ServiceBusProvider(context);
	

	vscode.window.registerTreeDataProvider('servicebus-namespaces', serviceBusProvider);
	serviceBusProvider.refresh(); //async refresh
	
	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.refreshEntry', () => {
			serviceBusProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.addEntry', async () => {
			var state = await addNamespace(context);
			serviceBusProvider.addNamespace( { name: state.name, connection: state.connectionString } );
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.editEntry', async (node: NameSpace) => {
			var state = await editNamespace(node, context);
			serviceBusProvider.editNamespace(node, { name: state.name, connection: state.connectionString } );
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.deleteEntry', (node: NameSpace) => {
			serviceBusProvider.deleteNamespace(node);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.refreshTopicList', (node: TopicList) => {
			vscode.window.showInformationMessage('Refresh Topic List not implemented!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('serviceBusExplorer.refreshQueueList', (node: QueueList) => {
			vscode.window.showInformationMessage('Refresh Queue List not implemented!');
		})
	);
}

export function deactivate() { }